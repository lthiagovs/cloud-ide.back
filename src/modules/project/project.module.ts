import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from 'src/schemas/project.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),],
  providers: [ProjectService],
  controllers: [ProjectController],
  exports: [ProjectService],
})
export class ProjectModule {}
