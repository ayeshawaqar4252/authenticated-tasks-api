import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter
  implements ExceptionFilter
{
  catch(
    exception: unknown,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();

    const response =
      ctx.getResponse<Response>();

    const request =
      ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    let message: string | string[];

    let error: string;

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const body =
        exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

      message =
        body.message ?? 'Internal server error';

      error =
        body.error ?? 'Internal Server Error';
    } else {
      message = exceptionResponse;
      error = 'Internal Server Error';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}