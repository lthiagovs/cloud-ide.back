import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as path from 'path';
import * as mime from 'mime-types';
import { ProjectService } from '../project/project.service';
import { FileSystemItem, FileSystemItemDocument } from 'src/schemas/file-system-item.schema';
import { CreateFileSystemItemDto } from './dto/create-filesystem.dto';
import { UpdateFileSystemItemDto } from './dto/update-filesystem.dto';

@Injectable()
export class FileSystemService {
  constructor(
    @InjectModel(FileSystemItem.name) private fileSystemItemModel: Model<FileSystemItemDocument>,
    private projectService: ProjectService,
  ) {}

  async create(
    projectId: string,
    createFileSystemItemDto: CreateFileSystemItemDto,
    userId: string,
  ): Promise<FileSystemItem> {
    // Verificar se o usuário tem acesso ao projeto
    await this.projectService.findOne(projectId, userId);

    const { name, type, parentId, content, metadata } = createFileSystemItemDto;

    // Determinar o caminho
    let fullPath = name;
    let parent: FileSystemItemDocument | null = null;

    if (parentId) {
      parent = await this.fileSystemItemModel.findById(parentId);
      if (!parent || parent.type !== 'folder') {
        throw new BadRequestException('Invalid parent folder');
      }
      fullPath = path.posix.join(parent.path, name);
    }

    // Verificar se já existe item com mesmo caminho no projeto
    const existing = await this.fileSystemItemModel.findOne({
      project: new Types.ObjectId(projectId),
      path: fullPath,
    });

    if (existing) {
      throw new BadRequestException('Item with same path already exists');
    }

    const fileSystemItem = new this.fileSystemItemModel({
      name,
      type,
      path: fullPath,
      project: new Types.ObjectId(projectId),
      parent: parentId ? new Types.ObjectId(parentId) : null,
      content: type === 'file' ? content : undefined,
      mimeType: type === 'file' ? mime.lookup(name) || 'text/plain' : undefined,
      extension: type === 'file' ? path.extname(name).slice(1) : undefined,
      metadata: {
        encoding: 'utf8',
        readonly: false,
        ...metadata,
      },
      createdBy: new Types.ObjectId(userId),
      lastModifiedBy: new Types.ObjectId(userId),
      children: type === 'folder' ? [] : undefined,
    });

    const savedItem = await fileSystemItem.save();

    // Adicionar ao parent se existir
    if (parent) {
      parent.children.push(savedItem._id as Types.ObjectId);
      await parent.save();
    }

    // Adicionar histórico
    await this.addHistory(savedItem._id as Types.ObjectId, userId, 'created', undefined, name);

    // Atualizar tamanho total do projeto
    await this.updateProjectTotalSize(projectId);

    return savedItem;
  }


