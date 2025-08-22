import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { RegisterDto } from './dto/register.dto';

interface AuthRequest extends ExpressRequest {
  user?: Record<string, unknown>;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.name,
      registerDto.password,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('profile')
  getProfile(@Request() req: AuthRequest) {
    return req.user as Record<string, unknown>;
  }
}
