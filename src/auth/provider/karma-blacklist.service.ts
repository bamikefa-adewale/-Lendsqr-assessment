import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KarmaBlacklistService {
  constructor(private readonly config: ConfigService) {}

  async assertEmailAllowed(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const provider = this.config.get<string>('KARMA_PROVIDER') ?? 'mock';

    if (provider === 'mock') {
      const raw = this.config.get<string>('KARMA_MOCK_BLACKLISTED_EMAILS');
      const blocked = (raw ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (blocked.includes(normalized)) {
        throw new ForbiddenException(
          'User is not eligible for onboarding (blacklisted)',
        );
      }
      return;
    }

    if (provider === 'adjutor') {
      const url = this.config.get<string>('ADJUTOR_API_URL');
      const key = this.config.get<string>('ADJUTOR_API_KEY');
      if (!url || !key) {
        throw new InternalServerErrorException(
          'Adjutor Karma is enabled but ADJUTOR_API_URL / ADJUTOR_API_KEY are not set',
        );
      }
      await this.checkAdjutor(normalized, url, key);
      return;
    }

    throw new InternalServerErrorException(
      `Invalid KARMA_PROVIDER: ${provider}`,
    );
  }

  private async checkAdjutor(
    email: string,
    url: string,
    apiKey: string,
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ identifier: email }),
      });
      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Blacklist provider returned an error',
        );
      }
      const body = (await response.json()) as {
        blacklisted?: boolean;
        isBlacklisted?: boolean;
      };
      const blocked = body.blacklisted === true || body.isBlacklisted === true;
      if (blocked) {
        throw new ForbiddenException(
          'User is not eligible for onboarding (blacklisted)',
        );
      }
    } catch (e) {
      if (
        e instanceof ForbiddenException ||
        e instanceof ServiceUnavailableException
      ) {
        throw e;
      }
      throw new ServiceUnavailableException(
        'Blacklist provider request failed',
      );
    }
  }
}
