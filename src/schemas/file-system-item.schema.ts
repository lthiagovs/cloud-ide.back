import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FileSystemItemDocument = FileSystemItem & Document;

@Schema({
  timestamps: true,
  collection: 'filesystem_items'
})
export class FileSystemItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['file', 'folder'] })
  type: 'file' | 'folder';

  @Prop({ required: true })
  path: string; // caminho completo ex: /projeto/src/main.py

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FileSystemItem' })
  parent: Types.ObjectId; // null para root folder

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FileSystemItem' }] })
  children: Types.ObjectId[]; // apenas para folders

  // Apenas para arquivos
  @Prop()
  content: string;

  @Prop()
  mimeType: string;

  @Prop({ default: 0 })
  size: number; // em bytes

  @Prop()
  extension: string;

  @Prop({ 
    type: {
      encoding: { type: String, default: 'utf8' },
      language: String,
      readonly: { type: Boolean, default: false }
    },
    default: {}
  })
  metadata: {
    encoding: string;
    language?: string;
    readonly: boolean;
  };

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  lastModifiedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  lastModified: Date;

  @Prop({ 
    type: [{
      user: { type: Types.ObjectId, ref: 'User' },
      action: { type: String, enum: ['created', 'modified', 'deleted', 'renamed'] },
      timestamp: { type: Date, default: Date.now },
      oldValue: String,
      newValue: String
    }],
    default: []
  })
  history: Array<{
    user: Types.ObjectId;
    action: string;
    timestamp: Date;
    oldValue?: string;
    newValue?: string;
  }>;
}

export const FileSystemItemSchema = SchemaFactory.createForClass(FileSystemItem);

// Índices para FileSystemItem
FileSystemItemSchema.index({ project: 1, path: 1 }, { unique: true });
FileSystemItemSchema.index({ project: 1, parent: 1 });
FileSystemItemSchema.index({ project: 1, type: 1 });
FileSystemItemSchema.index({ lastModified: -1 });

// Middleware para calcular tamanho automático
FileSystemItemSchema.pre('save', function(next) {
  if (this.type === 'file' && this.content) {
    this.size = Buffer.byteLength(this.content, 'utf8');
  }
  next();
});