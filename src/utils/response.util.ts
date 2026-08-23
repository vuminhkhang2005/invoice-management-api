import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: any;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(payload);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): Response {
  const totalPages = Math.ceil(total / limit) || 1;
  const payload: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
  return res.status(200).json(payload);
}

export function sendError(
  res: Response,
  message = 'An error occurred',
  statusCode = 400,
  errors?: any
): Response {
  const payload: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(payload);
}
