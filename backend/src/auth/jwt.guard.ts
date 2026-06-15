import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard {
  constructor(private jwt: JwtService, private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer '))
      throw new UnauthorizedException('Chưa đăng nhập');
    try {
      req.user = this.jwt.verify(header.split(' ')[1], {
        secret: this.config.get('JWT_SECRET'),
      });
      return true;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc hết hạn');
    }
  }
}