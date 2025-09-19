/**
 * 🌸 FloresYa Admin - Core Base Class
 * Base functionality for all admin modules
 */

import { EventEmitter, adminEvents } from './EventEmitter.js';

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

export interface WindowWithBootstrap extends Window {
  bootstrap?: {
    Modal: {
      new (element: Element, options?: any): {
        show(): void;
        hide(): void;
        dispose(): void;
        toggle(): void;
      };
      getInstance(element: Element): {
        hide(): void;
      } | null;
    };
  };
}

export abstract class AdminCore {
  protected events: EventEmitter = adminEvents;
  protected debugMode: boolean = true;

  constructor() {
    this.init();
  }

  /**
   * Initialize the module - to be overridden by child classes
   */
  protected abstract init(): void;

  /**
   * Centralized logging with consistent formatting
   */
  protected log(message: string, level: LogLevel = 'info'): void {
    const timestamp = new Date().toISOString();
    const moduleName = this.constructor.name;
    const output = `[🌸 ${moduleName}] [${level.toUpperCase()}] ${timestamp} — ${message}`;

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        // Only show critical warnings
        if (message.includes('CRITICAL') || message.includes('ERROR') || message.includes('FAILED')) {
          console.warn(output);
        }
        break;
      case 'success':
        console.log(`%c${output}`, 'color: green; font-weight: bold;');
        break;
      case 'debug':
        if (this.debugMode) {
          console.debug(output);
        }
        break;
      default:
        console.log(output);
        break;
    }
  }

  /**
   * Show error message to user
   */
  protected showError(message: string): void {
    this.log(`Error shown to user: ${message}`, 'error');
    // You can integrate with your toast/notification system here
    alert(message); // Temporary - replace with better UI
  }

  /**
   * Show success message to user
   */
  protected showSuccess(message: string): void {
    this.log(`Success shown to user: ${message}`, 'success');
    // You can integrate with your toast/notification system here
    // alert(message); // Temporary - replace with better UI
  }

  /**
   * Check if user is authenticated
   */
  protected async checkAuthentication(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.authenticated === true;
      }
      return false;
    } catch (error) {
      this.log('Authentication check failed: ' + error, 'error');
      return false;
    }
  }

  /**
   * Check if user has admin role
   */
  protected async checkAdminRole(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/role', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.role === 'admin';
      }
      return false;
    } catch (error) {
      this.log('Admin role check failed: ' + error, 'error');
      return false;
    }
  }

  /**
   * Create Bootstrap modal instance
   */
  protected createModal(elementId: string, options?: any): any {
    const element = document.getElementById(elementId);
    if (!element) {
      this.log(`Modal element with ID '${elementId}' not found`, 'error');
      return null;
    }

    const windowBootstrap = window as WindowWithBootstrap;
    if (!windowBootstrap.bootstrap?.Modal) {
      this.log('Bootstrap Modal not available', 'error');
      return null;
    }

    try {
      return new windowBootstrap.bootstrap.Modal(element, options);
    } catch (error) {
      this.log(`Error creating modal for '${elementId}': ${error}`, 'error');
      return null;
    }
  }

  /**
   * Show modal with fallback handling
   */
  protected showModal(elementId: string, options?: any): void {
    const modal = this.createModal(elementId, options);
    if (modal) {
      try {
        modal.show();
        this.log(`Modal '${elementId}' shown successfully`, 'info');
      } catch (error) {
        this.log(`Error showing modal '${elementId}': ${error}`, 'error');
        this.showFallbackModal(elementId);
      }
    } else {
      this.showFallbackModal(elementId);
    }
  }

  /**
   * Fallback modal display method
   */
  protected showFallbackModal(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'block';
      element.classList.add('show');
      element.style.opacity = '1';
      element.style.visibility = 'visible';
      this.log(`Fallback modal display used for '${elementId}'`, 'warn');
    }
  }

  /**
   * Hide modal
   */
  protected hideModal(elementId: string): void {
    const windowBootstrap = window as WindowWithBootstrap;
    const element = document.getElementById(elementId);

    if (element && windowBootstrap.bootstrap?.Modal) {
      try {
        const modalInstance = windowBootstrap.bootstrap.Modal.getInstance(element);
        if (modalInstance) {
          modalInstance.hide();
          this.log(`Modal '${elementId}' hidden successfully`, 'info');
          return;
        }
      } catch (error) {
        this.log(`Error hiding modal '${elementId}': ${error}`, 'error');
      }
    }

    // Fallback hiding
    if (element) {
      element.style.display = 'none';
      element.classList.remove('show');
      this.log(`Fallback modal hide used for '${elementId}'`, 'warn');
    }
  }

  /**
   * Remove modal from DOM
   */
  protected removeModal(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.remove();
      this.log(`Modal '${elementId}' removed from DOM`, 'info');
    }
  }

  /**
   * Helper to safely access form data
   */
  protected getFormData(formElement: HTMLFormElement): FormData {
    return new FormData(formElement);
  }

  /**
   * Helper to safely get element value
   */
  protected getElementValue(elementId: string): string {
    const element = document.getElementById(elementId) as HTMLInputElement;
    return element?.value || '';
  }

  /**
   * Helper to safely set element value
   */
  protected setElementValue(elementId: string, value: string): void {
    const element = document.getElementById(elementId) as HTMLInputElement;
    if (element) {
      element.value = value;
    }
  }

  /**
   * Helper to safely get checkbox state
   */
  protected getCheckboxState(elementId: string): boolean {
    const element = document.getElementById(elementId) as HTMLInputElement;
    return element?.checked || false;
  }

  /**
   * Helper to safely set checkbox state
   */
  protected setCheckboxState(elementId: string, checked: boolean): void {
    const element = document.getElementById(elementId) as HTMLInputElement;
    if (element) {
      element.checked = checked;
    }
  }

  /**
   * Helper to safely update element content
   */
  protected updateElement(elementId: string, content: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = content;
    }
  }

  /**
   * Helper to safely update element HTML
   */
  protected updateElementHTML(elementId: string, html: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = html;
    }
  }

  /**
   * Cleanup method - called when module is destroyed
   */
  public destroy(): void {
    // Remove all event listeners for this module
    this.events.removeAllListeners();
    this.log('Module destroyed and cleaned up', 'info');
  }
}