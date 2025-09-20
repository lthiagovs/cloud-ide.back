export interface UpdateFileSystemItemDto {
  name?: string;
  content?: string;
  metadata?: {
    encoding?: string;
    language?: string;
    readonly?: boolean;
  };
}