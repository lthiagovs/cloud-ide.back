import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CollaborationSessionDocument = CollaborationSession & Document;

@Schema({
  timestamps: true,
  collection: 'collaboration_sessions'
})
export class CollaborationSession {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  @Prop({ 
    type: [{
      user: { type: Types.ObjectId, ref: 'User' },
      cursor: {
        line: Number,
        column: Number,
        file: { type: Types.ObjectId, ref: 'FileSystemItem' }
      },
      isActive: { type: Boolean, default: true },
      joinedAt: { type: Date, default: Date.now },
      lastSeen: { type: Date, default: Date.now }
    }]
  })
  activeUsers: Array<{
    user: Types.ObjectId;
    cursor: {
      line: number;
      column: number;
      file: Types.ObjectId;
    };
    isActive: boolean;
    joinedAt: Date;
    lastSeen: Date;
  }>;

  @Prop({ type: Types.ObjectId, ref: 'FileSystemItem' })
  currentFile: Types.ObjectId;

  @Prop({ 
    type: [{
      operation: String, // insert, delete, retain
      content: String,
      position: Number,
      user: { type: Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now }
    }],
    default: []
  })
  operations: Array<{
    operation: string;
    content: string;
    position: number;
    user: Types.ObjectId;
    timestamp: Date;
  }>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  lastActivity: Date;
}

export const CollaborationSessionSchema = SchemaFactory.createForClass(CollaborationSession);

// Índices para CollaborationSession
CollaborationSessionSchema.index({ project: 1 });
CollaborationSessionSchema.index({ 'activeUsers.user': 1 });
CollaborationSessionSchema.index({ isActive: 1 });
CollaborationSessionSchema.index({ lastActivity: -1 });
