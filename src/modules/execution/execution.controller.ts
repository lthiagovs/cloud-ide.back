import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExecuteCommandDto } from './dto/execute-command.dto';
import { ExecutionService } from './execution.service';

@ApiTags('execution')
@ApiBearerAuth()
@Controller('projects/:projectId/execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post('execute')
  @ApiOperation({ summary: 'Execute command in project environment' })
  @ApiResponse({ status: 200, description: 'Command executed successfully' })
  @ApiResponse({ status: 400, description: 'Execute access denied or invalid command' })
  @ApiResponse({ status: 404, description: 'Project or file not found' })
  async executeCommand(
    @Param('projectId') projectId: string,
    @Body() executeCommandDto: ExecuteCommandDto,
    @Request() req,
  ) {
    return this.executionService.executeCommand(projectId, executeCommandDto, req.user.id);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get execution logs for project' })
  @ApiResponse({ status: 200, description: 'Execution logs retrieved successfully' })
  async getExecutionLogs(
    @Param('projectId') projectId: string,
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    return this.executionService.getExecutionLogs(
      projectId,
      req.user.id,
      parseInt(page),
      parseInt(limit),
      status,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get execution statistics for project' })
  @ApiResponse({ status: 200, description: 'Execution statistics retrieved successfully' })
  async getExecutionStats(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    return this.executionService.getExecutionStats(projectId, req.user.id);
  }

  @Get('logs/:logId')
  @ApiOperation({ summary: 'Get specific execution log' })
  @ApiResponse({ status: 200, description: 'Execution log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Execution log not found' })
  async getExecutionLog(
    @Param('projectId') projectId: string,
    @Param('logId') logId: string,
    @Request() req,
  ) {
    return this.executionService.getExecutionLog(logId, req.user.id);
  }

  @Delete('logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete execution logs' })
  @ApiResponse({ status: 200, description: 'Execution logs deleted successfully' })
  async deleteExecutionLogs(
    @Param('projectId') projectId: string,
    @Request() req,
    @Query('olderThan') olderThan?: string,
  ) {
    const olderThanDate = olderThan ? new Date(olderThan) : undefined;
    const deletedCount = await this.executionService.deleteExecutionLogs(
      projectId,
      req.user.id,
      olderThanDate,
    );
    
    return { message: `${deletedCount} execution logs deleted` };
  }
}