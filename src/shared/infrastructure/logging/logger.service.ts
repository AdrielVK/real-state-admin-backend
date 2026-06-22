import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLoggerService extends Logger {
  override log(message: string, context?: string): void {
    super.log(message, context);
  }

  override error(message: string, trace?: string, context?: string): void {
    super.error(message, trace, context);
  }

  override warn(message: string, context?: string): void {
    super.warn(message, context);
  }

  override debug(message: string, context?: string): void {
    super.debug(message, context);
  }

  override verbose(message: string, context?: string): void {
    super.verbose(message, context);
  }
}
