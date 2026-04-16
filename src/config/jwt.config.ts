import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  audience: process.env.JWT_TOKEN_AUDIENCE,
  issuer: process.env.JWT_TOKEN_ISSUER,
  accessToken: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '86400', 10),
  refreshToken: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '604800', 10),
}));

/** Same idea as `jwtConfig.asProvider()` in projects that extend `registerAs` — use with `JwtModule.registerAsync(...)`. */
export function jwtModuleAsProvider() {
  return JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      const jwt = configService.getOrThrow<{
        secret: string;
        audience: string;
        issuer: string;
        accessToken: number;
      }>('jwt');
      return {
        secret: jwt.secret,
        signOptions: {
          audience: jwt.audience,
          issuer: jwt.issuer,
          expiresIn: jwt.accessToken,
        },
      };
    },
  });
}
