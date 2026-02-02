import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';

export interface ApiErrorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  errors?: string[] | Record<string, string[]>;
  timestamp: string;
  path?: string;
  stack?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, errors } = this.getErrorDetails(exception);

    // Log the error for debugging
    this.logError(exception, request, statusCode);

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      // Include path and stack trace only in development
      ...(!this.isProduction &&
        exception instanceof Error && {
          path: request.url,
          stack: exception.stack,
        }),
    };

    response.status(statusCode).json(errorResponse);
  }

  private getErrorDetails(exception: unknown): {
    statusCode: number;
    message: string;
    errors?: string[] | Record<string, string[]>;
  } {
    // Handle HttpException (NestJS built-in exceptions)
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaKnownError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return this.handlePrismaValidationError(exception);
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return this.handlePrismaInitializationError();
    }

    // Handle generic errors
    if (exception instanceof Error) {
      return this.handleGenericError(exception);
    }

    // Unknown error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.isProduction
        ? 'An unexpected error occurred'
        : 'Unknown error',
    };
  }

  private handleHttpException(exception: HttpException): {
    statusCode: number;
    message: string;
    errors?: string[];
  } {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return { statusCode, message: response };
    }

    if (typeof response === 'object' && response !== null) {
      const res = response as Record<string, unknown>;

      // Handle class-validator validation errors
      if (Array.isArray(res.message)) {
        return {
          statusCode,
          message:
            (res.message as string[])[0]?.charAt(0).toUpperCase() +
              (res.message as string[])[0]?.slice(1) || 'Validation failed',
          errors: res.message as string[],
        };
      }

      return {
        statusCode,
        message: (res.message as string) || 'An error occurred',
      };
    }

    return { statusCode, message: 'An error occurred' };
  }

  private handlePrismaKnownError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): {
    statusCode: number;
    message: string;
    errors?: string[];
  } {
    switch (exception.code) {
      // Unique constraint violation
      case 'P2002': {
        const target = exception.meta?.target as string[] | undefined;
        const fields = target?.join(', ') || 'field';
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${fields} already exists`,
          errors: [`Duplicate value for: ${fields}`],
        };
      }

      // Record not found
      case 'P2001':
      case 'P2018':
      case 'P2025': {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
        };
      }

      // Foreign key constraint violation
      case 'P2003': {
        const field = exception.meta?.field_name as string | undefined;
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: this.isProduction
            ? 'Invalid reference to related record'
            : `Foreign key constraint failed on field: ${field}`,
        };
      }

      // Required field missing
      case 'P2011':
      case 'P2012': {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Required field is missing',
        };
      }

      // Invalid data type
      case 'P2005':
      case 'P2006': {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid data type provided',
        };
      }

      // Too many connections
      case 'P2024': {
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Service temporarily unavailable. Please try again later.',
        };
      }

      // Invalid ID
      case 'P2023': {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid ID format',
        };
      }

      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: this.isProduction
            ? 'Database operation failed'
            : `Database error: ${exception.code}`,
        };
    }
  }

  private handlePrismaValidationError(
    exception: Prisma.PrismaClientValidationError,
  ): {
    statusCode: number;
    message: string;
  } {
    // Extract meaningful message from Prisma validation error
    const message = this.isProduction
      ? 'Invalid data provided'
      : this.extractPrismaValidationMessage(exception.message);

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message,
    };
  }

  private handlePrismaInitializationError(): {
    statusCode: number;
    message: string;
  } {
    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Database connection failed. Please try again later.',
    };
  }

  private handleGenericError(exception: Error): {
    statusCode: number;
    message: string;
  } {
    // Check for specific error types by name
    switch (exception.name) {
      case 'JsonWebTokenError':
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        };

      case 'TokenExpiredError':
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Token has expired',
        };

      case 'NotBeforeError':
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Token not active yet',
        };

      case 'SyntaxError':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid JSON payload',
        };

      case 'TypeError':
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: this.isProduction
            ? 'An unexpected error occurred'
            : exception.message,
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: this.isProduction
            ? 'An unexpected error occurred'
            : exception.message,
        };
    }
  }

  private extractPrismaValidationMessage(message: string): string {
    // Try to extract the last meaningful line from Prisma validation error
    const lines = message.split('\n').filter((line) => line.trim());
    const lastLine = lines[lines.length - 1]?.trim();

    if (lastLine && !lastLine.includes('prisma')) {
      return lastLine;
    }

    return 'Invalid data provided';
  }

  private logError(
    exception: unknown,
    request: Request,
    statusCode: number,
  ): void {
    const errorLog = {
      statusCode,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      ...(request.body &&
        Object.keys(request.body).length > 0 && {
          body: this.sanitizeBody(request.body),
        }),
    };

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
        JSON.stringify(errorLog),
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${statusCode}`,
        JSON.stringify(errorLog),
      );
    }
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'password',
      'confirmPassword',
      'currentPassword',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'creditCard',
      'cvv',
      'ssn',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
