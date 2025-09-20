export interface CreateFileSystemItemDto {
  name: string;
  type: 'file' | 'folder';
  path: string;
  parentId?: string;
  content?: string;
  mimeType?: string;
  extension?: string;
  metadata?: {
    encoding?: string;
    language?: string;
    readonly?: boolean;
  };
}