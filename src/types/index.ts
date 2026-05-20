import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
  body: any;
  params: any;
  query: any;
  headers: Record<string, any>;
  file?: Express.Multer.File;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}
