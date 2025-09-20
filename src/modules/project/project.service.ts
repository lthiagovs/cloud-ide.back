import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from 'src/schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto, ownerId: string): Promise<Project> {
    const project = new this.projectModel({
      ...createProjectDto,
      owner: new Types.ObjectId(ownerId),
    });
    return project.save();
  }

  async findAll(userId: string, page: number = 1, limit: number = 10): Promise<{
    projects: Project[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const userObjectId = new Types.ObjectId(userId);

    const [projects, total] = await Promise.all([
      this.projectModel
        .find({
          $or: [
            { owner: userObjectId },
            { 'collaborators.user': userObjectId },
            { isPublic: true }
          ],
          isActive: true
        })
        .populate('owner', 'name email')
        .populate('collaborators.user', 'name email')
        .sort({ lastAccessed: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.projectModel.countDocuments({
        $or: [
          { owner: userObjectId },
          { 'collaborators.user': userObjectId },
          { isPublic: true }
        ],
        isActive: true
      })
    ]);

    return {
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.projectModel
      .findById(id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email')
      .populate('files')
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verificar permissões
    if (!this.hasAccess(project, userId)) {
      throw new ForbiddenException('Access denied');
    }

    // Atualizar lastAccessed
    project.lastAccessed = new Date();
    await project.save();

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.projectModel.findById(id);
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!this.hasEditAccess(project, userId)) {
      throw new ForbiddenException('Edit access denied');
    }

    Object.assign(project, updateProjectDto);
    return project.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(id);
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner.toString() !== userId) {
      throw new ForbiddenException('Only owner can delete project');
    }

    project.isActive = false;
    await project.save();
  }

  async addCollaborator(projectId: string, addCollaboratorDto: AddCollaboratorDto, userId: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!this.hasAdminAccess(project, userId)) {
      throw new ForbiddenException('Admin access required');
    }

    const existingCollaborator = project.collaborators.find(
      c => c.user.toString() === addCollaboratorDto.userId
    );

    if (existingCollaborator) {
      existingCollaborator.role = addCollaboratorDto.role;
    } else {
      project.collaborators.push({
        user: new Types.ObjectId(addCollaboratorDto.userId),
        role: addCollaboratorDto.role,
        addedAt: new Date()
      });
    }

    return project.save();
  }

  async removeCollaborator(projectId: string, collaboratorId: string, userId: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!this.hasAdminAccess(project, userId)) {
      throw new ForbiddenException('Admin access required');
    }

    project.collaborators = project.collaborators.filter(
      c => c.user.toString() !== collaboratorId
    );

    return project.save();
  }

  async findByLanguage(language: string, page: number = 1, limit: number = 10): Promise<Project[]> {
    const skip = (page - 1) * limit;
    
    return this.projectModel
      .find({ language, isPublic: true, isActive: true })
      .populate('owner', 'name email')
      .sort({ lastAccessed: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async updateTotalSize(projectId: string, size: number): Promise<void> {
    await this.projectModel.findByIdAndUpdate(projectId, { totalSize: size });
  }

  private hasAccess(project: Project, userId: string): boolean {
    if (project.isPublic) return true;
    if (project.owner.toString() === userId) return true;
    return project.collaborators.some(c => c.user.toString() === userId);
  }

  private hasEditAccess(project: Project, userId: string): boolean {
    if (project.owner.toString() === userId) return true;
    const collaborator = project.collaborators.find(c => c.user.toString() === userId);
    return !!collaborator && ['editor', 'admin'].includes(collaborator.role);
  }

  private hasAdminAccess(project: Project, userId: string): boolean {
    if (project.owner.toString() === userId) return true;
    const collaborator = project.collaborators.find(c => c.user.toString() === userId);
    return !!(collaborator && collaborator.role === 'admin');
  }
}