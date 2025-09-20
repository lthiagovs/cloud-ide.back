import { Module } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';
import { CollaborationController } from './collaboration.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CollaborationSession, CollaborationSessionSchema } from 'src/schemas/collaboration-session.schema';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: CollaborationSession.name, schema:CollaborationSessionSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),
    ProjectModule],
  providers: [CollaborationService],
  controllers: [CollaborationController],
  exports: [CollaborationService],
})
export class CollaborationModule {}
