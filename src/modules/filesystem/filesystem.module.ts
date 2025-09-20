import { Module } from '@nestjs/common';
import { FileSystemService } from './filesystem.service';
import { FileSystemController } from './filesystem.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { FileSystemItem, FileSystemItemSchema } from 'src/schemas/file-system-item.schema';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: FileSystemItem.name, schema: FileSystemItemSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),
    ProjectModule],
  providers: [FileSystemService],
  controllers: [FileSystemController],
  exports: [FileSystemService],
})
export class FilesystemModule {}
