import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Searchbar,
  List,
  FAB,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  Chip,
  Menu,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSafeDatabase } from '../../database/databaseHelper';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const AnnouncementsScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'all',
    priority: 'normal',
    expiresAt: '',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      setLoading(true);
      const result = await db.getAllAsync(
        'SELECT * FROM announcements ORDER BY createdAt DESC'
      );

      setAnnouncements(result);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      message: '',
      audience: 'all',
      priority: 'normal',
      expiresAt: '',
    });
    setShowModal(true);
  };

  const handleEditAnnouncement = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || '',
      message: announcement.message || '',
      audience: announcement.audience || 'all',
      priority: announcement.priority || 'normal',
      expiresAt: announcement.expiresAt || '',
    });
    setShowModal(true);
  };

  const handleSaveAnnouncement = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      if (!formData.title || !formData.message) {
        Alert.alert('Error', 'Title and message are required');
        return;
      }

      const now = new Date().toISOString();

      if (editingAnnouncement) {
        // Update existing announcement
        await db.runAsync(
          `UPDATE announcements SET
           title = ?, message = ?, audience = ?, priority = ?, expiresAt = ?
           WHERE id = ?`,
          [
            formData.title,
            formData.message,
            formData.audience,
            formData.priority,
            formData.expiresAt || null,
            editingAnnouncement.id,
          ]
        );
      } else {
        // Create new announcement
        const id = `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.runAsync(
          `INSERT INTO announcements (id, authorId, authorRole, audience, title, message, priority, expiresAt, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            currentUser?.id || 'admin',
            currentUser?.role || 'admin',
            formData.audience,
            formData.title,
            formData.message,
            formData.priority,
            formData.expiresAt || null,
            now,
          ]
        );

        // Send push notification (simulate)
        await sendPushNotification(formData);
      }

      setShowModal(false);
      loadAnnouncements();
      Alert.alert('Success', editingAnnouncement ? 'Announcement updated successfully' : 'Announcement created and sent successfully');
    } catch (error) {
      console.error('Failed to save announcement:', error);
      Alert.alert('Error', 'Failed to save announcement');
    }
  };

  const sendPushNotification = async (announcement: any) => {
    try {
      // In a real app, this would integrate with FCM/APNs
      console.log('Sending push notification:', announcement);

      // Simulate notification service
      Alert.alert(
        'Push Notification Sent',
        `Notification sent to ${announcement.audience} users: "${announcement.title}"`
      );
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  };

  const handleDeleteAnnouncement = (announcement: any) => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${announcement.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getSafeDatabase();
              if (!db) return;

              await db.runAsync('DELETE FROM announcements WHERE id = ?', [announcement.id]);
              loadAnnouncements();
              Alert.alert('Success', 'Announcement deleted successfully');
            } catch (error) {
              console.error('Failed to delete announcement:', error);
              Alert.alert('Error', 'Failed to delete announcement');
            }
          },
        },
      ]
    );
  };

  const handleResendNotification = async (announcement: any) => {
    await sendPushNotification(announcement);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#E94E1B';
      case 'low': return '#E94E1B';
      default: return '#9E9E9E';
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all': return 'account-group';
      case 'users': return 'account-multiple';
      case 'coaches': return 'account-tie';
      case 'admins': return 'shield-account';
      default: return 'account-group';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search announcements..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <ScrollView style={styles.announcementsList}>
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement.id} style={styles.announcementCard}>
            <Card.Content>
              <View style={styles.announcementHeader}>
                <View style={styles.titleRow}>
                  <Text variant="titleMedium" style={styles.title}>
                    {announcement.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setMenuVisible(menuVisible === announcement.id ? null : announcement.id)}
                  >
                    <MaterialCommunityIcons name="dots-vertical" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.metadata}>
                  <Chip
                    mode="outlined"
                    icon={getAudienceIcon(announcement.audience)}
                    textStyle={{ fontSize: 12 }}
                    style={styles.chip}
                  >
                    {announcement.audience}
                  </Chip>
                  <Chip
                    mode="outlined"
                    textStyle={{ fontSize: 12 }}
                    style={[styles.chip, { borderColor: getPriorityColor(announcement.priority) }]}
                  >
                    {announcement.priority}
                  </Chip>
                </View>
              </View>

              <Text variant="bodyMedium" style={styles.message}>
                {announcement.message}
              </Text>

              <Divider style={styles.divider} />

              <View style={styles.footer}>
                <Text variant="bodySmall" style={styles.dateText}>
                  {format(new Date(announcement.createdAt), 'MMM dd, yyyy h:mm a')}
                </Text>
                {announcement.expiresAt && (
                  <Text variant="bodySmall" style={styles.expiryText}>
                    Expires: {format(new Date(announcement.expiresAt), 'MMM dd, yyyy')}
                  </Text>
                )}
              </View>

              {menuVisible === announcement.id && (
                <View style={styles.actionMenu}>
                  <Button
                    mode="text"
                    icon="send"
                    onPress={() => {
                      handleResendNotification(announcement);
                      setMenuVisible(null);
                    }}
                  >
                    Resend
                  </Button>
                  <Button
                    mode="text"
                    icon="pencil"
                    onPress={() => {
                      handleEditAnnouncement(announcement);
                      setMenuVisible(null);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    mode="text"
                    icon="delete"
                    textColor="#F44336"
                    onPress={() => {
                      handleDeleteAnnouncement(announcement);
                      setMenuVisible(null);
                    }}
                  >
                    Delete
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        ))}

        {filteredAnnouncements.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bullhorn" size={80} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyText}>
              No announcements found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Create your first announcement to communicate with users
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateAnnouncement}
      />

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>
            {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
          </Text>

          <TextInput
            label="Title"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            style={styles.input}
          />

          <TextInput
            label="Message"
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <Text variant="labelMedium" style={styles.sectionLabel}>Audience</Text>
          <SegmentedButtons
            value={formData.audience}
            onValueChange={(value) => setFormData({ ...formData, audience: value })}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'users', label: 'Users' },
              { value: 'coaches', label: 'Coaches' },
              { value: 'admins', label: 'Admins' },
            ]}
            style={styles.input}
          />

          <Text variant="labelMedium" style={styles.sectionLabel}>Priority</Text>
          <SegmentedButtons
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
            buttons={[
              { value: 'low', label: 'Low' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' },
            ]}
            style={styles.input}
          />

          <TextInput
            label="Expires At (optional)"
            value={formData.expiresAt}
            onChangeText={(text) => setFormData({ ...formData, expiresAt: text })}
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSaveAnnouncement}>
              {editingAnnouncement ? 'Update' : 'Create & Send'}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  searchBar: {
    marginBottom: 8,
  },
  announcementsList: {
    flex: 1,
    padding: 16,
  },
  announcementCard: {
    marginBottom: 12,
  },
  announcementHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
  metadata: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 28,
  },
  message: {
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: '#666',
  },
  expiryText: {
    color: '#E94E1B',
  },
  actionMenu: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16,
  },
});

export default AnnouncementsScreen;