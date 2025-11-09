import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Switch,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, addWeeks, subWeeks } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getSafeDatabase } from '../database/databaseHelper';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  type: 'workout' | 'meal' | 'appointment' | 'other';
  startTime: Date;
  endTime: Date;
  description?: string;
  location?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
}

type EventFilter = 'all' | 'workout' | 'meal' | 'appointment' | 'other';
type CalendarView = 'week' | 'month';

const CalendarScreen = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    type: 'workout',
    recurring: 'none',
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
  });
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>('week');

  // Monthly stats
  const [monthlyWorkouts, setMonthlyWorkouts] = useState(0);
  const [monthlyMeals, setMonthlyMeals] = useState(0);
  const [activeDays, setActiveDays] = useState(0);
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([]);

  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadEvents();
  }, [currentMonth]);

  useEffect(() => {
    if (events.length >= 0) {
      loadMonthlyStats();
    }
  }, [events]);

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [])
  );

  const loadMonthlyStats = async () => {
    try {
      // Load completed workouts
      const stored = await AsyncStorage.getItem('completedWorkouts');
      if (stored) {
        setCompletedWorkouts(JSON.parse(stored));
      }

      // Calculate stats for current month
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const workoutEvents = events.filter(e =>
        e.type === 'workout' &&
        e.startTime >= monthStart &&
        e.startTime <= monthEnd
      );
      const mealEvents = events.filter(e =>
        e.type === 'meal' &&
        e.startTime >= monthStart &&
        e.startTime <= monthEnd
      );

      setMonthlyWorkouts(workoutEvents.length);
      setMonthlyMeals(mealEvents.length);

      // Calculate active days (days with any event)
      const uniqueDays = new Set(
        events
          .filter(e => e.startTime >= monthStart && e.startTime <= monthEnd)
          .map(e => format(e.startTime, 'yyyy-MM-dd'))
      );
      setActiveDays(uniqueDays.size);
    } catch (error) {
      console.error('Error loading monthly stats:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const result = await db.getAllAsync(
        'SELECT * FROM calendar_events WHERE userId = ? AND date(startTime) BETWEEN ? AND ?',
        [user?.id || '', startDate, endDate]
      );

      const loadedEvents = result.map((row: any) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        startTime: new Date(row.startTime),
        endTime: new Date(row.endTime),
        description: row.description,
        location: row.location,
        recurring: row.recurring || 'none',
      }));

      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const saveEvent = async () => {
    if (!newEvent.title) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      const db = getSafeDatabase();
      if (!db) return;

      const eventId = `event_${Date.now()}`;

      await db.runAsync(
        `INSERT INTO calendar_events (id, userId, type, title, description, startTime, endTime, location, recurring)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId,
          user?.id || '',
          newEvent.type || 'other',
          newEvent.title,
          newEvent.description || '',
          newEvent.startTime?.toISOString() || new Date().toISOString(),
          newEvent.endTime?.toISOString() || new Date().toISOString(),
          newEvent.location || '',
          newEvent.recurring || 'none'
        ]
      );

      await loadEvents();
      await loadMonthlyStats();
      setModalVisible(false);
      setNewEvent({
        type: 'workout',
        recurring: 'none',
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
      });
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    }
  };

  const deleteEvent = async (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getSafeDatabase();
              if (!db) return;

              await db.runAsync('DELETE FROM calendar_events WHERE id = ?', [eventId]);
              await loadEvents();
              await loadMonthlyStats();
              setSelectedEvent(null);
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          }
        }
      ]
    );
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (calendarView === 'week') {
      setCurrentMonth(direction === 'next' ? addWeeks(currentMonth, 1) : subWeeks(currentMonth, 1));
    } else {
      setCurrentMonth(direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
    }
  };

  const hasEventOnDay = (day: Date) => {
    return events.some(e => isSameDay(e.startTime, day));
  };

  const hasWorkoutOnDay = (day: Date) => {
    return events.some(e => e.type === 'workout' && isSameDay(e.startTime, day));
  };

  const hasMealOnDay = (day: Date) => {
    return events.some(e => e.type === 'meal' && isSameDay(e.startTime, day));
  };

  const renderMonthlyStats = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>{format(currentMonth, 'MMMM yyyy')} Summary</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.15)' }]}>
            <MaterialCommunityIcons name="dumbbell" size={24} color="#FF6B35" />
          </View>
          <Text style={styles.statValue}>{monthlyWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
            <MaterialCommunityIcons name="food-apple" size={24} color="#FF9800" />
          </View>
          <Text style={styles.statValue}>{monthlyMeals}</Text>
          <Text style={styles.statLabel}>Meals</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(28, 176, 246, 0.15)' }]}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#1CB0F6" />
          </View>
          <Text style={styles.statValue}>{activeDays}</Text>
          <Text style={styles.statLabel}>Active Days</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
            <MaterialCommunityIcons name="target" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.statValue}>{Math.round((activeDays / 30) * 100)}%</Text>
          <Text style={styles.statLabel}>Goal</Text>
        </View>
      </View>
    </View>
  );

  const renderViewToggle = () => (
    <View style={styles.viewToggleContainer}>
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleButton, calendarView === 'week' && styles.viewToggleButtonActive]}
          onPress={() => setCalendarView('week')}
        >
          <Text style={[styles.viewToggleText, calendarView === 'week' && styles.viewToggleTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleButton, calendarView === 'month' && styles.viewToggleButtonActive]}
          onPress={() => setCalendarView('month')}
        >
          <Text style={[styles.viewToggleText, calendarView === 'month' && styles.viewToggleTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEventFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
        {(['all', 'workout', 'meal', 'appointment', 'other'] as EventFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              eventFilter === filter && styles.filterChipActive,
              eventFilter === filter && { backgroundColor: getEventColor(filter === 'all' ? 'workout' : filter) }
            ]}
            onPress={() => setEventFilter(filter)}
          >
            <MaterialCommunityIcons
              name={getEventIcon(filter === 'all' ? 'other' : filter) as any}
              size={16}
              color={eventFilter === filter ? '#FFF' : '#9CA3AF'}
            />
            <Text style={[styles.filterChipText, eventFilter === filter && styles.filterChipTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const getEventsForDay = (day: Date) => {
    return events.filter((e) => isSameDay(e.startTime, day));
  };

  const renderCalendar = () => {
    let startDate: Date;
    let endDate: Date;

    if (calendarView === 'week') {
      startDate = startOfWeek(currentMonth);
      endDate = endOfWeek(currentMonth);
    } else {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      startDate = startOfWeek(monthStart);
      endDate = endOfWeek(monthEnd);
    }

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['W', 'S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const headerText = calendarView === 'week'
      ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
      : format(currentMonth, 'MMMM yyyy');

    return (
      <Animated.View style={[styles.calendarCard, { opacity: fadeAnim }]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FF6B35" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{headerText}</Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthButton}>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <Text key={`weekday-${index}`} style={[styles.weekDayText, index === 0 && styles.weekNumberHeader]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isPast = day < new Date() && !isTodayDate;
                const weekNumber = format(day, 'w');

                return (
                  <React.Fragment key={`day-${day.toISOString()}`}>
                    {dayIndex === 0 && (
                      <View style={styles.weekNumberCell}>
                        <Text style={styles.weekNumberText}>{weekNumber}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.dayCell,
                        isSelected && styles.selectedDay,
                        isPast && styles.pastDay,
                      ]}
                      onPress={() => setSelectedDate(day)}
                      activeOpacity={0.7}
                    >
                      {isTodayDate && (
                        <View style={styles.todayCircle} />
                      )}
                      <Text
                        style={[
                          styles.dayText,
                          !isCurrentMonth && styles.otherMonthDay,
                          isSelected && styles.selectedDayText,
                          isTodayDate && styles.todayDayText,
                          isPast && styles.pastDayText,
                        ]}
                      >
                        {format(day, 'd')}
                      </Text>
                      <View style={styles.dayEventsContainer}>
                        {dayEvents.slice(0, 3).map((event, eventIndex) => (
                          <View
                            key={`event-${event.id}-${eventIndex}`}
                            style={[
                              styles.eventLabel,
                              { backgroundColor: getEventColor(event.type) },
                              isPast && styles.pastEventLabel,
                            ]}
                          >
                            <Text
                              style={[styles.eventLabelText, isPast && styles.pastEventLabelText]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {event.title}
                            </Text>
                          </View>
                        ))}
                        {dayEvents.length > 3 && (
                          <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderDayEvents = () => {
    const dayEvents = events
      .filter((e) => isSameDay(e.startTime, selectedDate))
      .filter((e) => eventFilter === 'all' || e.type === eventFilter);

    return (
      <View style={styles.eventsCard}>
        <View style={styles.eventsHeader}>
          <View>
            <Text style={styles.eventsTitle}>
              {format(selectedDate, 'EEEE')}
            </Text>
            <Text style={styles.eventsDate}>
              {format(selectedDate, 'MMMM d, yyyy')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addEventButton}
            onPress={() => {
              setNewEvent({ ...newEvent, startTime: selectedDate });
              setModalVisible(true);
            }}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
          {dayEvents.length === 0 ? (
            <View style={styles.noEventsContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={56} color="#4A5568" />
              <Text style={styles.noEventsText}>No events scheduled</Text>
              <Text style={styles.noEventsSubtext}>Tap + to add your first event</Text>
            </View>
          ) : (
            dayEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventItem}
                onPress={() => setSelectedEvent(event)}
                activeOpacity={0.7}
              >
                <View style={[styles.eventTypeIndicator, { backgroundColor: getEventColor(event.type) }]} />
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventMeta}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.eventTime}>
                      {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                    </Text>
                  </View>
                  {event.location && (
                    <View style={styles.eventMeta}>
                      <MaterialCommunityIcons name="map-marker" size={14} color="#9CA3AF" />
                      <Text style={styles.eventLocation}>{event.location}</Text>
                    </View>
                  )}
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#4A5568" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'workout':
        return '#FF6B35';
      case 'meal':
        return '#FF9800';
      case 'appointment':
        return '#1CB0F6';
      default:
        return '#9C27B0';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'workout':
        return 'dumbbell';
      case 'meal':
        return 'food-apple';
      case 'appointment':
        return 'calendar-check';
      case 'all':
        return 'filter-variant';
      default:
        return 'calendar';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <CustomHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderMonthlyStats()}
        {renderViewToggle()}
        {renderEventFilters()}
        {renderCalendar()}
        {renderDayEvents()}
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Event</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Event Type</Text>
              <View style={styles.eventTypeSelector}>
                {['workout', 'meal', 'appointment', 'other'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.eventTypeOption,
                      newEvent.type === type && { backgroundColor: getEventColor(type) },
                    ]}
                    onPress={() => setNewEvent({ ...newEvent, type: type as any })}
                  >
                    <MaterialCommunityIcons
                      name={getEventIcon(type) as any}
                      size={22}
                      color={newEvent.type === type ? 'white' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.eventTypeText,
                        newEvent.type === type && styles.selectedEventTypeText,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Event title"
                placeholderTextColor="#6B7280"
                value={newEvent.title}
                onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details (optional)"
                placeholderTextColor="#6B7280"
                value={newEvent.description}
                onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Add location (optional)"
                placeholderTextColor="#6B7280"
                value={newEvent.location}
                onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
              />

              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>{format(newEvent.startTime || new Date(), 'EEEE, MMMM d, yyyy')}</Text>
                <MaterialCommunityIcons name="calendar" size={20} color="#FF6B35" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Repeat</Text>
              <View style={styles.recurringSelector}>
                {['none', 'daily', 'weekly', 'monthly'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.recurringOption,
                      newEvent.recurring === option && styles.selectedRecurring,
                    ]}
                    onPress={() => setNewEvent({ ...newEvent, recurring: option as any })}
                  >
                    <Text
                      style={[
                        styles.recurringText,
                        newEvent.recurring === option && styles.selectedRecurringText,
                      ]}
                    >
                      {option === 'none' ? 'Never' : option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={saveEvent}
              >
                <Text style={styles.saveButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        visible={selectedEvent !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Event Details</Text>
              <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <View style={styles.eventDetailsContainer}>
                <View style={[styles.eventTypeBadge, { backgroundColor: getEventColor(selectedEvent.type) }]}>
                  <MaterialCommunityIcons name={getEventIcon(selectedEvent.type) as any} size={24} color="#FFF" />
                  <Text style={styles.eventTypeBadgeText}>
                    {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                  </Text>
                </View>

                <Text style={styles.eventDetailsTitle}>{selectedEvent.title}</Text>

                <View style={styles.eventDetailRow}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#9CA3AF" />
                  <Text style={styles.eventDetailText}>
                    {format(selectedEvent.startTime, 'EEEE, MMMM d, yyyy')}
                  </Text>
                </View>

                <View style={styles.eventDetailRow}>
                  <MaterialCommunityIcons name="timelapse" size={20} color="#9CA3AF" />
                  <Text style={styles.eventDetailText}>
                    {format(selectedEvent.startTime, 'h:mm a')} - {format(selectedEvent.endTime, 'h:mm a')}
                  </Text>
                </View>

                {selectedEvent.location && (
                  <View style={styles.eventDetailRow}>
                    <MaterialCommunityIcons name="map-marker" size={20} color="#9CA3AF" />
                    <Text style={styles.eventDetailText}>{selectedEvent.location}</Text>
                  </View>
                )}

                {selectedEvent.description && (
                  <View style={styles.eventDetailRow}>
                    <MaterialCommunityIcons name="text" size={20} color="#9CA3AF" />
                    <Text style={styles.eventDetailText}>{selectedEvent.description}</Text>
                  </View>
                )}

                <View style={styles.eventActionsContainer}>
                  <TouchableOpacity
                    style={[styles.eventActionButton, styles.deleteButton]}
                    onPress={() => deleteEvent(selectedEvent.id)}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="#FFF" />
                    <Text style={styles.eventActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {showTimePicker && (
        <DateTimePicker
          value={newEvent.startTime || new Date()}
          mode="date"
          display="default"
          onChange={(event: any, date?: Date) => {
            setShowTimePicker(false);
            if (date) {
              setNewEvent({ ...newEvent, startTime: date });
            }
          }}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
  },
  filterChipText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  calendarCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 20,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  weekNumberHeader: {
    fontSize: 10,
    color: '#6B7280',
  },
  daysGrid: {
    flexDirection: 'column',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekNumberCell: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNumberText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  dayCell: {
    flex: 1,
    height: 70,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginVertical: 2,
    marginHorizontal: 1,
    position: 'relative',
    borderRadius: 8,
    padding: 4,
  },
  selectedDay: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  pastDay: {
    opacity: 0.5,
  },
  todayCircle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    top: 2,
    zIndex: -1,
  },
  dayText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  otherMonthDay: {
    color: '#4A5568',
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '700',
  },
  todayDayText: {
    color: '#FFF',
    fontWeight: '700',
  },
  pastDayText: {
    opacity: 0.6,
  },
  dayEventsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 2,
  },
  eventLabel: {
    width: '100%',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    marginVertical: 1,
  },
  eventLabelText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: '600',
  },
  pastEventLabel: {
    opacity: 0.5,
  },
  pastEventLabelText: {
    opacity: 0.7,
  },
  moreEventsText: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
  },
  dayIndicators: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    gap: 2,
  },
  eventIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    minHeight: 200,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  eventsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  eventsDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  addEventButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsList: {
    maxHeight: 300,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  noEventsText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  noEventsSubtext: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 6,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#1E1E20',
    borderRadius: 12,
    marginBottom: 10,
  },
  eventTypeIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  eventTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  eventLocation: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2C2C2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderRadius: 24,
    maxHeight: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#1E1E20',
    color: '#FFF',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#1E1E20',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#FFF',
  },
  eventTypeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  eventTypeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1E1E20',
    gap: 6,
  },
  eventTypeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  selectedEventTypeText: {
    color: '#FFF',
    fontWeight: '600',
  },
  recurringSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  recurringOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1E1E20',
    alignItems: 'center',
  },
  selectedRecurring: {
    backgroundColor: '#FF6B35',
  },
  recurringText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  selectedRecurringText: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#3A3A3C',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  eventDetailsContainer: {
    padding: 20,
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  eventTypeBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eventDetailsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 20,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  eventDetailText: {
    fontSize: 16,
    color: '#E5E7EB',
    flex: 1,
  },
  eventActionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  eventActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  eventActionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewToggleContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 4,
  },
  viewToggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: '#FF6B35',
  },
  viewToggleText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  viewToggleTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default CalendarScreen;
