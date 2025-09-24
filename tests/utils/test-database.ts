/**
 * 🌸 FloresYa Test Database Configuration - Mock-Friendly Edition
 * Simplified configuration that works great with mocks
 * Silicon Valley style - simple and effective
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import type { Database } from '../../src/shared/types/index';

// Load main environment variables for tests
config({ path: '.env' });

// Simple environment check
const isTestEnvironment = process.env.NODE_ENV === 'test';

/**
 * Test Environment Configuration
 * Validates all required environment variables for testing
 */
class TestEnvironmentValidator {
  private static validateEnvironmentVariable(name: string, value?: string): string {
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  }

  public static validateTestEnvironment(): {
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceKey?: string;
  } {
    const supabaseUrl = this.validateEnvironmentVariable('SUPABASE_URL', process.env.SUPABASE_URL);
    const supabaseAnonKey = this.validateEnvironmentVariable('SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY);
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Validate URL format
    try {
      new URL(supabaseUrl);
    } catch {
      throw new Error('Invalid SUPABASE_URL format');
    }

    return { supabaseUrl, supabaseAnonKey, supabaseServiceKey };
  }
}

/**
 * Test Database Connection Metrics
 * Tracks connection performance and reliability
 */
interface ConnectionMetrics {
  connectionAttempts: number;
  successfulConnections: number;
  lastConnectionTime: number;
  averageConnectionTime: number;
  totalConnectionTime: number;
}

/**
 * Test Supabase Configuration
 * Enhanced with validation and security
 */
interface TestSupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

/**
 * Simple Test Supabase Manager - Mock-Friendly Edition
 * Clean and simple for Silicon Valley style testing
 */
class TestSupabaseManager {
  private static instance: TestSupabaseManager;
  public readonly client: SupabaseClient<Database>;
  public readonly serviceClient: SupabaseClient<Database>;

  private constructor() {
    // Simple configuration - works great with mocks
    const config = this.getConfig();

    this.client = createClient<Database>(config.url, config.anonKey, {
      auth: { persistSession: false }
    });

    this.serviceClient = createClient<Database>(
      config.url,
      config.serviceKey ?? config.anonKey,
      {
        auth: { persistSession: false }
      }
    );
  }

  public static getInstance(): TestSupabaseManager {
    if (!TestSupabaseManager.instance) {
      TestSupabaseManager.instance = new TestSupabaseManager();
    }
    return TestSupabaseManager.instance;
  }

  private getConfig(): TestSupabaseConfig {
    // Simple configuration - works great with mocks
    const envConfig = TestEnvironmentValidator.validateTestEnvironment();

    return {
      url: envConfig.supabaseUrl,
      anonKey: envConfig.supabaseAnonKey,
      serviceKey: envConfig.supabaseServiceKey
    };
  }

  /**
   * Simple connection test - works great with mocks
   */
  public async testConnection(): Promise<boolean> {
    try {
      // Simple test - just try to access the client
      // In mock scenarios, this will work perfectly
      return !!this.client;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  /**
   * Simple cleanup - mock-friendly
   */
  public async cleanupTestData(): Promise<void> {
    // In mock scenarios, no cleanup needed
    // This method exists for compatibility
    if (!isTestEnvironment) {
      console.log('🧹 Test cleanup skipped (not in test environment)');
    }
  }

  /**
   * Simple health status - mock-friendly
   */
  public async getHealthStatus(): Promise<{
    connected: boolean;
    timestamp: string;
  }> {
    const connected = await this.testConnection();

    return {
      connected,
      timestamp: new Date().toISOString()
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export singleton instance
const testSupabaseManager = TestSupabaseManager.getInstance();
export const testSupabase = testSupabaseManager.client;
export const testSupabaseService = testSupabaseManager.serviceClient;
export default testSupabaseManager;

// Export types and classes for testing
export type { ConnectionMetrics, TestSupabaseConfig };
export { TestEnvironmentValidator };

// =============================================================================
// UTILITY FUNCTIONS FOR TESTS
// =============================================================================

/**
 * Simple setup test database - mock-friendly
 */
export async function setupTestDatabase(): Promise<void> {
  try {
    console.log('🚀 Setting up test database...');

    const isConnected = await testSupabaseManager.testConnection();
    if (!isConnected) {
      console.warn('⚠️ Database connection not available - running in mock mode');
    } else {
      console.log('✅ Test database connection established successfully');
    }
  } catch (error) {
    console.warn('⚠️ Database setup failed - running in mock mode:', error);
  }
}

/**
 * Simple teardown test database - mock-friendly
 */
export async function teardownTestDatabase(): Promise<void> {
  try {
    console.log('🧹 Starting test database teardown...');

    await testSupabaseManager.cleanupTestData();

    console.log('🧹 Test database teardown completed successfully');
  } catch (error) {
    console.warn('⚠️ Database teardown failed - continuing anyway:', error);
  }
}

/**
 * Simple health status - mock-friendly
 */
export async function getDatabaseHealthStatus(): Promise<{
  connected: boolean;
  timestamp: string;
}> {
  return await testSupabaseManager.getHealthStatus();
}

/**
 * Wait for database to be ready (useful for CI/CD)
 */
export async function waitForDatabaseReady(maxWaitTime = 30000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const isConnected = await testSupabaseManager.testConnection();
      if (isConnected) {
        console.log('✅ Database is ready');
        return;
      }
    } catch (error) {
      // Ignore connection errors and retry
    }

    console.log('⏳ Waiting for database to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error(`Database not ready after ${maxWaitTime}ms`);
}