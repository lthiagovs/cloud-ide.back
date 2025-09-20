import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectService, CreateProjectDto, UpdateProjectDto, AddCollaboratorDto } from './project.service';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    return this.projectService.create(createProjectDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user projects with pagination' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.projectService.findAll(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('by-language/:language')
  @ApiOperation({ summary: 'Get public projects by programming language' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async findByLanguage(
    @Param('language') language: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.projectService.findByLanguage(
      language,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.projectService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Edit access denied' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req,
  ) {
    return this.projectService.update(id, updateProjectDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project (soft delete)' })
  @ApiResponse({ status: 204, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Only owner can delete project' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.projectService.remove(id, req.user.id);
  }

  @Post(':id/collaborators')
  @ApiOperation({ summary: 'Add collaborator to project' })
  @ApiResponse({ status: 200, description: 'Collaborator added successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async addCollaborator(
    @Param('id') id: string,
    @Body() addCollaboratorDto: AddCollaboratorDto,
    @Request() req,
  ) {
    return this.projectService.addCollaborator(id, addCollaboratorDto, req.user.id);
  }

  @Delete(':id/collaborators/:collaboratorId')
  @ApiOperation({ summary: 'Remove collaborator from project' })
  @ApiResponse({ status: 200, description: 'Collaborator removed successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async removeCollaborator(
    @Param('id') id: string,
    @Param('collaboratorId') collaboratorId: string,
    @Request() req,
  ) {
    return this.projectService.removeCollaborator(id, collaboratorId, req.user.id);
  }
}