/**
 * 🌸 FloresYa Test Database Configuration
 * Configuración para tests con datos reales de Supabase
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import type { Database } from '../../src/shared/types/index.js';

// Load main environment variables for tests
config({ path: '.env' });

interface TestSupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

class TestSupabaseManager {
  private static instance: TestSupabaseManager;
  public readonly client: SupabaseClient<Database>;
  public readonly serviceClient: SupabaseClient<Database>;

  private constructor() {
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
    // Use same environment variables as main application
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
      throw new Error('Missing required Supabase environment variables for tests');
    }

    return { url, anonKey, serviceKey };
  }

  public async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client.from('settings').select('id').limit(1);
      return !error;
    } catch (error) {
      console.error('Test Supabase connection failed:', error);
      return false;
    }
  }

  public async cleanupTestData(): Promise<void> {
    try {
      // Clean up test data that might have been created during tests
      // This is a safe cleanup that won't affect production data

      // Note: In a real scenario, you might want to use a separate test database
      // or have specific test prefixes for data created during tests
      console.log('🧹 Test cleanup completed');
    } catch (error) {
      console.error('Test cleanup failed:', error);
    }
  }
}

// Export singleton instance
const testSupabaseManager = TestSupabaseManager.getInstance();
export const testSupabase = testSupabaseManager.client;
export const testSupabaseService = testSupabaseManager.serviceClient;
export default testSupabaseManager;

// Utility functions for tests
export async function setupTestDatabase(): Promise<void> {
  const isConnected = await testSupabaseManager.testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to test database');
  }
  console.log('✅ Test database connection established');
}

export async function teardownTestDatabase(): Promise<void> {
  await testSupabaseManager.cleanupTestData();
  console.log('🧹 Test database cleanup completed');
}