import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users'
})
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'user', enum: ['admin', 'user', 'premium'] })
  role: string;

  @Prop({ default: 'https://avatars.githubusercontent.com/default' })
  avatar: string;

  @Prop({ default: Date.now })
  lastLogin: Date;

  @Prop({ default: true })
  isActive: boolean;

  // Projetos do usuário
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  projects: Types.ObjectId[];

  // Projetos que o usuário está editando atualmente (para colaboração)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }], default: [] })
  activeProjects: Types.ObjectId[];

  // Histórico de atividades do usuário
  @Prop({
    type: [
      {
        projectId: { type: Types.ObjectId, ref: 'Project' },
        action: { type: String },
        date: { type: Date, default: Date.now }
      }
    ],
    default: []
  })
  activityLog: { projectId: Types.ObjectId; action: string; date: Date }[];

  // Preferências do editor do usuário
  @Prop({
    type: {
      theme: { type: String, default: 'light' }, // 'light' | 'dark'
      fontSize: { type: Number, default: 14 },
      tabSize: { type: Number, default: 2 }
    },
    default: {}
  })
  preferences: {
    theme: string;
    fontSize: number;
    tabSize: number;
  };

  // Limites de uso
  @Prop({
    type: {
      maxProjects: { type: Number, default: 5 },
      maxFileSize: { type: Number, default: 10485760 },
      canCollaborate: { type: Boolean, default: true }
    },
    default: {}
  })
  limits: {
    maxProjects: number;
    maxFileSize: number;
    canCollaborate: boolean;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
