/**
 * 🌸 FloresYa - Backend Type Definitions
 * Types for backend services and controllers
 */

import { Request, Response, NextFunction } from 'express';

export interface FloresYaRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  startTime?: number;
  requestId?: string;
}

export interface FloresYaResponse extends Response {
  locals: {
    user?: any;
    startTime?: number;
    requestId?: string;
  };
}

export type FloresYaMiddleware = (
  req: FloresYaRequest,
  res: FloresYaResponse,
  next: NextFunction
) => void | Promise<void>;

export interface ControllerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface ServiceResponse<T = any> extends ControllerResponse<T> {
  timestamp?: string;
  duration?: number;
}

export interface DatabaseService {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  findById<T = any>(table: string, id: number): Promise<T | null>;
  findAll<T = any>(table: string, options?: QueryOptions): Promise<T[]>;
  create<T = any>(table: string, data: Partial<T>): Promise<T>;
  update<T = any>(table: string, id: number, data: Partial<T>): Promise<T>;
  delete(table: string, id: number): Promise<boolean>;
}

export interface ImageUploadService {
  uploadSingle(file: any, folder: string): Promise<string>;
  uploadMultiple(files: any[], folder: string): Promise<string[]>;
  deleteImage(url: string): Promise<boolean>;
  processImage(url: string, sizes: string[]): Promise<string[]>;
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthResponse>;
  register(email: string, password: string, name?: string): Promise<AuthResponse>;
  verifyToken(token: string): Promise<User | null>;
  refreshToken(token: string): Promise<AuthResponse>;
}

export interface LoggerService {
  info(module: string, message: string, meta?: any): void;
  error(module: string, message: string, error?: Error, meta?: any): void;
  warn(module: string, message: string, meta?: any): void;
  debug(module: string, message: string, meta?: any): void;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Import types from shared API types
import type { 
  User, 
  AuthResponse 
} from './api.js';

// Re-declare QueryResult and QueryOptions locally for backend use
interface QueryResult<T = any> {
  rows: T[];
  count: number;
  success: boolean;
  error?: string;
}

interface QueryOptions {
  orderBy?: string;
  order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
  include?: string[];
}