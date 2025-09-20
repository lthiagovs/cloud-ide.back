export interface AddCollaboratorDto {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
}