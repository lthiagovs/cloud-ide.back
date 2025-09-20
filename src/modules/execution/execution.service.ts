import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProjectService } from '../project/project.service';
import { FileSystemService } from '../filesystem/filesystem.service';
import { ExecutionLog, ExecutionLogDocument } from 'src/schemas/execution-log.schema';
import { ExecutionResult } from './dto/execution-result.dto';
import { ExecuteCommandDto } from './dto/execute-command.dto';

@Injectable()
export class ExecutionService {
  constructor(
    @InjectModel(ExecutionLog.name) private executionLogModel: Model<ExecutionLogDocument>,
    private projectService: ProjectService,
    private fileSystemService: FileSystemService,
  ) {}

  async executeCommand(
    projectId: string,
    executeCommandDto: ExecuteCommandDto,
    userId: string,
  ): Promise<ExecutionResult> {
    // Verificar acesso ao projeto
    const project = await this.projectService.findOne(projectId, userId);

    // Verificar se o usuário tem permissão de execução
    if (!this.hasExecuteAccess(project, userId)) {
      throw new BadRequestException('Execute access denied');
    }

    const { command, fileId, timeout = 30000 } = executeCommandDto;
    const startTime = Date.now();

    let file: any = null;
    if (fileId) {
      file = await this.fileSystemService.findOne(fileId, userId);
    }

    try {
      // Simular execução (substitua por implementação real)
      const result = await this.simulateExecution(command, timeout);
      
      const executionTime = Date.now() - startTime;

      // Salvar log de execução
      const executionLog = new this.executionLogModel({
        project: new Types.ObjectId(projectId),
        user: new Types.ObjectId(userId),
        file: fileId ? new Types.ObjectId(fileId) : null,
        command,
        output: result.output,
        error: result.error,
        status: result.status,
        executionTime,
        memoryUsed: result.memoryUsed,
        cpuUsed: result.cpuUsed,
        exitCode: result.exitCode,
        executedAt: new Date(),
      });

      await executionLog.save();

      return {
        output: result.output,
        error: result.error,
        status: result.status,
        executionTime,
        memoryUsed: result.memoryUsed,
        cpuUsed: result.cpuUsed,
        exitCode: result.exitCode,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Salvar log de erro
      const executionLog = new this.executionLogModel({
        project: new Types.ObjectId(projectId),
        user: new Types.ObjectId(userId),
        file: fileId ? new Types.ObjectId(fileId) : null,
        command,
        error: error.message,
        status: 'error',
        executionTime,
        memoryUsed: 0,
        cpuUsed: 0,
        exitCode: 1,
        executedAt: new Date(),
      });

      await executionLog.save();

      return {
        error: error.message,
        status: 'error',
        executionTime,
        memoryUsed: 0,
        cpuUsed: 0,
        exitCode: 1,
      };
    }
  }

  async getExecutionLogs(
    projectId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<{
    logs: ExecutionLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Verificar acesso ao projeto
    await this.projectService.findOne(projectId, userId);

    const skip = (page - 1) * limit;
    const filter: any = { project: new Types.ObjectId(projectId) };

    if (status) {
      filter.status = status;
    }

    const [logs, total] = await Promise.all([
      this.executionLogModel
        .find(filter)
        .populate('user', 'name email')
        .populate('file', 'name path')
        .sort({ executedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.executionLogModel.countDocuments(filter),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserExecutionLogs(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    logs: ExecutionLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const filter = { user: new Types.ObjectId(userId) };

    const [logs, total] = await Promise.all([
      this.executionLogModel
        .find(filter)
        .populate('project', 'name')
        .populate('file', 'name path')
        .sort({ executedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.executionLogModel.countDocuments(filter),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getExecutionStats(projectId: string, userId: string): Promise<any> {
    // Verificar acesso ao projeto
    await this.projectService.findOne(projectId, userId);

    const stats = await this.executionLogModel.aggregate([
      { $match: { project: new Types.ObjectId(projectId) } },
      {
        $group: {
          _id: null,
          totalExecutions: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          },
          timeoutCount: {
            $sum: { $cond: [{ $eq: ['$status', 'timeout'] }, 1, 0] }
          },
          avgExecutionTime: { $avg: '$executionTime' },
          avgMemoryUsed: { $avg: '$memoryUsed' },
          avgCpuUsed: { $avg: '$cpuUsed' },
          totalExecutionTime: { $sum: '$executionTime' },
        }
      }
    ]);

    const recentExecutions = await this.executionLogModel
      .find({ project: new Types.ObjectId(projectId) })
      .sort({ executedAt: -1 })
      .limit(10)
      .populate('user', 'name')
      .populate('file', 'name')
      .exec();

    const topCommands = await this.executionLogModel.aggregate([
      { $match: { project: new Types.ObjectId(projectId) } },
      { $group: { _id: '$command', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return {
      overall: stats[0] || {
        totalExecutions: 0,
        successCount: 0,
        errorCount: 0,
        timeoutCount: 0,
        avgExecutionTime: 0,
        avgMemoryUsed: 0,
        avgCpuUsed: 0,
        totalExecutionTime: 0,
      },
      recentExecutions,
      topCommands,
    };
  }

  async getExecutionLog(logId: string, userId: string): Promise<ExecutionLog> {
    const log = await this.executionLogModel
      .findById(logId)
      .populate('project', 'name')
      .populate('user', 'name email')
      .populate('file', 'name path content')
      .exec();

    if (!log) {
      throw new NotFoundException('Execution log not found');
    }

    // Verificar acesso ao projeto
    await this.projectService.findOne(log.project._id.toString(), userId);

    return log;
  }

  async deleteExecutionLogs(projectId: string, userId: string, olderThan?: Date): Promise<number> {
    // Verificar acesso ao projeto
    await this.projectService.findOne(projectId, userId);

    const filter: any = { project: new Types.ObjectId(projectId) };
    
    if (olderThan) {
      filter.executedAt = { $lt: olderThan };
    }

    const result = await this.executionLogModel.deleteMany(filter);
    return result.deletedCount;
  }

  private hasExecuteAccess(project: any, userId: string): boolean {
    if (project.owner.toString() === userId) return true;
    
    const collaborator = project.collaborators.find(c => c.user.toString() === userId);
    return collaborator && ['editor', 'admin'].includes(collaborator.role);
  }

  private async simulateExecution(command: string, timeout: number): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Simular diferentes cenários baseados no comando
      setTimeout(() => {
        const executionTime = Date.now() - startTime;
        
        if (command.includes('error')) {
          resolve({
            error: 'Command execution failed',
            status: 'error',
            executionTime,
            memoryUsed: Math.random() * 100,
            cpuUsed: Math.random() * 50,
            exitCode: 1,
          });
        } else if (command.includes('timeout')) {
          resolve({
            error: 'Command execution timed out',
            status: 'timeout',
            executionTime: timeout,
            memoryUsed: Math.random() * 200,
            cpuUsed: Math.random() * 80,
            exitCode: 124,
          });
        } else {
          resolve({
            output: `Command '${command}' executed successfully`,
            status: 'success',
            executionTime,
            memoryUsed: Math.random() * 150,
            cpuUsed: Math.random() * 60,
            exitCode: 0,
          });
        }
      }, Math.min(Math.random() * 2000, timeout));
    });
  }
}