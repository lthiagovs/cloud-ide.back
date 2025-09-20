import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CollaborationSession, CollaborationSessionDocument } from 'src/schemas/collaboration-session.schema';
import { ProjectService } from '../project/project.service';
import { JoinSessionDto } from './dto/join-session.dto';
import { UpdateCursorDto } from './dto/update-cursor.dto';
import { AddOperationDto } from './dto/add-operation.dto';

@Injectable()
export class CollaborationService {
  constructor(
    @InjectModel(CollaborationSession.name) 
    private collaborationSessionModel: Model<CollaborationSessionDocument>,
    private projectService: ProjectService,
  ) {}

  async joinSession(projectId: string, userId: string, joinSessionDto?: JoinSessionDto): Promise<CollaborationSession> {
    // Verificar acesso ao projeto
    await this.projectService.findOne(projectId, userId);

    let session = await this.collaborationSessionModel.findOne({
      project: new Types.ObjectId(projectId),
      isActive: true,
    });

    if (!session) {
      // Criar nova sessão
      session = new this.collaborationSessionModel({
        project: new Types.ObjectId(projectId),
        activeUsers: [],
        currentFile: joinSessionDto?.fileId ? new Types.ObjectId(joinSessionDto.fileId) : null,
        operations: [],
        isActive: true,
        lastActivity: new Date(),
      });
    }

    // Verificar se usuário já está na sessão
    const existingUserIndex = session.activeUsers.findIndex(
      user => user.user.toString() === userId
    );

    if (existingUserIndex >= 0) {
      // Atualizar usuário existente
      session.activeUsers[existingUserIndex].isActive = true;
      session.activeUsers[existingUserIndex].lastSeen = new Date();
      if (joinSessionDto?.fileId) {
        session.activeUsers[existingUserIndex].cursor.file = new Types.ObjectId(joinSessionDto.fileId);
      }
    } else {
      // Adicionar novo usuário
      const defaultFileId = joinSessionDto?.fileId ? new Types.ObjectId(joinSessionDto.fileId) : new Types.ObjectId();
      session.activeUsers.push({
        user: new Types.ObjectId(userId),
        cursor: {
          line: 0,
          column: 0,
          file: defaultFileId,
        },
        isActive: true,
        joinedAt: new Date(),
        lastSeen: new Date(),
      });
    }

    session.lastActivity = new Date();
    return session.save();
  }

  async leaveSession(projectId: string, userId: string): Promise<void> {
    const session = await this.collaborationSessionModel.findOne({
      project: new Types.ObjectId(projectId),
      isActive: true,
    });

    if (!session) {
      return;
    }

    // Marcar usuário como inativo
    const userIndex = session.activeUsers.findIndex(
      user => user.user.toString() === userId
    );

    if (userIndex >= 0) {
      session.activeUsers[userIndex].isActive = false;
      session.activeUsers[userIndex].lastSeen = new Date();
    }

    // Remover usuários inativos há mais de 1 hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    session.activeUsers = session.activeUsers.filter(
      user => user.isActive || user.lastSeen > oneHourAgo
    );

    // Se não há usuários ativos, desativar sessão
    const hasActiveUsers = session.activeUsers.some(user => user.isActive);
    if (!hasActiveUsers) {
      session.isActive = false;
    }

