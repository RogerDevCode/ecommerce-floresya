/**
 * 🌸 FloresYa Occasions Service - Enterprise TypeScript Edition
 * Business logic for occasions management
 */

import { type Occasion, type OccasionCreateRequest, type OccasionUpdateRequest } from '../shared/types/index.js';

import { typeSafeDatabaseService } from './TypeSafeDatabaseService.js';

// Using TypeSafeDatabaseService for type-safe operations

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export class OccasionsService {
  /**
   * Get all active occasions ordered by display_order
   */
  public async getActiveOccasions(): Promise<Occasion[]> {
    const { data, error } = await typeSafeDatabaseService.getClient()
      .from('occasions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch occasions: ${error.message}`);
    }

    return (data as Occasion[]) ?? [];
  }

  /**
   * Get all occasions (including inactive) - admin only
   */
  public async getAllOccasions(): Promise<Occasion[]> {
    const { data, error } = await typeSafeDatabaseService.getClient()
      .from('occasions')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch all occasions: ${error.message}`);
    }

    return (data as Occasion[]) ?? [];
  }

  /**
   * Get single occasion by ID
   */
  public async getOccasionById(id: number): Promise<Occasion | null> {
    const { data, error } = await typeSafeDatabaseService.getClient()
      .from('occasions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Occasion not found
      }
      throw new Error(`Failed to fetch occasion: ${error.message}`);
    }

    return data as Occasion;
  }

  /**
   * Get occasion by slug
   */
  public async getOccasionBySlug(slug: string): Promise<Occasion | null> {
    const { data, error } = await typeSafeDatabaseService.getClient()
      .from('occasions')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Occasion not found
      }
      throw new Error(`Failed to fetch occasion by slug: ${error.message}`);
    }

    return data as Occasion;
  }

  /**
   * Create new occasion
   */
  public async createOccasion(occasionData: OccasionCreateRequest): Promise<Occasion> {
    // Generate slug if not provided
    const slug = occasionData.slug ?? generateSlug(occasionData.name);

    // Check if slug already exists
    const existingOccasion = await this.getOccasionBySlug(slug);
    if (existingOccasion) {
      throw new Error(`Occasion with slug '${slug}' already exists`);
    }

    const insertData = {
      ...occasionData,
      slug,
      // type: (occasionData.type ?? 'general') as OccasionType, // REMOVED: Column 'type' eliminated from occasions table
      is_active: true,
      display_order: occasionData.display_order ?? 0
    };

    // Use TypeSafe service method instead of direct insert
    const data = await typeSafeDatabaseService.createOccasion(insertData);

    if (!data) {
      throw new Error('No data returned from occasion creation');
    }

    return data;
  }

  /**
   * Update occasion
   */
  public async updateOccasion(updateData: OccasionUpdateRequest): Promise<Occasion> {
    const { id, ...updates } = updateData;

    // If name is being updated and no slug provided, regenerate slug
    if (updates.name && !updates.slug) {
      const newSlug = generateSlug(updates.name);

      // Check if new slug conflicts with another occasion
      const existingOccasion = await this.getOccasionBySlug(newSlug);
      if (existingOccasion && existingOccasion.id !== id) {
        throw new Error(`Occasion with slug '${newSlug}' already exists`);
      }

      updates.slug = newSlug;
    }

    // Use TypeSafe service method instead of direct update
    const data = await typeSafeDatabaseService.updateOccasion(id, updates as Partial<Occasion>);

    return data;
  }

  /**
   * Delete occasion (soft delete by setting is_active = false)
   */
  public async deleteOccasion(id: number): Promise<void> {
    // Check if occasion exists
    const occasion = await this.getOccasionById(id);
    if (!occasion) {
      throw new Error(`Occasion with ID ${id} not found`);
    }

    // Soft delete by setting is_active = false
    const { error } = await typeSafeDatabaseService.getClient()
      .from('occasions')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete occasion: ${error.message}`);
    }
  }

  /**
   * Get occasions by type
   */
  public async getOccasionsByType(type: string): Promise<Occasion[]> {
    const { data, error } = await typeSafeDatabaseService.getClient()
      .from('occasions')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch occasions by type: ${error.message}`);
    }

    return (data as Occasion[]) ?? [];
  }

  /**
   * Update display order for multiple occasions
   */
  public async updateDisplayOrder(updates: Array<{ id: number; display_order: number }>): Promise<void> {
    // Update each occasion's display order
    const promises = updates.map(({ id, display_order }) =>
      typeSafeDatabaseService.getClient()
        .from('occasions')
        .update({ display_order })
        .eq('id', id)
    );

    const results = await Promise.all(promises);

    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Failed to update display order: ${errors[0]?.error?.message}`);
    }
  }
}