  async findByProject(projectId: string, userId: string): Promise<FileSystemItem[]> {
    // Verificar acesso ao projeto
    await this.projectService.findOne(projectId, userId);

    return this.fileSystemItemModel
      .find({ project: new Types.ObjectId(projectId) })
      .populate('children')
      .sort({ type: 1, name: 1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<FileSystemItem> {
    const item = await this.fileSystemItemModel
      .findById(id)
      .populate('project')
      .populate('parent')
      .populate('children')
      .exec();

    if (!item) {
      throw new NotFoundException('FileSystem item not found');
    }

    // Verificar acesso ao projeto
    await this.projectService.findOne(item.project.toString(), userId);

    return item;
  }

  async update(
    id: string,
    updateFileSystemItemDto: UpdateFileSystemItemDto,
    userId: string,
  ): Promise<FileSystemItem> {
    const item = await this.fileSystemItemModel.findById(id);

    if (!item) {
      throw new NotFoundException('FileSystem item not found');
    }

    // Verificar acesso ao projeto
    await this.projectService.findOne(item.project.toString(), userId);

    // Verificar se não é readonly
    if (item.metadata?.readonly) {
      throw new BadRequestException('Item is readonly');
    }

    const oldName = item.name;
    const oldContent = item.content;

    // Atualizar campos
    if (updateFileSystemItemDto.name && updateFileSystemItemDto.name !== item.name) {
      // Verificar se novo nome não conflita
      const newPath = path.posix.join(path.dirname(item.path), updateFileSystemItemDto.name);
      const existing = await this.fileSystemItemModel.findOne({
        project: item.project,
        path: newPath,
        _id: { $ne: item._id },
      });

      if (existing) {
        throw new BadRequestException('Item with same name already exists');
      }

      item.name = updateFileSystemItemDto.name;
      item.path = newPath;

      // Adicionar histórico de rename
      await this.addHistory(item._id as Types.ObjectId, userId, 'renamed', oldName, updateFileSystemItemDto.name);
    }

    if (updateFileSystemItemDto.content !== undefined && item.type === 'file') {
      item.content = updateFileSystemItemDto.content;
      
      // Adicionar histórico de modificação
      await this.addHistory(item._id as Types.ObjectId, userId, 'modified', oldContent, updateFileSystemItemDto.content);
    }

    if (updateFileSystemItemDto.metadata) {
      item.metadata = { ...item.metadata, ...updateFileSystemItemDto.metadata };
    }

    item.lastModifiedBy = new Types.ObjectId(userId);
    item.lastModified = new Date();

    const updatedItem = await item.save();

    // Atualizar tamanho total do projeto
    await this.updateProjectTotalSize(item.project.toString());

    return updatedItem;
  }

  async remove(id: string, userId: string): Promise<void> {
    const item = await this.fileSystemItemModel.findById(id);

    if (!item) {
      throw new NotFoundException('FileSystem item not found');
    }

    // Verificar acesso ao projeto
    await this.projectService.findOne(item.project.toString(), userId);

    // Verificar se não é readonly
    if (item.metadata?.readonly) {
      throw new BadRequestException('Item is readonly');
    }

    // Se for pasta, remover recursivamente
    if (item.type === 'folder' && item.children.length > 0) {
      for (const childId of item.children) {
        await this.remove(childId.toString(), userId);
      }
    }

    // Remover do parent
    if (item.parent) {
      await this.fileSystemItemModel.findByIdAndUpdate(
        item.parent,
        { $pull: { children: item._id } }
      );
    }

    // Adicionar histórico
    await this.addHistory(item._id as Types.ObjectId, userId, 'deleted', item.name, undefined);

    // Remover item
    await this.fileSystemItemModel.findByIdAndDelete(id);

    // Atualizar tamanho total do projeto
    await this.updateProjectTotalSize(item.project.toString());
  }

  async getFileTree(projectId: string, userId: string): Promise<any[]> {
    // Verificar acesso ao projeto
    await this.projectService.findOne(projectId, userId);

    const items = await this.fileSystemItemModel
      .find({ project: new Types.ObjectId(projectId) })
      .sort({ type: 1, name: 1 })
      .exec();

    // Construir árvore
    const itemMap = new Map<string, any>();
    const rootItems: any[] = [];

    // Primeiro, criar mapa de todos os itens
    items.forEach(item => {
      itemMap.set((item._id as Types.ObjectId).toString(), {
        ...item.toObject(),
        children: []
      });
    });

    // Depois, construir hierarquia
    items.forEach(item => {
      const itemObj = itemMap.get((item._id as Types.ObjectId).toString());
      
      if (item.parent) {
        const parentObj = itemMap.get(item.parent.toString());
        if (parentObj) {
          parentObj.children.push(itemObj);
        }
      } else {
        rootItems.push(itemObj);
      }
    });

    return rootItems;
  }

  async searchFiles(projectId: string, query: string, userId: string): Promise<FileSystemItem[]> {
    // Verificar acesso ao projeto
    await this.projectService.findOne(projectId, userId);

    return this.fileSystemItemModel
      .find({
        project: new Types.ObjectId(projectId),
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(50)
      .exec();
  }

  private async addHistory(
    itemId: Types.ObjectId,
    userId: string,
    action: string,
    oldValue?: string,
    newValue?: string,
  ): Promise<void> {
    await this.fileSystemItemModel.findByIdAndUpdate(itemId, {
      $push: {
        history: {
          user: new Types.ObjectId(userId),
          action,
          timestamp: new Date(),
          oldValue,
          newValue,
        }
      }
    });
  }

  private async updateProjectTotalSize(projectId: string): Promise<void> {
    const result = await this.fileSystemItemModel.aggregate([
      { $match: { project: new Types.ObjectId(projectId), type: 'file' } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);

    const totalSize = result[0]?.totalSize || 0;
    await this.projectService.updateTotalSize(projectId, totalSize);
  }
}