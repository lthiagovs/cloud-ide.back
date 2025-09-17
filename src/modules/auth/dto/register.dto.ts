import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Nome de usuário único',
    example: 'johndoe',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @MinLength(3, { message: 'Username deve ter pelo menos 3 caracteres' })
  @MaxLength(20, { message: 'Username deve ter no máximo 20 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username deve conter apenas letras, números e underscore'
  })
  username: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'john@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;
}