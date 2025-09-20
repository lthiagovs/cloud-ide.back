export interface ExecuteCommandDto {
  command: string;
  fileId?: string;
  timeout?: number;
}