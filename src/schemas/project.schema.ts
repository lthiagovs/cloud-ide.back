import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({
  timestamps: true,
  collection: 'projects'
})
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop({ maxlength: 500 })
  description: string;

  @Prop({ 
    required: true, 
    enum: ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'php', 'html'] 
  })
  language: string;

  @Prop({ default: 'https://via.placeholder.com/300x200?text=Project' })
  image: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ 
    type: [{ 
      user: { type: Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['viewer', 'editor', 'admin'], default: 'viewer' },
      addedAt: { type: Date, default: Date.now }
    }],
    default: []
  })
  collaborators: Array<{
    user: Types.ObjectId;
    role: string;
    addedAt: Date;
  }>;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: {
      node: String,
      python: String,
      java: String,
      docker: String
    },
    default: {}
  })
  runtime: {
    node?: string;
    python?: string;
    java?: string;
    docker?: string;
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FileSystemItem' }] })
  files: Types.ObjectId[];

  @Prop({ default: Date.now })
  lastAccessed: Date;

  @Prop({ 
    type: {
      cpu: { type: Number, default: 1 },
      memory: { type: Number, default: 512 },
      storage: { type: Number, default: 1024 }
    },
    default: {}
  })
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };

  @Prop({ default: 0 })
  totalSize: number; // em bytes
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Índices para Project
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ name: 1, owner: 1 });
ProjectSchema.index({ language: 1 });
ProjectSchema.index({ isPublic: 1 });
ProjectSchema.index({ lastAccessed: -1 });
ProjectSchema.index({ 'collaborators.user': 1 });