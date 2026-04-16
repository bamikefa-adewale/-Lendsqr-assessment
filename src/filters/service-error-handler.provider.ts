import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class ServiceErrorHandlerProvider {
  // this method rethrows known errors or wraps them in a generic InternalServerErrorException
  handleServiceError(action: string, error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(`Unable to ${action}`);
  }
}
