import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Nome de usuário',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'john@example.com',
  })
  email: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT de acesso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}

export class UserProfileDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'Role do usuário',
    example: 'user',
    enum: ['admin', 'user', 'premium'],
  })
  role: string;
}

export class AdminResponseDto {
  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Acesso permitido apenas para admins',
  })
  message: string;

  @ApiProperty({
    description: 'Dados do usuário logado',
    type: UserProfileDto,
  })
  user: UserProfileDto;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Mensagem de logout',
    example: 'Logout realizado, invalide o token no client.',
  })
  message: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Bad Request',
  })
  message: string;

  @ApiProperty({
    description: 'Detalhes do erro (opcional)',
    example: ['email must be a valid email'],
    required: false,
  })
  error?: string[];
}

export class UnauthorizedResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 401,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Unauthorized',
  })
  message: string;
}

export class ForbiddenResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 403,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Forbidden resource',
  })
  message: string;
}