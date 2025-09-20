export interface AddOperationDto {
  operation: 'insert' | 'delete' | 'retain';
  content: string;
  position: number;
}