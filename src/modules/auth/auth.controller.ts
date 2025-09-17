import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { Roles } from 'src/guard/roles/roles.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso.' })
  async register(
    @Body('username') username: string,
    @Body('email') email: string,
    @Body('password') password: string
  ) {
    const user = await this.authService.register(username, email, password);
    return { id: user._id, username: user.username, email: user.email };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiResponse({ status: 200, description: 'Retorna JWT de acesso.' })
  async login(
    @Body('email') email: string,
    @Body('password') password: string
  ) {
    const user = await this.authService.validateUser(email, password);
    return this.authService.login(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({ summary: 'Informações do usuário logado' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Retorna dados do usuário logado.' })
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('admin')
  @Roles('admin')
  @ApiOperation({ summary: 'Exemplo de rota apenas para admins' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Somente admins podem acessar esta rota.' })
  adminRoute(@Req() req: Request) {
    return { message: 'Acesso permitido apenas para admins', user: req.user };
  }

  // Logout opcional (para invalidar token no client)
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @ApiOperation({ summary: 'Logout do usuário' })
  @ApiBearerAuth()
  logout(@Req() req: Request) {
    // JWT é stateless, então logout só faz sentido no client ou blacklist
    return { message: 'Logout realizado, invalide o token no client.' };
  }
}
