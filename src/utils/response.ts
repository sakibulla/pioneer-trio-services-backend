import { Response } from 'express';
import { ApiResponseEnvelope } from '../types';
import { HTTP_STATUS } from '../config/constants';

export class ApiResponse {
  public static success<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = HTTP_STATUS.OK,
    meta?: any
  ): Response {
    const payload: ApiResponseEnvelope<T> = {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
      correlationId: (res.req as any)?.correlationId,
    };
    return res.status(statusCode).json(payload);
  }

  public static created<T>(res: Response, data: T, message: string = 'Created successfully', meta?: any): Response {
    return ApiResponse.success(res, data, message, HTTP_STATUS.CREATED, meta);
  }

  public static error(
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: any[]
  ): Response {
    const payload: ApiResponseEnvelope = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      correlationId: (res.req as any)?.correlationId,
    };
    return res.status(statusCode).json(payload);
  }
}
