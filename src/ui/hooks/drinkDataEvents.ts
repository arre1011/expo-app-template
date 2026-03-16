/**
 * Simple event emitter for drink data changes.
 *
 * This provides a centralized way to notify all screens when drink data changes
 * in the database, ensuring consistency across Home, Calendar, Statistics, and
 * Day Detail screens.
 *
 * Usage:
 * - Emit events when drinks are added/deleted: drinkDataEvents.emit('drinksChanged')
 * - Subscribe in stores/components: drinkDataEvents.on('drinksChanged', callback)
 * - Unsubscribe when done: drinkDataEvents.off('drinksChanged', callback)
 */

type EventCallback = () => void;
type EventType =
  | 'drinksChanged'
  | 'goalsChanged'
  | 'profileChanged'
  | 'sessionsChanged' // Session was created/updated/deleted
  | 'awardsChanged';  // Awards were recalculated (e.g., new milestone)

class DrinkDataEvents {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();

  on(event: EventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: EventType, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  emit(event: EventType): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Convenience method to emit drinksChanged event.
   * Call this after any drink add/delete/update operation.
   */
  notifyDrinksChanged(): void {
    this.emit('drinksChanged');
  }

  /**
   * Convenience method to emit goalsChanged event.
   * Call this after any goal add/update operation.
   */
  notifyGoalsChanged(): void {
    this.emit('goalsChanged');
  }

  /**
   * Convenience method to emit profileChanged event.
   * Call this after any profile update operation.
   */
  notifyProfileChanged(): void {
    this.emit('profileChanged');
  }

  /**
   * Convenience method to emit sessionsChanged event.
   * Call this after any session create/update/delete operation.
   */
  notifySessionsChanged(): void {
    this.emit('sessionsChanged');
  }

  /**
   * Convenience method to emit awardsChanged event.
   * Call this after any award recalculation that results in changes.
   */
  notifyAwardsChanged(): void {
    this.emit('awardsChanged');
  }
}

// Singleton instance
export const drinkDataEvents = new DrinkDataEvents();
