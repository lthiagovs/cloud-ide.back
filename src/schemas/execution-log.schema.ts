import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExecutionLogDocument = ExecutionLog & Document;

@Schema({
  timestamps: true,
  collection: 'execution_logs'
})
export class ExecutionLog {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FileSystemItem' })
  file: Types.ObjectId;

  @Prop({ required: true })
  command: string;

  @Prop()
  output: string;

  @Prop()
  error: string;

  @Prop({ enum: ['success', 'error', 'timeout'], default: 'success' })
  status: string;

  @Prop({ default: 0 })
  executionTime: number; // em ms

  @Prop({ default: 0 })
  memoryUsed: number; // em MB

  @Prop({ default: 0 })
  cpuUsed: number; // em %

  @Prop()
  exitCode: number;

  @Prop({ default: Date.now })
  executedAt: Date;
}

export const ExecutionLogSchema = SchemaFactory.createForClass(ExecutionLog);

// Índices para ExecutionLog
ExecutionLogSchema.index({ project: 1, executedAt: -1 });
ExecutionLogSchema.index({ user: 1, executedAt: -1 });
ExecutionLogSchema.index({ status: 1 });

// TTL index para logs antigos (remove após 30 dias)
ExecutionLogSchema.index({ executedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });