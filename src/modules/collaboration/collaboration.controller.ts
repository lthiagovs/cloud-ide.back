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
import { CollaborationService } from './collaboration.service';
import { JoinSessionDto } from './dto/join-session.dto';
import { AddOperationDto } from './dto/add-operation.dto';
import { UpdateCursorDto } from './dto/update-cursor.dto';

@ApiTags('collaboration')
@ApiBearerAuth()
@Controller('projects/:projectId/collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Post('join')
  @ApiOperation({ summary: 'Join collaboration session' })
  @ApiResponse({ status: 200, description: 'Successfully joined session' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async joinSession(
    @Param('projectId') projectId: string,
    @Body() joinSessionDto: JoinSessionDto,
    @Request() req,
  ) {
    return this.collaborationService.joinSession(projectId, req.user.id, joinSessionDto);
  }

  @Post('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave collaboration session' })
  @ApiResponse({ status: 204, description: 'Successfully left session' })
  async leaveSession(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    return this.collaborationService.leaveSession(projectId, req.user.id);
  }

  @Patch('cursor')
  @ApiOperation({ summary: 'Update cursor position' })
  @ApiResponse({ status: 200, description: 'Cursor position updated successfully' })
  @ApiResponse({ status: 404, description: 'Active session not found' })
  async updateCursor(
    @Param('projectId') projectId: string,
    @Body() updateCursorDto: UpdateCursorDto,
    @Request() req,
  ) {
    return this.collaborationService.updateCursor(projectId, req.user.id, updateCursorDto);
  }

  @Post('operations')
  @ApiOperation({ summary: 'Add collaborative operation' })
  @ApiResponse({ status: 200, description: 'Operation added successfully' })
  @ApiResponse({ status: 404, description: 'Active session not found' })
  async addOperation(
    @Param('projectId') projectId: string,
    @Body() addOperationDto: AddOperationDto,
    @Request() req,
  ) {
    return this.collaborationService.addOperation(projectId, req.user.id, addOperationDto);
  }

  @Get('session')
  @ApiOperation({ summary: 'Get active collaboration session' })
  @ApiResponse({ status: 200, description: 'Active session retrieved successfully' })
  async getActiveSession(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    return this.collaborationService.getActiveSession(projectId, req.user.id);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get active users in collaboration session' })
  @ApiResponse({ status: 200, description: 'Active users retrieved successfully' })
  async getActiveUsers(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    return this.collaborationService.getActiveUsers(projectId, req.user.id);
  }

  @Get('operations')
  @ApiOperation({ summary: 'Get recent operations' })
  @ApiResponse({ status: 200, description: 'Recent operations retrieved successfully' })
  async getRecentOperations(
    @Param('projectId') projectId: string,
    @Query('limit') limit: string = '100',
    @Request() req,
  ) {
    return this.collaborationService.getRecentOperations(
      projectId, 
      req.user.id, 
      parseInt(limit)
    );
  }

  @Patch('file/:fileId')
  @ApiOperation({ summary: 'Switch to different file in collaboration session' })
  @ApiResponse({ status: 200, description: 'File switched successfully' })
  @ApiResponse({ status: 404, description: 'Active session not found' })
  async switchFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Request() req,
  ) {
    return this.collaborationService.switchFile(projectId, req.user.id, fileId);
  }
}