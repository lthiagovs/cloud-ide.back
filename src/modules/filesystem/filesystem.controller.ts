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
import { CreateFileSystemItemDto } from './dto/create-filesystem.dto';
import { FileSystemService } from './filesystem.service';
import { UpdateFileSystemItemDto } from './dto/update-filesystem.dto';

@ApiTags('filesystem')
@ApiBearerAuth()
@Controller('projects/:projectId/filesystem')
export class FileSystemController {
  constructor(private readonly fileSystemService: FileSystemService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new file or folder' })
  @ApiResponse({ status: 201, description: 'FileSystem item created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or item already exists' })
  async create(
    @Param('projectId') projectId: string,
    @Body() createFileSystemItemDto: CreateFileSystemItemDto,
    @Request() req,
  ) {
    return this.fileSystemService.create(projectId, createFileSystemItemDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all files and folders in project' })
  @ApiResponse({ status: 200, description: 'FileSystem items retrieved successfully' })
  async findAll(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    return this.fileSystemService.findByProject(projectId, req.user.id);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get file tree structure' })
  @ApiResponse({ status: 200, description: 'File tree retrieved successfully' })
  async getTree(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    return this.fileSystemService.getFileTree(projectId, req.user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search files by name or content' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async search(
    @Param('projectId') projectId: string,
    @Query('q') query: string,
    @Request() req,
  ) {
    return this.fileSystemService.searchFiles(projectId, query, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file or folder by id' })
  @ApiResponse({ status: 200, description: 'FileSystem item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'FileSystem item not found' })
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.fileSystemService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update file or folder' })
  @ApiResponse({ status: 200, description: 'FileSystem item updated successfully' })
  @ApiResponse({ status: 404, description: 'FileSystem item not found' })
  @ApiResponse({ status: 400, description: 'Item is readonly or invalid input' })
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateFileSystemItemDto: UpdateFileSystemItemDto,
    @Request() req,
  ) {
    return this.fileSystemService.update(id, updateFileSystemItemDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete file or folder' })
  @ApiResponse({ status: 204, description: 'FileSystem item deleted successfully' })
  @ApiResponse({ status: 404, description: 'FileSystem item not found' })
  @ApiResponse({ status: 400, description: 'Item is readonly' })
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.fileSystemService.remove(id, req.user.id);
  }
}