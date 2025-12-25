import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import {
  Card,
  Button,
  Switch,
  List,
  Badge,
  Divider,
  Menu,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getSafeDatabase } from '../database/databaseHelper';
import { Announcement, NotificationPreferences } from '../types';

interface NotificationItem extends Announcement {
  isRead: boolean;
  timeAgo: string;
}

const NotificationsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<NotificationItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    workoutReminders: true,
    mealReminders: true,
    announcements: true,
    progressUpdates: true,
    reminderTime: '08:00',
  });
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    loadNotificationSettings();
  }, []);

  const loadNotifications = async () => {
    if (!user) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      // Load announcements
      const announcementsData = await db.getAllAsync(
        `SELECT * FROM announcements
         WHERE (audience = 'all' OR audience = ? OR
                (audience = 'specific' AND specificUserIds LIKE '%' || ? || '%'))
         AND (expiresAt IS NULL OR datetime(expiresAt) > datetime('now'))
         ORDER BY priority DESC, createdAt DESC`,
        [user.role, user.id]
      ) as any[];

      const processedAnnouncements: NotificationItem[] = announcementsData.map(announcement => {
        const readBy = announcement.readBy ? JSON.parse(announcement.readBy) : [];
        const isRead = readBy.includes(user.id);
        const createdAt = new Date(announcement.createdAt);

        return {
          ...announcement,
          createdAt,
          expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : undefined,
          readBy,
          isRead,
          timeAgo: getTimeAgo(createdAt),
        };
      });

      setAnnouncements(processedAnnouncements);
      setUnreadCount(processedAnnouncements.filter(a => !a.isRead).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadNotificationSettings = async () => {
    if (!user) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      const userData = await db.getFirstAsync(
        'SELECT notificationPreferences FROM users WHERE id = ?',
        [user.id]
      ) as any;

      if (userData?.notificationPreferences) {
        const preferences = JSON.parse(userData.notificationPreferences);
        setNotifications(preferences);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const updateNotificationSetting = async (key: keyof NotificationPreferences, value: any) => {
    if (!user) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      const updatedNotifications = { ...notifications, [key]: value };
      setNotifications(updatedNotifications);

      await db.runAsync(
        'UPDATE users SET notificationPreferences = ? WHERE id = ?',
        [JSON.stringify(updatedNotifications), user.id]
      );
    } catch (error) {
      console.error('Failed to update notification setting:', error);
      Alert.alert(t('alert.error'), t('notifications.updateFailed'));
    }
  };

  const markAsRead = async (announcementId: string) => {
    if (!user) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      const announcement = announcements.find(a => a.id === announcementId);
      if (!announcement || announcement.isRead) return;

      const updatedReadBy = [...(announcement.readBy || []), user.id];

      await db.runAsync(
        'UPDATE announcements SET readBy = ? WHERE id = ?',
        [JSON.stringify(updatedReadBy), announcementId]
      );

      // Update local state
      setAnnouncements(prev =>
        prev.map(a =>
          a.id === announcementId
            ? { ...a, isRead: true, readBy: updatedReadBy }
            : a
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadAnnouncements = announcements.filter(a => !a.isRead);
    if (unreadAnnouncements.length === 0) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      for (const announcement of unreadAnnouncements) {
        const updatedReadBy = [...(announcement.readBy || []), user.id];
        await db.runAsync(
          'UPDATE announcements SET readBy = ? WHERE id = ?',
          [JSON.stringify(updatedReadBy), announcement.id]
        );
      }

      // Update local state
      setAnnouncements(prev =>
        prev.map(a => ({ ...a, isRead: true, readBy: [...(a.readBy || []), user.id] }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Alert.alert(t('alert.error'), t('notifications.markReadFailed'));
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadNotifications();
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return t('notifications.yesterday');
    } else {
      const days = differenceInDays(new Date(), date);
      if (days < 7) {
        return t('notifications.daysAgo', { days });
      } else {
        return format(date, 'MMM d');
      }
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'alert-circle';
      case 'normal':
        return 'information';
      case 'low':
        return 'minus-circle';
      default:
        return 'information';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#F44336';
      case 'normal':
        return '#3B82F6';
      case 'low':
        return '#757575';
      default:
        return '#3B82F6';
    }
  };

  const getFilteredAnnouncements = () => {
    switch (selectedFilter) {
      case 'unread':
        return announcements.filter(a => !a.isRead);
      case 'high':
        return announcements.filter(a => a.priority === 'high');
      default:
        return announcements;
    }
  };

  const renderAnnouncementItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      onPress={() => {
        if (!item.isRead) {
          markAsRead(item.id);
        }
      }}
    >
      <Card style={[styles.announcementCard, !item.isRead && styles.unreadCard]}>
        <Card.Content>
          <View style={styles.announcementHeader}>
            <View style={styles.priorityContainer}>
              <MaterialCommunityIcons
                name={getPriorityIcon(item.priority)}
                size={20}
                color={getPriorityColor(item.priority)}
              />
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeAgo}>{item.timeAgo}</Text>
              {!item.isRead && <Badge size={8} style={styles.unreadBadge} />}
            </View>
          </View>

          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementMessage}>{item.message}</Text>

          <View style={styles.announcementFooter}>
            <View style={styles.authorContainer}>
              <MaterialCommunityIcons
                name={item.authorRole === 'admin' ? 'shield-account' : 'account'}
                size={16}
                color="#666"
              />
              <Text style={styles.authorText}>
                {item.authorRole === 'admin' ? t('notifications.admin') : t('notifications.coach')}
              </Text>
            </View>

            <View style={styles.audienceContainer}>
              <Chip
                style={styles.audienceChip}
                textStyle={styles.audienceChipText}
                compact
              >
                {item.audience === 'all' ? t('notifications.everyone') : item.audience}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="bell-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyStateTitle}>{t('notifications.noNotifications')}</Text>
      <Text style={styles.emptyStateText}>
        {t('notifications.allCaughtUp')}
      </Text>
    </View>
  );

  const filteredAnnouncements = getFilteredAnnouncements();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#FF6B35']}
          tintColor="#FF6B35"
          progressBackgroundColor="#FFFFFF"
        />
      }
    >
      {/* Header with Actions */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <Badge style={styles.unreadCountBadge}>{unreadCount}</Badge>
          )}
        </View>

        <View style={styles.headerActions}>
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setFilterMenuVisible(true)}
              >
                <MaterialCommunityIcons name="filter" size={20} color="#666" />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setSelectedFilter('all');
                setFilterMenuVisible(false);
              }}
              title={t('notifications.filterAll')}
              leadingIcon={selectedFilter === 'all' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSelectedFilter('unread');
                setFilterMenuVisible(false);
              }}
              title={t('notifications.filterUnread')}
              leadingIcon={selectedFilter === 'unread' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSelectedFilter('high');
                setFilterMenuVisible(false);
              }}
              title={t('notifications.filterHighPriority')}
              leadingIcon={selectedFilter === 'high' ? 'check' : undefined}
            />
          </Menu>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <MaterialCommunityIcons name="check-all" size={20} color="#E94E1B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notification Settings */}
      <Card style={styles.settingsCard}>
        <Card.Title
          title={t('notifications.settings')}
          left={(props) => <MaterialCommunityIcons {...props} name="cog" size={24} />}
        />
        <Card.Content>
          <List.Item
            title={t('notifications.workoutReminders')}
            description={t('notifications.workoutRemindersDesc')}
            left={(props) => <List.Icon {...props} icon="dumbbell" />}
            right={() => (
              <Switch
                value={notifications.workoutReminders}
                onValueChange={(value) => updateNotificationSetting('workoutReminders', value)}
              />
            )}
          />
          <Divider />
          <List.Item
            title={t('notifications.mealReminders')}
            description={t('notifications.mealRemindersDesc')}
            left={(props) => <List.Icon {...props} icon="food-apple" />}
            right={() => (
              <Switch
                value={notifications.mealReminders}
                onValueChange={(value) => updateNotificationSetting('mealReminders', value)}
              />
            )}
          />
          <Divider />
          <List.Item
            title={t('notifications.announcements')}
            description={t('notifications.announcementsDesc')}
            left={(props) => <List.Icon {...props} icon="bullhorn" />}
            right={() => (
              <Switch
                value={notifications.announcements}
                onValueChange={(value) => updateNotificationSetting('announcements', value)}
              />
            )}
          />
          <Divider />
          <List.Item
            title={t('notifications.progressUpdates')}
            description={t('notifications.progressUpdatesDesc')}
            left={(props) => <List.Icon {...props} icon="chart-line" />}
            right={() => (
              <Switch
                value={notifications.progressUpdates}
                onValueChange={(value) => updateNotificationSetting('progressUpdates', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Announcements List */}
      <Card style={styles.announcementsCard}>
        <Card.Title
          title={t('notifications.recentAnnouncements', { count: filteredAnnouncements.length })}
          left={(props) => <MaterialCommunityIcons {...props} name="bullhorn" size={24} />}
        />
        <Card.Content style={styles.announcementsContent}>
          {filteredAnnouncements.length > 0 ? (
            <FlatList
              data={filteredAnnouncements}
              renderItem={renderAnnouncementItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            renderEmptyState()
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  unreadCountBadge: {
    backgroundColor: '#F44336',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  markAllButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
  },
  settingsCard: {
    margin: 10,
    elevation: 2,
  },
  announcementsCard: {
    margin: 10,
    elevation: 2,
  },
  announcementsContent: {
    paddingHorizontal: 0,
  },
  announcementCard: {
    marginVertical: 4,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#E94E1B',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#E94E1B',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  announcementMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  audienceContainer: {
    alignItems: 'flex-end',
  },
  audienceChip: {
    backgroundColor: '#E3F2FD',
    height: 24,
  },
  audienceChipText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export { NotificationsScreen };
export default NotificationsScreen;