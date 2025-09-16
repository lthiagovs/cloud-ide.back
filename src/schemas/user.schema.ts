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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  projects: Types.ObjectId[];

  @Prop({
    type: {
      maxProjects: { type: Number, default: 5 },
      maxFileSize: { type: Number, default: 10485760 }, // 10MB
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