    session.lastActivity = new Date();
    await session.save();
  }

  async updateCursor(projectId: string, userId: string, updateCursorDto: UpdateCursorDto): Promise<CollaborationSession> {
    const session = await this.collaborationSessionModel.findOne({
      project: new Types.ObjectId(projectId),
      isActive: true,
    });

    if (!session) {
      throw new NotFoundException('Active collaboration session not found');
    }

    const userIndex = session.activeUsers.findIndex(
      user => user.user.toString() === userId && user.isActive
    );

    if (userIndex < 0) {
      throw new NotFoundException('User not in active session');
    }

    // Atualizar cursor do usuário
    session.activeUsers[userIndex].cursor = {
      line: updateCursorDto.line,
      column: updateCursorDto.column,
      file: new Types.ObjectId(updateCursorDto.fileId),
    };
    session.activeUsers[userIndex].lastSeen = new Date();
    session.lastActivity = new Date();

    return session.save();
  }

  async addOperation(projectId: string, userId: string, addOperationDto: AddOperationDto): Promise<CollaborationSession> {
    const session = await this.collaborationSessionModel.findOne({
      project: new Types.ObjectId(projectId),
      isActive: true,
    });

    if (!session) {
      throw new NotFoundException('Active collaboration session not found');
    }

    // Verificar se usuário está na sessão ativa
    const userExists = session.activeUsers.some(
      user => user.user.toString() === userId && user.isActive
    );

    if (!userExists) {
      throw new NotFoundException('User not in active session');
    }

    // Adicionar operação
    session.operations.push({
      operation: addOperationDto.operation,
      content: addOperationDto.content,
      position: addOperationDto.position,
      user: new Types.ObjectId(userId),
      timestamp: new Date(),
    });

    // Manter apenas as últimas 1000 operações
    if (session.operations.length > 1000) {
      session.operations = session.operations.slice(-1000);
    }

    session.lastActivity = new Date();
    return session.save();
  }

  async getActiveSession(projectId: string, userId: string): Promise<CollaborationSession | null> {
    // Verificar acesso ao projeto
    await this.projectService.findOne(projectId, userId);

    return this.collaborationSessionModel
      .findOne({
        project: new Types.ObjectId(projectId),
        isActive: true,
      })
      .populate('activeUsers.user', 'name email')
      .populate('currentFile', 'name path')
      .exec();
  }

  async getActiveUsers(projectId: string, userId: string): Promise<any[]> {
    const session = await this.getActiveSession(projectId, userId);
    
    if (!session) {
      return [];
    }

    return session.activeUsers
      .filter(user => user.isActive)
      .map(user => ({
        user: user.user,
        cursor: user.cursor,
        joinedAt: user.joinedAt,
        lastSeen: user.lastSeen,
      }));
  }

  async getRecentOperations(projectId: string, userId: string, limit: number = 100): Promise<any[]> {
    const session = await this.getActiveSession(projectId, userId);
    
    if (!session) {
      return [];
    }

    return session.operations
      .slice(-limit)
      .map(op => ({
        operation: op.operation,
        content: op.content,
        position: op.position,
        user: op.user,
        timestamp: op.timestamp,
      }));
  }

  async switchFile(projectId: string, userId: string, fileId: string): Promise<CollaborationSession> {
    const session = await this.collaborationSessionModel.findOne({
      project: new Types.ObjectId(projectId),
      isActive: true,
    });

    if (!session) {
      throw new NotFoundException('Active collaboration session not found');
    }

    const userIndex = session.activeUsers.findIndex(
      user => user.user.toString() === userId && user.isActive
    );

    if (userIndex < 0) {
      throw new NotFoundException('User not in active session');
    }

    // Atualizar arquivo atual do usuário
    session.activeUsers[userIndex].cursor.file = new Types.ObjectId(fileId);
    session.activeUsers[userIndex].cursor.line = 0;
    session.activeUsers[userIndex].cursor.column = 0;
    session.activeUsers[userIndex].lastSeen = new Date();
    
    // Atualizar arquivo atual da sessão se for o primeiro usuário
    if (userIndex === 0) {
      session.currentFile = new Types.ObjectId(fileId);
    }

    session.lastActivity = new Date();
    return session.save();
  }

  async cleanupInactiveSessions(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    await this.collaborationSessionModel.updateMany(
      {
        lastActivity: { $lt: oneDayAgo },
        isActive: true,
      },
      {
        $set: { isActive: false }
      }
    );
  }
}