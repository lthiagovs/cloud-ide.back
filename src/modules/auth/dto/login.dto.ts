import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'john@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'password123',
  })
  @IsString()
  password: string;
}