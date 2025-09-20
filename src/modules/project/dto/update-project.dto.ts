export interface UpdateProjectDto {
  name?: string;
  description?: string;
  language?: string;
  image?: string;
  isPublic?: boolean;
  isActive?: boolean;
  runtime?: {
    node?: string;
    python?: string;
    java?: string;
    docker?: string;
  };
}