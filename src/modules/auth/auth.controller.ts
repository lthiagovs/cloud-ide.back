import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  Get,
  HttpStatus,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiResponse,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { Roles } from 'src/guard/roles/roles.decorator';
import {
  UserResponseDto,
  LoginResponseDto,
  UserProfileDto,
  AdminResponseDto,
  LogoutResponseDto,
  ErrorResponseDto,
  UnauthorizedResponseDto,
  ForbiddenResponseDto
} from './dto/responses.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Registra um novo usuário no sistema
   */
  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Registrar novo usuário',
    description: `
      Cria uma nova conta de usuário no sistema.
      
      **Regras de validação:**
      - Username: 3-20 caracteres, apenas letras, números e underscore
      - Email: deve ter formato válido
      - Password: mínimo 6 caracteres
      
      **Processo:**
      1. Valida os dados de entrada
      2. Verifica se username/email já existem
      3. Criptografa a senha usando bcrypt
      4. Salva o usuário no banco de dados
      5. Retorna os dados do usuário (sem senha)
    `
  })
  @ApiBody({
    type: RegisterDto,
    description: 'Dados para registro do usuário',
    examples: {
      exemplo1: {
        summary: 'Usuário comum',
        value: {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Usuário registrado com sucesso',
    type: UserResponseDto,
    example: {
      id: '507f1f77bcf86cd799439011',
      username: 'johndoe',
      email: 'john@example.com'
    }
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos',
    type: ErrorResponseDto,
    example: {
      statusCode: 400,
      message: 'Validation failed',
      error: [
        'username must be longer than or equal to 3 characters',
        'email must be a valid email'
      ]
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Username ou email já existem',
    schema: {
      example: {
        statusCode: 409,
        message: 'Username or email already exists'
      }
    }
  })
  async register(@Body() registerDto: RegisterDto) {
    const { username, email, password } = registerDto;
    const user = await this.authService.register(username, email, password);
    return { id: user._id, username: user.username, email: user.email };
  }

  /**
   * Autentica um usuário no sistema
   */
  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Login de usuário',
    description: `
      Autentica um usuário e retorna um token JWT.
      
      **Processo:**
      1. Valida email e senha
      2. Verifica se o usuário existe no banco
      3. Compara a senha fornecida com o hash armazenado
      4. Gera um token JWT com ID do usuário e role
      5. Atualiza lastLogin do usuário
      6. Retorna o token de acesso
      
      **Token JWT contém:**
      - sub: ID do usuário
      - role: papel do usuário (admin, user, premium)
      - iat: timestamp de criação
      - exp: timestamp de expiração
    `
  })
  @ApiBody({
    type: LoginDto,
    description: 'Credenciais de login',
    examples: {
      exemplo1: {
        summary: 'Login válido',
        value: {
          email: 'john@example.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJyb2xlIjoidXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    }
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos',
    type: ErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Email ou senha incorretos',
    type: UnauthorizedResponseDto,
    example: {
      statusCode: 401,
      message: 'Invalid credentials'
    }
  })
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.authService.validateUser(email, password);
    return this.authService.login(user);
  }

  /**
   * Retorna informações do usuário logado
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({
    summary: 'Obter perfil do usuário',
    description: `
      Retorna as informações do usuário atualmente logado.
      
      **Requer:** Token JWT válido no header Authorization
      
      **Retorna:**
      - userId: ID único do usuário
      - role: papel do usuário no sistema
      
      **Headers necessários:**
      \`\`\`
      Authorization: Bearer <jwt_token>
      \`\`\`
    `
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Informações do usuário logado',
    type: UserProfileDto,
    example: {
      userId: '507f1f77bcf86cd799439011',
      role: 'user'
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou não fornecido',
    type: UnauthorizedResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized'
    }
  })
  getProfile(@Req() req: Request) {
    return req.user;
  }

  /**
   * Rota exclusiva para administradores
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('admin')
  @Roles('admin')
  @ApiOperation({
    summary: 'Rota administrativa',
    description: `
      Endpoint de exemplo que demonstra controle de acesso baseado em roles.
      Apenas usuários com role 'admin' podem acessar esta rota.
      
      **Requer:**
      - Token JWT válido
      - Role 'admin' no token
      
      **Guards aplicados:**
      1. AuthGuard('jwt'): Verifica se o token é válido
      2. RolesGuard: Verifica se o usuário tem a role necessária
      
      **Decorator @Roles('admin'):** Define que apenas admins podem acessar
    `
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Acesso autorizado para admin',
    type: AdminResponseDto,
    example: {
      message: 'Acesso permitido apenas para admins',
      user: {
        userId: '507f1f77bcf86cd799439011',
        role: 'admin'
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou não fornecido',
    type: UnauthorizedResponseDto
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissões de admin',
    type: ForbiddenResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource'
    }
  })
  adminRoute(@Req() req: Request) {
    return { 
      message: 'Acesso permitido apenas para admins', 
      user: req.user 
    };
  }

  /**
   * Logout do usuário (client-side)
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @ApiOperation({
    summary: 'Logout do usuário',
    description: `
      Realiza o logout do usuário do sistema.
      
      **Importante sobre JWT:**
      Como JWT é stateless (sem estado no servidor), o logout é principalmente 
      uma operação do lado do cliente. O servidor não mantém uma lista de 
      tokens válidos.
      
      **Implementações possíveis:**
      1. **Client-side (Atual):** Remove o token do armazenamento local
      2. **Blacklist:** Manter lista de tokens invalidados (mais complexo)
      3. **Short-lived tokens:** Tokens com expiração curta + refresh tokens
      
      **Recomendação:**
      Após receber esta resposta, remova o token do localStorage/sessionStorage
      do cliente e redirecione para a página de login.
    `
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Logout realizado com sucesso',
    type: LogoutResponseDto,
    example: {
      message: 'Logout realizado, invalide o token no client.'
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou não fornecido',
    type: UnauthorizedResponseDto
  })
  logout(@Req() req: Request) {
    // JWT é stateless, então logout só faz sentido no client ou blacklist
    return { 
      message: 'Logout realizado, invalide o token no client.' 
    };
  }
}