import { Inject, Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../../config/jwt.config';
import type { ActiveUserData } from '../interface/active-user.interface';

@Injectable()
export class GenerateTokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async signToken(
    payload: Pick<ActiveUserData, 'sub' | 'email'>,
    expiresIn: JwtSignOptions['expiresIn'],
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.jwtConfiguration.secret,
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
      expiresIn,
    });
  }

  public signAccessToken(userId: string, email: string): Promise<string> {
    return this.signToken(
      { sub: userId, email },
      this.jwtConfiguration.accessToken,
    );
  }

  public signRefreshToken(userId: string, email: string): Promise<string> {
    return this.signToken(
      { sub: userId, email },
      this.jwtConfiguration.refreshToken,
    );
  }
}
