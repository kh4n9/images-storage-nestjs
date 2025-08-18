import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums/role.enum';
import { FileUrlRefreshService } from 'src/files/file-url-refresh.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private fileUrlRefreshService: FileUrlRefreshService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.usersService.findOne(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      await this.fileUrlRefreshService.refreshUrlsForUser(
        user._id.toString(),
      );
    } catch (error) {
      console.error(
        `Failed to refresh file URLs for user ${user._id}:`,
        error,
      );
    }

    const payload = {
      sub: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    };
    
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.roles[0], // Lấy role đầu tiên
      },
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(email: string, name: string, password: string) {
    const existingUser = await this.usersService.findOne(email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.usersService.create({
      email,
      name,
      password: hashedPassword,
      roles: [Role.User],
    });
    
    const payload = {
      sub: newUser._id,
      name: newUser.name,
      email: newUser.email,
      roles: newUser.roles,
    };
    
    return {
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.roles[0], // Lấy role đầu tiên
      },
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
