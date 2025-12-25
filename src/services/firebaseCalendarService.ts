import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface CalendarEvent {
  id: string;
  userId: string;
  type: 'workout' | 'meal' | 'appointment' | 'other';
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  allDay?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class FirebaseCalendarService {
  private collectionName = 'calendar_events';

  /**
   * Save or update a calendar event to Firebase
   */
  async saveEvent(userId: string, event: Omit<CalendarEvent, 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const eventRef = doc(db, this.collectionName, event.id);

      const now = new Date();
      const eventData: CalendarEvent = {
        ...event,
        userId,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(eventRef, {
        ...eventData,
        startTime: Timestamp.fromDate(event.startTime),
        endTime: Timestamp.fromDate(event.endTime),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

      console.log(`✅ Event ${event.id} saved to Firebase`);
    } catch (error) {
      console.error('❌ Error saving event to Firebase:', error);
      throw error;
    }
  }

  /**
   * Get all events for a user within a date range
   */
  async getEvents(userId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const eventsRef = collection(db, this.collectionName);
      const q = query(
        eventsRef,
        where('userId', '==', userId),
        where('startTime', '>=', Timestamp.fromDate(startDate)),
        where('startTime', '<=', Timestamp.fromDate(endDate)),
        orderBy('startTime', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const events: CalendarEvent[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          description: data.description,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
          location: data.location,
          recurring: data.recurring || 'none',
          allDay: data.allDay || false,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      console.log(`✅ Loaded ${events.length} events from Firebase`);
      return events;
    } catch (error) {
      console.error('❌ Error loading events from Firebase:', error);
      throw error;
    }
  }

  /**
   * Delete an event from Firebase
   */
  async deleteEvent(eventId: string): Promise<void> {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    try {
      const eventRef = doc(db, this.collectionName, eventId);
      await deleteDoc(eventRef);
      console.log(`✅ Event ${eventId} deleted from Firebase`);
    } catch (error) {
      console.error('❌ Error deleting event from Firebase:', error);
      throw error;
    }
  }

  /**
   * Sync local SQLite events to Firebase (for migration/backup)
   */
  async syncLocalToFirebase(userId: string, localEvents: any[]): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const promises = localEvents.map(event =>
        this.saveEvent(userId, {
          id: event.id,
          type: event.type,
          title: event.title,
          description: event.description,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          location: event.location,
          recurring: event.recurring || 'none',
        })
      );

      await Promise.all(promises);
      console.log(`✅ Synced ${localEvents.length} local events to Firebase`);
    } catch (error) {
      console.error('❌ Error syncing local events to Firebase:', error);
      throw error;
    }
  }

  /**
   * Generate recurring event instances for a date range
   */
  generateRecurringInstances(
    baseEvent: CalendarEvent,
    startDate: Date,
    endDate: Date
  ): CalendarEvent[] {
    if (baseEvent.recurring === 'none') {
      return [];
    }

    const instances: CalendarEvent[] = [];
    let currentDate = new Date(baseEvent.startTime);
    const duration = baseEvent.endTime.getTime() - baseEvent.startTime.getTime();

    while (currentDate <= endDate) {
      if (currentDate >= startDate) {
        const instanceStart = new Date(currentDate);
        const instanceEnd = new Date(currentDate.getTime() + duration);

        instances.push({
          ...baseEvent,
          id: `${baseEvent.id}_${instanceStart.toISOString()}`,
          startTime: instanceStart,
          endTime: instanceEnd,
        });
      }

      // Increment date based on recurring type
      switch (baseEvent.recurring) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }

      // Safety: prevent infinite loop
      if (instances.length > 100) {
        console.warn('⚠️ Generated 100+ recurring instances, stopping');
        break;
      }
    }

    return instances;
  }
}

// Export singleton instance
const firebaseCalendarService = new FirebaseCalendarService();
export default firebaseCalendarService;
