import { Controller, Post, Get, Patch, Body, UseGuards, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) { return this.auth.register(dto); }

  @Post('login')
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }

  @Post('refresh')
  refresh(@Body('refreshToken') token: string) { return this.auth.refresh(token); }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: any, @Body('refreshToken') token: string) {
    return this.auth.logout(req.user.sub, token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) { return this.auth.getMe(req.user.sub); }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(req.user.sub, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.auth.changePassword(req.user.sub, body.oldPassword, body.newPassword);
  }

  // Upload avatar — lưu URL vào DB (dùng dịch vụ cloud trong production)
  // Trong dev: lưu tạm vào /uploads và serve static
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.startsWith('image/')) cb(new Error('Chỉ nhận file ảnh'), false);
      else cb(null, true);
    },
  }))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    // Tạm thời trả về base64 — trong production dùng S3/Cloudinary
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const user = await req.prisma?.user ?? null;
    await req.app.get('prisma')?.user?.update?.({
      where: { id: req.user.sub },
      data: { avatarUrl: base64 },
    }).catch(() => {});
    return { avatarUrl: base64 };
  }
}