/**
 * 🌸 FloresYa Admin - Event Emitter System
 * Simple event system for inter-module communication
 */

export interface EventCallback {
  (...args: any[]): void;
}

export class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  /**
   * Subscribe to an event (one-time only)
   */
  once(event: string, callback: EventCallback): void {
    const wrappedCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, wrappedCallback);
    };
    this.on(event, wrappedCallback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback?: EventCallback): void {
    if (!this.events.has(event)) return;

    if (!callback) {
      // Remove all listeners for this event
      this.events.delete(event);
      return;
    }

    const callbacks = this.events.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }

    // Clean up empty arrays
    if (callbacks.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event)!;
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event callback for "${event}":`, error);
      }
    });
  }

  /**
   * Get list of events with listeners
   */
  getEvents(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get number of listeners for an event
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.events.clear();
  }
}

// Global event emitter instance for admin modules
export const adminEvents = new EventEmitter();