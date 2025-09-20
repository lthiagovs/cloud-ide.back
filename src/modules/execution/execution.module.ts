import { Module } from '@nestjs/common';
import { UserExecutionController } from './user-execution.controller';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ExecutionLog, ExecutionLogSchema } from 'src/schemas/execution-log.schema';
import { ProjectModule } from '../project/project.module';
import { FilesystemModule } from '../filesystem/filesystem.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: ExecutionLog.name, schema: ExecutionLogSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),
    ProjectModule,
    FilesystemModule,],
  controllers: [ExecutionController, UserExecutionController],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class ExecutionModule {}
