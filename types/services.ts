/**
 * Tipos para servicios y utilidades
 */

import type { Request, Response } from 'express';
import type { User } from './database.js';

// Tipos para el sistema de logging
export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

export interface LoggerConfig {
  level: keyof LogLevel;
  colorize: boolean;
  timestamp: boolean;
  module?: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  module: string;
  message: string;
  metadata?: Record<string, any>;
}

// Tipos para el servicio de base de datos
export interface DatabaseConfig {
  url: string;
  key: string;
  serviceKey?: string;
}

export interface QueryOptions {
  select?: string;
  eq?: Record<string, any>;
  neq?: Record<string, any>;
  gt?: Record<string, any>;
  gte?: Record<string, any>;
  lt?: Record<string, any>;
  lte?: Record<string, any>;
  like?: Record<string, any>;
  ilike?: Record<string, any>;
  in?: Record<string, any[]>;
  limit?: number;
  offset?: number;
  order?: { column: string; ascending: boolean };
}

export interface DatabaseService {
  getClient(): any;
  query(table: string, options: QueryOptions): Promise<{ data: any[]; error: any }>;
  insert(table: string, data: Record<string, any>): Promise<{ data: any; error: any }>;
  update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<{ data: any; error: any }>;
  delete(table: string, where: Record<string, any>): Promise<{ error: any }>;
  count(table: string, where?: Record<string, any>): Promise<number>;
}

// Tipos para middlewares
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface TimerFunction {
  end(): void;
}

export interface StartTimerFunction {
  (label: string): TimerFunction;
}

// Tipos para controladores
export type ControllerFunction = (req: Request, res: Response) => Promise<void> | void;
export type AuthControllerFunction = (req: AuthenticatedRequest, res: Response) => Promise<void> | void;

// Tipos para validación
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: Record<string, any>;
}

// Tipos para el procesamiento de imágenes
export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  resize?: boolean;
  crop?: boolean;
}

export interface ProcessedImage {
  filename: string;
  path: string;
  url: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  hash?: string;
}

export interface ImageUploadResult {
  original: ProcessedImage;
  variants?: ProcessedImage[];
  error?: string;
}

// Tipos para el sistema de monitoreo
export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  services: {
    database: 'connected' | 'disconnected';
    storage: 'connected' | 'disconnected';
  };
  metrics: PerformanceMetrics;
  timestamp: string;
}

// Tipos para configuración
export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  database: DatabaseConfig;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
    destination: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  email?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}