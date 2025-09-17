import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

// SCHEMAS
import { User, UserSchema } from './schemas/user.schema';
import { Project, ProjectSchema } from './schemas/project.schema';
import { FileSystemItem, FileSystemItemSchema } from './schemas/file-system-item.schema';
import { CollaborationSession, CollaborationSessionSchema } from './schemas/collaboration-session.schema';
import { ExecutionLog, ExecutionLogSchema } from './schemas/execution-log.schema';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(), 
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://cloud_ide:cloud_ide_key@localhost:27017/cloud_ide_db?authSource=admin',
      {
        bufferCommands: false,
      }
    ),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: FileSystemItem.name, schema: FileSystemItemSchema },
      { name: CollaborationSession.name, schema: CollaborationSessionSchema },
      { name: ExecutionLog.name, schema: ExecutionLogSchema },
    ]),
    UserModule,
    AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectConnection() private connection: Connection) {}

  async onModuleInit() {
    console.log('🚀 MongoDB conectado:', this.connection.readyState === 1 ? '✅' : '❌');
    console.log('📊 Banco:', this.connection.name);
  }
}