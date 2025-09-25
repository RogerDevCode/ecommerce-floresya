/**
 * 🌸 FloresYa Frontend-Specific Types
 * Types that require DOM/Window API - only for frontend compilation
 */

// Re-export all non-DOM types from index
export * from './index.js';

// Window extensions - only available in frontend context
declare global {
  interface Window {
    floresyaLogger?: import('./index').Logger;
    usersAdmin?: {
      goToPage(page: number): void;
      loadUsers(): void;
    };
  }
}

export type WindowWithFloresyaLogger = Window & {
  floresyaLogger?: import('./index').Logger;
};

export type WindowWithUsersAdmin = Window & {
  usersAdmin?: {
    goToPage(page: number): void;
    loadUsers(): void;
  };
};