import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ExecutionService } from "./execution.service";

@ApiTags('user-execution')
@ApiBearerAuth()
@Controller('user/execution')
export class UserExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get user execution logs across all projects' })
  @ApiResponse({ status: 200, description: 'User execution logs retrieved successfully' })
  async getUserExecutionLogs(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.executionService.getUserExecutionLogs(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }
}