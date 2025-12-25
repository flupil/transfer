import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameMonth,
  addDays,
  startOfDay,
  setHours,
  setMinutes,
} from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import firebaseCalendarService from '../services/firebaseCalendarService';
import { getSelectedWorkoutPlan, WorkoutPlan } from '../services/workoutPlanService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import deviceCalendarSyncService from '../services/deviceCalendarSyncService';
import { BRAND_COLORS } from '../constants/brandColors';

const { width, height } = Dimensions.get('window');

// Calendar color palette - Changed from blue to orange/red theme
const CALENDAR_COLORS = {
  primary: '#E94E1B', // Will be overridden by BRAND_COLORS.accent in FAB
  blueberry: '#4285F4',
  peacock: '#039BE5',
  sage: '#33B679',
  basil: '#0B8043',
  flamingo: '#E67C73',
  tomato: '#D50000',
  tangerine: '#F4511E',
  banana: '#F6BF26',
  lavender: '#7986CB',
  grape: '#8E24AA',
  graphite: '#616161',
};

const EVENT_COLORS = [
  { id: 'blueberry', color: CALENDAR_COLORS.blueberry, name: 'Blueberry' },
  { id: 'peacock', color: CALENDAR_COLORS.peacock, name: 'Peacock' },
  { id: 'sage', color: CALENDAR_COLORS.sage, name: 'Sage' },
  { id: 'basil', color: CALENDAR_COLORS.basil, name: 'Basil' },
  { id: 'flamingo', color: CALENDAR_COLORS.flamingo, name: 'Flamingo' },
  { id: 'tomato', color: CALENDAR_COLORS.tomato, name: 'Tomato' },
  { id: 'tangerine', color: CALENDAR_COLORS.tangerine, name: 'Tangerine' },
  { id: 'banana', color: CALENDAR_COLORS.banana, name: 'Banana' },
  { id: 'lavender', color: CALENDAR_COLORS.lavender, name: 'Lavender' },
  { id: 'grape', color: CALENDAR_COLORS.grape, name: 'Grape' },
  { id: 'graphite', color: CALENDAR_COLORS.graphite, name: 'Graphite' },
];

interface Event {
  id: string;
  title: string;
  type: 'workout' | 'meal' | 'appointment' | 'other';
  color?: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  location?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  allDay?: boolean;
}

type ViewMode = 'month' | 'week' | '3day' | 'day' | 'schedule';

