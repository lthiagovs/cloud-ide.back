export interface CreateProjectDto {
  name: string;
  description?: string;
  language: string;
  image?: string;
  isPublic?: boolean;
  runtime?: {
    node?: string;
    python?: string;
    java?: string;
    docker?: string;
  };
}