const CalendarScreenNew = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMenuVisible, setViewMenuVisible] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);
  const [includeWorkouts, setIncludeWorkouts] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [userWorkoutDays, setUserWorkoutDays] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    type: 'workout',
    color: CALENDAR_COLORS.blueberry,
    recurring: 'none',
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
  });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const weekDays = useMemo(() => {
    const startDate = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [selectedDate]);

  const threeDays = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => addDays(selectedDate, i));
  }, [selectedDate]);

  const next7Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, []);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour <= 23; hour++) {
      slots.push(setMinutes(setHours(selectedDate, hour), 0));
    }
    return slots;
  }, [selectedDate]);

  useEffect(() => {
    loadEvents();
    loadWorkoutPlan();
    loadWorkoutPreference();
    loadUserWorkoutDays();
  }, [currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
      loadWorkoutPlan();
      loadUserWorkoutDays();
    }, [currentMonth])
  );

  const loadEvents = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const loadedEvents = await firebaseCalendarService.getEvents(user.id, monthStart, monthEnd);
      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkoutPlan = async () => {
    try {
      const plan = await getSelectedWorkoutPlan();
      console.log('📅 Loaded workout plan:', plan?.name, 'Days:', plan?.daysPerWeek);
      if (plan) {
        console.log('📅 Workouts:', plan.workouts.map(w => `${w.day}: ${w.name}`));
      }
      setWorkoutPlan(plan);
    } catch (error) {
      console.error('Error loading workout plan:', error);
    }
  };

  const loadWorkoutPreference = async () => {
    try {
      const pref = await AsyncStorage.getItem('@include_workouts');
      if (pref !== null) {
        setIncludeWorkouts(pref === 'true');
      }
    } catch (error) {
      console.error('Error loading workout preference:', error);
    }
  };

  const loadUserWorkoutDays = async () => {
    try {
      if (!user?.id) return;
      const userDataStr = await AsyncStorage.getItem(`user_profile_${user.id}`);
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData.workoutDays && Array.isArray(userData.workoutDays)) {
          setUserWorkoutDays(userData.workoutDays);
          console.log('📅 User workout days:', userData.workoutDays);
        }
      }
    } catch (error) {
      console.error('Error loading user workout days:', error);
    }
  };

  const toggleIncludeWorkouts = async (value: boolean) => {
    try {
      console.log('🔄 Toggle include workouts:', value);
      setIncludeWorkouts(value);
      await AsyncStorage.setItem('@include_workouts', value.toString());
    } catch (error) {
      console.error('Error saving workout preference:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const success = await deviceCalendarSyncService.syncWorkoutPlan(4);
      if (success) {
        Alert.alert(
          'Sync Complete',
          'Your workouts have been synced to your device calendar!'
        );
      }
    } catch (error) {
      console.error('Error syncing workouts:', error);
      Alert.alert('Sync Failed', 'Failed to sync workouts to calendar. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Convert workout plan to calendar events
  const getWorkoutEvents = useMemo(() => {
    // Helper function to remove "Day X - " or "Day X: " prefix from workout names
    const cleanWorkoutName = (name: string): string => {
      return name.replace(/^Day \d+\s*[-:]\s*/i, '');
    };

    console.log('🏋️ Generating workout events. Plan:', !!workoutPlan, 'Include:', includeWorkouts, 'User days:', userWorkoutDays);
    if (!workoutPlan || !includeWorkouts) {
      console.log('🏋️ Skipping workout events - no plan or disabled');
      return [];
    }

    const workoutEvents: Event[] = [];
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
    const dayNameToNumber: { [key: string]: number } = {
      'sunday': 0,
      'Monday': 1,
      'monday': 1,
      'tuesday': 2,
      'Tuesday': 2,
      'wednesday': 3,
      'Wednesday': 3,
      'thursday': 4,
      'Thursday': 4,
      'friday': 5,
      'Friday': 5,
      'saturday': 6,
      'Saturday': 6,
      'Sunday': 0,
    };

    // Convert user's selected workout days to day numbers
    const userWorkoutDayNumbers = userWorkoutDays.map(day => dayNameToNumber[day.toLowerCase()]).filter(n => n !== undefined);

    // Check if this is a "Day 1, Day 2, Day 3" type plan or "Monday, Tuesday" type plan
    const firstWorkoutDay = workoutPlan.workouts[0]?.day;
    const isDayNumberPlan = firstWorkoutDay?.startsWith('Day ');

    if (isDayNumberPlan) {
      // Handle "Day 1", "Day 2" plans - respect the plan's days per week
      let currentDate = new Date(monthStart);
      const endDate = new Date(monthEnd);

      // Track which week we're in and how many workouts we've scheduled this week
      let currentWeekStart = startOfWeek(currentDate);
      let workoutsThisWeek = 0;
      let workoutIndex = 0;

      while (currentDate <= endDate) {
        // Check if we've started a new week
        const weekStart = startOfWeek(currentDate);
        if (weekStart.getTime() !== currentWeekStart.getTime()) {
          currentWeekStart = weekStart;
          workoutsThisWeek = 0;
          workoutIndex = 0; // Reset to Day 1 each week
        }

        // Check if this day is one of the user's workout days
        const dayOfWeek = currentDate.getDay();
        const isUserWorkoutDay = userWorkoutDayNumbers.length === 0 || userWorkoutDayNumbers.includes(dayOfWeek);

        // Only add workout if:
        // 1. It's a user workout day
        // 2. We haven't exceeded the plan's days per week
        // 3. There are still workouts left in the plan to assign
        if (isUserWorkoutDay && workoutsThisWeek < workoutPlan.daysPerWeek && workoutIndex < workoutPlan.workouts.length) {
          const workout = workoutPlan.workouts[workoutIndex];

          // Check if it's a rest day
          const isRestDay = workout.name.toLowerCase().includes('rest') ||
                            workout.focusArea?.toLowerCase().includes('rest') ||
                            workout.exercises.length === 0;

          if (!isRestDay) {
            // Parse duration to get end time
            const durationMatch = workout.duration.match(/(\d+)/);
            const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;

            const startTime = setMinutes(setHours(currentDate, 9), 0); // Default to 9 AM
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

            workoutEvents.push({
              id: `workout-${workout.id}-${format(currentDate, 'yyyy-MM-dd')}`,
              title: cleanWorkoutName(workout.name),
              type: 'workout',
              color: CALENDAR_COLORS.tangerine,
              startTime,
              endTime,
              description: `${workout.focusArea} • ${workout.exercises.length} exercises`,
              location: '',
              recurring: 'none',
              allDay: false,
            });

            workoutsThisWeek++;
          }

          workoutIndex++;
        }

        currentDate = addDays(currentDate, 1);
      }
    } else {
      // Handle named day plans (Monday, Tuesday, etc.)
      workoutPlan.workouts.forEach((workout) => {
        // Skip rest days
        const isRestDay = workout.name.toLowerCase().includes('rest') ||
                          workout.focusArea?.toLowerCase().includes('rest') ||
                          workout.exercises.length === 0;

        if (isRestDay) return;

        const dayNumber = dayNameToNumber[workout.day];
        if (dayNumber === undefined) return;

        // Find all occurrences of this day in the current month view
        let currentDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        while (currentDate <= endDate) {
          if (currentDate.getDay() === dayNumber && currentDate >= monthStart && currentDate <= monthEnd) {
            // Parse duration to get end time (e.g., "60 min" -> 60 minutes)
            const durationMatch = workout.duration.match(/(\d+)/);
            const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;

            const startTime = setMinutes(setHours(currentDate, 9), 0); // Default to 9 AM
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

            workoutEvents.push({
              id: `workout-${workout.id}-${format(currentDate, 'yyyy-MM-dd')}`,
              title: cleanWorkoutName(workout.name),
              type: 'workout',
              color: CALENDAR_COLORS.tangerine,
              startTime,
              endTime,
              description: `${workout.focusArea} • ${workout.exercises.length} exercises`,
              location: '',
              recurring: 'none',
              allDay: false,
            });
          }
          currentDate = addDays(currentDate, 1);
        }
      });
    }

    console.log('🏋️ Generated', workoutEvents.length, 'workout events');
    return workoutEvents;
  }, [workoutPlan, includeWorkouts, currentMonth, userWorkoutDays]);

  // Combine regular events with workout events
  const allEvents = useMemo(() => {
    const combined = [...events, ...getWorkoutEvents];
    console.log('📅 Total events:', combined.length, '(Regular:', events.length, 'Workouts:', getWorkoutEvents.length, ')');
    return combined;
  }, [events, getWorkoutEvents]);

  const selectedDayEvents = useMemo(() => {
    return allEvents
      .filter((e) => isSameDay(e.startTime, selectedDate))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [allEvents, selectedDate]);

  const openEventModal = (timeSlot?: Date) => {
    const now = new Date();
    const defaultStart = timeSlot || now;
    const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);

    setSelectedTimeSlot(timeSlot || null);
    setNewEvent({
      title: '',
      type: 'workout',
      color: CALENDAR_COLORS.blueberry,
      recurring: 'none',
      startTime: defaultStart,
      endTime: defaultEnd,
      allDay: false,
    });
    setModalVisible(true);
  };

  const saveEvent = async () => {
    // Debug logging
    console.log('Saving event:', {
      hasUser: !!user?.id,
      title: newEvent.title,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
    });

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!newEvent.title?.trim()) {
      Alert.alert('Error', 'Please enter a title for the event');
      return;
    }

    if (!newEvent.startTime) {
      Alert.alert('Error', 'Start time is missing');
      return;
    }

    if (!newEvent.endTime) {
      Alert.alert('Error', 'End time is missing');
      return;
    }

    if (newEvent.startTime >= newEvent.endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      setSaving(true);
      const eventToSave = {
        id: Date.now().toString(),
        title: newEvent.title,
        type: newEvent.type || 'other',
        color: newEvent.color || CALENDAR_COLORS.blueberry,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        description: newEvent.description || '',
        location: newEvent.location || '',
        recurring: newEvent.recurring || 'none',
        allDay: newEvent.allDay || false,
      };

      await firebaseCalendarService.saveEvent(user.id, eventToSave);
      setEvents((prev) => [...prev, eventToSave as Event]);
      setModalVisible(false);
      setSelectedTimeSlot(null);
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    Alert.alert('Delete Event', 'Delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await firebaseCalendarService.deleteEvent(eventId);
            setEvents((prev) => prev.filter((e) => e.id !== eventId));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete event');
          }
        },
      },
    ]);
  };

  const getEventsForDay = (day: Date) => {
    return allEvents.filter((e) => isSameDay(e.startTime, day));
  };

  const getAllDayEventsForDay = (day: Date) => {
    return allEvents.filter((e) => isSameDay(e.startTime, day) && e.allDay);
  };

  const getTimedEventsForDay = (day: Date) => {
    return allEvents.filter((e) => isSameDay(e.startTime, day) && !e.allDay);
  };

  const getEventsForTimeSlot = (timeSlot: Date) => {
    return allEvents.filter((e) => {
      const eventHour = e.startTime.getHours();
      const slotHour = timeSlot.getHours();
      return isSameDay(e.startTime, timeSlot) && eventHour === slotHour && !e.allDay;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    setViewMenuVisible(false);
  };

  // Month View - Wider and taller cells
  const renderMonthView = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    return (
      <View style={styles.monthView}>
        <View style={styles.weekdaysRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
            const isCurrentWeekday = i === currentDayOfWeek;
            return (
              <View key={i} style={styles.weekdayCell}>
                <Text style={[
                  styles.weekdayText,
                  { color: isCurrentWeekday ? CALENDAR_COLORS.primary : colors.textSecondary },
                  isCurrentWeekday && { fontWeight: '700' }
                ]}>{day}</Text>
              </View>
            );
          })}
        </View>

      <View style={styles.daysGrid}>
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isCurrentMonthDay = isSameMonth(day, currentMonth);

          return (
            <TouchableOpacity
              key={index}
              style={styles.monthDayCell}
              onPress={() => {
                setSelectedDate(day);
                setViewMode('day');
              }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.dayContainer,
                { backgroundColor: isDark ? '#3D3D3D' : '#F5F5F5' },
                !isCurrentMonthDay && { opacity: 0.4 },
                isSelected && {
                  backgroundColor: isDark ? 'rgba(233, 78, 27, 0.3)' : 'rgba(233, 78, 27, 0.15)',
                  borderColor: CALENDAR_COLORS.primary,
                  borderWidth: 2,
                },
              ]}>
                <View style={[
                  styles.dayNumberWrapper,
                  isCurrentDay && !isSelected && {
                    backgroundColor: CALENDAR_COLORS.primary,
                  },
                ]}>
                  <Text style={[
                    styles.monthDayNumber,
                    { color: isCurrentMonthDay ? colors.text : colors.textSecondary },
                    isCurrentDay && !isSelected && { color: '#FFFFFF', fontWeight: '700' },
                    isSelected && { color: CALENDAR_COLORS.primary, fontWeight: '700' },
                  ]}>
                    {format(day, 'd')}
                  </Text>
                </View>

                {dayEvents.length > 0 && (
                  <View style={styles.eventBars}>
                    {dayEvents.slice(0, 3).map((event, i) => {
                      console.log('Displaying event:', event.id, 'title:', event.title);
                      return (
                        <View
                          key={event.id}
                          style={[styles.monthEventBar, { backgroundColor: event.color || CALENDAR_COLORS.blueberry }]}
                        >
                          <Text style={styles.monthEventText} numberOfLines={1}>
                            {event.title || 'Untitled'}
                          </Text>
                        </View>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <Text style={[styles.moreEvents, { color: colors.textSecondary }]}>+{dayEvents.length - 3} more</Text>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
    );
  };

  // Week View - Google Calendar style with hourly grid
  const renderWeekView = () => {
    const hasAllDayEvents = weekDays.some((day) => getAllDayEventsForDay(day).length > 0);

    return (
      <View style={[styles.weekView, { backgroundColor: colors.background }]}>
        {/* Week header with days */}
        <View style={[styles.weekHeader, { backgroundColor: isDark ? '#3D3D3D' : '#E8EAED' }]}>
          <View style={styles.weekTimeColumn} />
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => {
              const isCurrentDay = isToday(day);
              const isSelected = isSameDay(day, selectedDate);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.weekDayHeader,
                    isSelected && { backgroundColor: CALENDAR_COLORS.primary + '15' }
                  ]}
                  onPress={() => setSelectedDate(day)}
                >
                  <Text style={[
                    styles.weekDayName,
                    { color: isCurrentDay ? CALENDAR_COLORS.primary : colors.textSecondary },
                    isCurrentDay && { fontWeight: '700' }
                  ]}>
                    {format(day, 'EEE')}
                  </Text>
                  <View style={styles.weekDayNumberBadge}>
                    <Text style={[
                      styles.weekDayNumberText,
                      { color: colors.text }
                    ]}>
                      {format(day, 'd')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* All-day events section */}
        {hasAllDayEvents && (
          <View style={[styles.allDaySection, { backgroundColor: isDark ? '#3D3D3D' : '#E8EAED' }]}>
            <View style={styles.allDayLabel}>
              <Text style={[styles.allDayLabelText, { color: colors.textSecondary }]}>All-day</Text>
            </View>
            <View style={styles.allDaySlotsRow}>
              {weekDays.map((day, dayIndex) => {
                const allDayEvents = getAllDayEventsForDay(day);
                return (
                  <View key={dayIndex} style={styles.weekDaySlot}>
                    {allDayEvents.length > 0 ? (
                      allDayEvents.map((event) => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.allDayEventBar,
                            { backgroundColor: event.color || CALENDAR_COLORS.blueberry }
                          ]}
                          onPress={() => deleteEvent(event.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.allDayEventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.allDayEmptySlot} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Time slots grid */}
        <ScrollView style={styles.weekGridContainer} showsVerticalScrollIndicator={false}>
        {timeSlots.map((timeSlot, hourIndex) => (
          <View key={hourIndex} style={styles.weekTimeRow}>
            {/* Time label */}
            <View style={styles.weekTimeLabel}>
              <Text style={[styles.weekTimeLabelText, { color: colors.textSecondary }]}>
                {format(timeSlot, 'h a')}
              </Text>
            </View>

            {/* Event slots for each day */}
            <View style={styles.weekSlotsRow}>
              {weekDays.map((day, dayIndex) => {
                const dayTimeSlot = setHours(setMinutes(day, 0), timeSlot.getHours());
                const slotEvents = getEventsForTimeSlot(dayTimeSlot);
                const hasEvent = slotEvents.length > 0;

                return (
                  <View key={dayIndex} style={styles.weekDaySlot}>
                    {hasEvent ? (
                      slotEvents.map((event) => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.weekEventBar,
                            { backgroundColor: event.color || CALENDAR_COLORS.blueberry }
                          ]}
                          onPress={() => deleteEvent(event.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.weekEventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.weekEmptySlot,
                          { backgroundColor: isDark ? '#2D2D2D' : '#D8D9DD' }
                        ]}
                        onPress={() => {
                          setSelectedDate(day);
                          openEventModal(dayTimeSlot);
                        }}
                        activeOpacity={0.6}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
    );
  };

  // 3-Day View - Compact multi-day grid
  const render3DayView = () => (
    <View style={[styles.weekView, { backgroundColor: colors.background }]}>
      {/* 3-day header */}
      <View style={[styles.weekHeader, { backgroundColor: isDark ? '#3D3D3D' : '#E8EAED' }]}>
        <View style={styles.weekTimeColumn} />
        <View style={styles.weekDaysRow}>
          {threeDays.map((day, index) => {
            const isCurrentDay = isToday(day);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.threeDayHeader,
                  isSelected && { backgroundColor: CALENDAR_COLORS.primary + '15' }
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[
                  styles.weekDayName,
                  { color: isCurrentDay ? CALENDAR_COLORS.primary : colors.textSecondary },
                  isCurrentDay && { fontWeight: '700' }
                ]}>
                  {format(day, 'EEE')}
                </Text>
                <View style={styles.weekDayNumberBadge}>
                  <Text style={[
                    styles.weekDayNumberText,
                    { color: colors.text }
                  ]}>
                    {format(day, 'd')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Time slots grid */}
      <ScrollView style={styles.weekGridContainer} showsVerticalScrollIndicator={false}>
        {timeSlots.map((timeSlot, hourIndex) => (
          <View key={hourIndex} style={styles.weekTimeRow}>
            {/* Time label */}
            <View style={styles.weekTimeLabel}>
              <Text style={[styles.weekTimeLabelText, { color: colors.textSecondary }]}>
                {format(timeSlot, 'h a')}
              </Text>
            </View>

            {/* Event slots for each day */}
            <View style={styles.weekSlotsRow}>
              {threeDays.map((day, dayIndex) => {
                const dayTimeSlot = setHours(setMinutes(day, 0), timeSlot.getHours());
                const slotEvents = getEventsForTimeSlot(dayTimeSlot);
                const hasEvent = slotEvents.length > 0;

                return (
                  <View key={dayIndex} style={styles.threeDaySlot}>
                    {hasEvent ? (
                      slotEvents.map((event) => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.weekEventBar,
                            { backgroundColor: event.color || CALENDAR_COLORS.blueberry }
                          ]}
                          onPress={() => deleteEvent(event.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.weekEventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.weekEmptySlot,
                          { backgroundColor: isDark ? '#2D2D2D' : '#D8D9DD' }
                        ]}
                        onPress={() => {
                          setSelectedDate(day);
                          openEventModal(dayTimeSlot);
                        }}
                        activeOpacity={0.6}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );

  // Day View
  const renderDayView = () => {
    const allDayEvents = getAllDayEventsForDay(selectedDate);

    return (
      <View style={[styles.dayView, { backgroundColor: colors.background }]}>
        <View style={[styles.dayViewHeader, { backgroundColor: isDark ? '#3D3D3D' : '#E8EAED' }]}>
          <Text style={[styles.dayViewTitle, { color: colors.text }]}>
            {format(selectedDate, 'EEEE')}
          </Text>
          <Text style={[styles.dayViewDate, { color: colors.textSecondary }]}>
            {format(selectedDate, 'MMMM d, yyyy')}
          </Text>
        </View>

        {/* All-day events section */}
        {allDayEvents.length > 0 && (
          <View style={[styles.dayAllDaySection, { backgroundColor: isDark ? '#3D3D3D' : '#E8EAED' }]}>
            <Text style={[styles.dayAllDayLabel, { color: colors.textSecondary }]}>All-day</Text>
            {allDayEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.dayAllDayEventBar,
                  { backgroundColor: event.color || CALENDAR_COLORS.blueberry }
                ]}
                onPress={() => deleteEvent(event.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.dayAllDayEventTitle}>
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView style={styles.timeSlotsList} showsVerticalScrollIndicator={false}>
        {timeSlots.map((timeSlot, index) => {
          const slotEvents = getEventsForTimeSlot(timeSlot);
          const hasEvent = slotEvents.length > 0;

          return (
            <View key={index} style={styles.timeSlotRow}>
              <View style={styles.timeLabel}>
                <Text style={[styles.timeLabelText, { color: colors.textSecondary }]}>
                  {format(timeSlot, 'h a')}
                </Text>
              </View>

              <View style={styles.eventBarContainer}>
                {hasEvent ? (
                  slotEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={[
                        styles.eventBar,
                        { backgroundColor: event.color || CALENDAR_COLORS.blueberry }
                      ]}
                      onPress={() => deleteEvent(event.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eventBarTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.eventBarTime} numberOfLines={1}>
                        {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.emptyEventBar,
                      { backgroundColor: isDark ? '#2D2D2D' : '#D8D9DD' }
                    ]}
                    onPress={() => openEventModal(timeSlot)}
                    activeOpacity={0.6}
                  />
                )}
              </View>
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
    );
  };

  // Schedule View
  const renderScheduleView = () => (
    <ScrollView style={[styles.scheduleView, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {next7Days.map((day, dayIndex) => {
        const dayEvents = getEventsForDay(day);
        const isCurrentDay = isToday(day);
        const dayName = isCurrentDay ? 'Today' : format(day, 'EEEE');

        return (
          <View key={dayIndex} style={styles.scheduleDay}>
            <View style={[styles.scheduleDateHeader, { backgroundColor: isDark ? '#3D3D3D' : '#E8EAED' }]}>
              <Text style={[styles.scheduleDateText, { color: colors.text }]}>
                {dayName}
              </Text>
              <Text style={[styles.scheduleDateSubtext, { color: colors.textSecondary }]}>
                {format(day, 'MMMM d, yyyy')}
              </Text>
            </View>

            {dayEvents.length > 0 ? (
              dayEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.scheduleEventCard,
                    { backgroundColor: isDark ? '#3D3D3D' : '#F5F5F5' }
                  ]}
                  onPress={() => deleteEvent(event.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.scheduleEventColor, { backgroundColor: event.color || CALENDAR_COLORS.blueberry }]} />
                  <View style={styles.scheduleEventContent}>
                    <Text style={[styles.scheduleEventTitle, { color: colors.text }]}>
                      {event.title}
                    </Text>
                    <View style={styles.scheduleEventTime}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.scheduleEventTimeText, { color: colors.textSecondary }]}>
                        {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                      </Text>
                    </View>
                    {event.location && (
                      <View style={styles.scheduleEventLocation}>
                        <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.scheduleEventLocationText, { color: colors.textSecondary }]}>
                          {event.location}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                style={[
                  styles.scheduleEmptyBar,
                  { backgroundColor: isDark ? '#3D3D3D' : '#F5F5F5' }
                ]}
                onPress={() => {
                  setSelectedDate(day);
                  openEventModal();
                }}
                activeOpacity={0.6}
              >
                <View style={[styles.scheduleEventColor, { backgroundColor: isDark ? '#3D3D3D' : '#E8EAED' }]} />
                <View style={styles.scheduleEventContent}>
                  <Text style={[styles.scheduleEmptyText, { color: colors.textSecondary }]}>
                    No events scheduled
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Header with hamburger menu */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          {/* Hamburger menu button */}
          <TouchableOpacity
            style={styles.hamburgerButton}
            onPress={() => setViewMenuVisible(true)}
          >
            <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Sync button */}
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSync}
            disabled={syncing}
          >
            <MaterialCommunityIcons
              name={syncing ? "sync" : "calendar-sync"}
              size={22}
              color={syncing ? CALENDAR_COLORS.primary : colors.text}
            />
          </TouchableOpacity>

          {/* Month title */}
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {format(currentMonth, 'MMMM yyyy')}
          </Text>

          {/* Navigation buttons */}
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CALENDAR_COLORS.primary} />
        </View>
      ) : (
        <>
          {viewMode === 'month' && (
            <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
              {renderMonthView()}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === '3day' && render3DayView()}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'schedule' && renderScheduleView()}
        </>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: BRAND_COLORS.accent }]}
        onPress={() => openEventModal()}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* View Mode Menu Modal */}
      <Modal visible={viewMenuVisible} animationType="fade" transparent={true}>
        <TouchableOpacity
          style={styles.viewMenuOverlay}
          activeOpacity={1}
          onPress={() => setViewMenuVisible(false)}
        >
          <View style={[styles.viewMenu, { backgroundColor: isDark ? '#3D3D3D' : '#F5F5F5' }]}>
            <TouchableOpacity
              style={[
                styles.viewMenuItem,
                viewMode === 'month' && { backgroundColor: isDark ? 'rgba(233, 78, 27, 0.3)' : 'rgba(233, 78, 27, 0.15)' }
              ]}
              onPress={() => changeViewMode('month')}
            >
              <MaterialCommunityIcons
                name="calendar-month"
                size={24}
                color={viewMode === 'month' ? CALENDAR_COLORS.primary : colors.text}
              />
              <Text style={[
                styles.viewMenuItemText,
                { color: viewMode === 'month' ? CALENDAR_COLORS.primary : colors.text }
              ]}>
                Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewMenuItem,
                viewMode === 'week' && { backgroundColor: isDark ? 'rgba(233, 78, 27, 0.3)' : 'rgba(233, 78, 27, 0.15)' }
              ]}
              onPress={() => changeViewMode('week')}
            >
              <MaterialCommunityIcons
                name="calendar-week"
                size={24}
                color={viewMode === 'week' ? CALENDAR_COLORS.primary : colors.text}
              />
              <Text style={[
                styles.viewMenuItemText,
                { color: viewMode === 'week' ? CALENDAR_COLORS.primary : colors.text }
              ]}>
                Week
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewMenuItem,
                viewMode === '3day' && { backgroundColor: isDark ? 'rgba(233, 78, 27, 0.3)' : 'rgba(233, 78, 27, 0.15)' }
              ]}
              onPress={() => changeViewMode('3day')}
            >
              <MaterialCommunityIcons
                name="calendar-range"
                size={24}
                color={viewMode === '3day' ? CALENDAR_COLORS.primary : colors.text}
              />
              <Text style={[
                styles.viewMenuItemText,
                { color: viewMode === '3day' ? CALENDAR_COLORS.primary : colors.text }
              ]}>
                3 Days
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewMenuItem,
                viewMode === 'day' && { backgroundColor: isDark ? 'rgba(233, 78, 27, 0.3)' : 'rgba(233, 78, 27, 0.15)' }
              ]}
              onPress={() => changeViewMode('day')}
            >
              <MaterialCommunityIcons
                name="calendar-today"
                size={24}
                color={viewMode === 'day' ? CALENDAR_COLORS.primary : colors.text}
              />
              <Text style={[
                styles.viewMenuItemText,
                { color: viewMode === 'day' ? CALENDAR_COLORS.primary : colors.text }
              ]}>
                Day
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewMenuItem,
                viewMode === 'schedule' && { backgroundColor: isDark ? 'rgba(233, 78, 27, 0.3)' : 'rgba(233, 78, 27, 0.15)' }
              ]}
              onPress={() => changeViewMode('schedule')}
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={24}
                color={viewMode === 'schedule' ? CALENDAR_COLORS.primary : colors.text}
              />
              <Text style={[
                styles.viewMenuItemText,
                { color: viewMode === 'schedule' ? CALENDAR_COLORS.primary : colors.text }
              ]}>
                Schedule
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.viewMenuDivider, { backgroundColor: colors.border }]} />

            {/* Include Workouts Toggle */}
            <View style={[styles.viewMenuItem, styles.workoutToggleItem]}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={24}
                color={includeWorkouts ? CALENDAR_COLORS.primary : colors.text}
              />
              <Text style={[
                styles.viewMenuItemText,
                { color: includeWorkouts ? CALENDAR_COLORS.primary : colors.text, flex: 1 }
              ]}>
                Include Workouts
              </Text>
              <Switch
                value={includeWorkouts}
                onValueChange={toggleIncludeWorkouts}
                trackColor={{ false: colors.border, true: CALENDAR_COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Event Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#3D3D3D' : '#F5F5F5' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Event</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA',
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                placeholder="Add title"
                value={newEvent.title || ''}
                onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.sectionLabel, { color: colors.text }]}>Color</Text>
              <View style={styles.colorRow}>
                {EVENT_COLORS.map((eventColor) => (
                  <TouchableOpacity
                    key={eventColor.id}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: eventColor.color },
                      newEvent.color === eventColor.color && styles.colorCircleSelected,
                    ]}
                    onPress={() => setNewEvent({ ...newEvent, color: eventColor.color })}
                  >
                    {newEvent.color === eventColor.color && (
                      <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.allDayRow, {
                backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA',
                borderColor: colors.border,
              }]}>
                <Text style={[styles.allDayText, { color: colors.text }]}>All-day event</Text>
                <Switch
                  value={newEvent.allDay || false}
                  onValueChange={(value) => setNewEvent({ ...newEvent, allDay: value })}
                  trackColor={{ false: '#767577', true: CALENDAR_COLORS.primary + '80' }}
                  thumbColor={newEvent.allDay ? CALENDAR_COLORS.primary : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                />
              </View>

              <TouchableOpacity
                style={[styles.timeButton, {
                  backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA',
                  borderColor: colors.border,
                }]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color={CALENDAR_COLORS.primary} />
                <Text style={[styles.timeButtonText, { color: colors.text }]}>
                  {format(newEvent.startTime || new Date(), 'EEE, MMM d · h:mm a')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timeButton, {
                  backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA',
                  borderColor: colors.border,
                }]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color={CALENDAR_COLORS.primary} />
                <Text style={[styles.timeButtonText, { color: colors.text }]}>
                  {format(newEvent.endTime || new Date(), 'EEE, MMM d · h:mm a')}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.input, {
                  backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA',
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                placeholder="Add location"
                value={newEvent.location || ''}
                onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                style={[styles.input, styles.textArea, {
                  backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA',
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                placeholder="Add description"
                value={newEvent.description || ''}
                onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: BRAND_COLORS.accent }]}
                onPress={saveEvent}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showStartTimePicker && (
        <DateTimePicker
          value={newEvent.startTime || new Date()}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowStartTimePicker(false);
            if (date) setNewEvent({ ...newEvent, startTime: date });
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={newEvent.endTime || new Date()}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowEndTimePicker(false);
            if (date) setNewEvent({ ...newEvent, endTime: date });
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hamburgerButton: {
    padding: 8,
    marginRight: 8,
  },
  syncButton: {
    padding: 8,
    marginRight: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  navButton: {
    padding: 4,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthView: {
    paddingHorizontal: 2,
    paddingTop: 2,
    flex: 1,
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2, // Minimal gap for maximum width
  },
  monthDayCell: {
    width: (width - 4) / 7 - 2, // Maximum possible width
    height: 110, // Taller cells
  },
  dayContainer: {
    flex: 1,
    borderRadius: 4,
    padding: 8,
    paddingTop: 4,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  dayNumberWrapper: {
    alignSelf: 'center',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  monthDayNumber: {
    fontSize: 14,
    fontWeight: '400',
  },
  eventBars: {
    gap: 2,
    marginTop: 4,
    marginHorizontal: -8, // Extend to edges by offsetting parent padding
  },
  monthEventBar: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0, // No border radius for full-width bars
    marginBottom: 2,
  },
  monthEventText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  moreEvents: {
    fontSize: 9,
    marginTop: 2,
  },
  // Week View Styles
  weekView: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  weekTimeColumn: {
    width: 60,
  },
  weekDaysRow: {
    flex: 1,
    flexDirection: 'row',
  },
  weekDayHeader: {
    width: (width - 80) / 7, // Fit all 7 days on screen
    padding: 6,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 2,
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  weekDayNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weekGridContainer: {
    flex: 1,
  },
  weekTimeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekTimeLabel: {
    width: 60,
    paddingRight: 8,
    paddingTop: 4,
  },
  weekTimeLabelText: {
    fontSize: 11,
    fontWeight: '500',
  },
  weekSlotsRow: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 4,
  },
  weekDaySlot: {
    width: (width - 80) / 7, // Match header width to show all 7 days
    marginHorizontal: 2,
  },
  weekEventBar: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  weekEventTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  weekEmptySlot: {
    height: 50,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'solid',
  },
  // 3-Day View Styles
  threeDayHeader: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  threeDaySlot: {
    flex: 1,
    marginHorizontal: 4,
  },
  dayView: {
    flex: 1,
  },
  dayViewHeader: {
    padding: 16,
    borderRadius: 4,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  dayViewTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  dayViewDate: {
    fontSize: 14,
    marginTop: 4,
  },
  timeSlotsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  timeSlotRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  timeLabel: {
    width: 60,
    paddingRight: 12,
  },
  timeLabelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventBarContainer: {
    flex: 1,
  },
  eventBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  eventBarTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventBarTime: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.9,
  },
  emptyEventBar: {
    height: 50,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'solid',
  },
  scheduleView: {
    flex: 1,
    padding: 8,
  },
  scheduleDay: {
    marginBottom: 20,
  },
  scheduleDateHeader: {
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  scheduleDateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleDateSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  scheduleEventCard: {
    flexDirection: 'row',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  scheduleEmptyBar: {
    flexDirection: 'row',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'solid',
  },
  scheduleEventColor: {
    width: 4,
  },
  scheduleEventContent: {
    flex: 1,
    padding: 12,
  },
  scheduleEventTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
  },
  scheduleEventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  scheduleEventTimeText: {
    fontSize: 13,
  },
  scheduleEventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleEventLocationText: {
    fontSize: 13,
  },
  scheduleEmptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  viewMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingLeft: 16,
  },
  viewMenu: {
    width: 200,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  viewMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 4,
    gap: 12,
  },
  viewMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  viewMenuDivider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  workoutToggleItem: {
    paddingRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 24,
    maxHeight: height * 0.90,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '400',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    borderWidth: 0,
    borderRadius: 6,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowOpacity: 0.3,
  },
  allDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  allDayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  timeButtonText: {
    fontSize: 15,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // All-day events styles (Week view)
  allDaySection: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  allDayLabel: {
    width: 60,
    paddingRight: 8,
    paddingTop: 4,
  },
  allDayLabelText: {
    fontSize: 11,
    fontWeight: '500',
  },
  allDaySlotsRow: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 4,
  },
  allDayEventBar: {
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  allDayEventTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  allDayEmptySlot: {
    height: 28,
  },
  // All-day events styles (Day view)
  dayAllDaySection: {
    padding: 16,
    borderRadius: 4,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  dayAllDayLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  dayAllDayEventBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    marginBottom: 6,
  },
  dayAllDayEventTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CalendarScreenNew;
