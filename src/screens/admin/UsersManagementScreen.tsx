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
  Avatar,
  FAB,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSafeDatabase } from '../../database/databaseHelper';
import { useAuth } from '../../contexts/AuthContext';

const UsersManagementScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    height: '',
    weight: '',
    isActive: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter]);

  const loadUsers = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      setLoading(true);
      const result = await db.getAllAsync(
        'SELECT * FROM users ORDER BY createdAt DESC'
      );

      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      height: '',
      weight: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      height: user.height?.toString() || '',
      weight: user.weight?.toString() || '',
      isActive: user.isActive === 1,
    });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      if (!formData.name || !formData.email) {
        Alert.alert('Error', 'Name and email are required');
        return;
      }

      if (editingUser) {
        // Update existing user
        await db.runAsync(
          `UPDATE users SET
           name = ?, email = ?, role = ?, height = ?, weight = ?, isActive = ?
           WHERE id = ?`,
          [
            formData.name,
            formData.email,
            formData.role,
            formData.height ? parseFloat(formData.height) : null,
            formData.weight ? parseFloat(formData.weight) : null,
            formData.isActive ? 1 : 0,
            editingUser.id,
          ]
        );
      } else {
        // Create new user
        const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.runAsync(
          `INSERT INTO users (id, name, email, role, height, weight, isActive, gymId, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [
            id,
            formData.name,
            formData.email,
            formData.role,
            formData.height ? parseFloat(formData.height) : null,
            formData.weight ? parseFloat(formData.weight) : null,
            formData.isActive ? 1 : 0,
            currentUser?.gymId || 'demo_gym',
          ]
        );
      }

      setShowModal(false);
      loadUsers();
      Alert.alert('Success', editingUser ? 'User updated successfully' : 'User created successfully');
    } catch (error) {
      console.error('Failed to save user:', error);
      Alert.alert('Error', 'Failed to save user');
    }
  };

  const handleDeleteUser = (user: any) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getSafeDatabase();
              if (!db) return;

              await db.runAsync('DELETE FROM users WHERE id = ?', [user.id]);
              loadUsers();
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Failed to delete user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const toggleUserStatus = async (user: any) => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const newStatus = user.isActive === 1 ? 0 : 1;
      await db.runAsync(
        'UPDATE users SET isActive = ? WHERE id = ?',
        [newStatus, user.id]
      );

      loadUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const exportUsers = async () => {
    try {
      // In a real app, this would export to CSV
      Alert.alert('Export', 'Export functionality would be implemented here');
    } catch (error) {
      console.error('Failed to export users:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#F44336';
      case 'coach': return '#E94E1B';
      case 'user': return '#E94E1B';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.filters}>
          <SegmentedButtons
            value={roleFilter}
            onValueChange={setRoleFilter}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'user', label: 'Users' },
              { value: 'coach', label: 'Coaches' },
              { value: 'admin', label: 'Admins' },
            ]}
            style={styles.roleFilter}
          />
        </View>
        <View style={styles.actions}>
          <Button mode="outlined" onPress={exportUsers} style={styles.exportBtn}>
            Export CSV
          </Button>
        </View>
      </View>

      <ScrollView style={styles.usersList}>
        {filteredUsers.map((user) => (
          <Card key={user.id} style={styles.userCard}>
            <List.Item
              title={user.name}
              description={user.email}
              left={() => (
                <Avatar.Text
                  size={50}
                  label={user.name?.charAt(0) || 'U'}
                  style={{ backgroundColor: getRoleColor(user.role) }}
                />
              )}
              right={() => (
                <View style={styles.userActions}>
                  <Chip
                    mode="outlined"
                    textStyle={{ fontSize: 12 }}
                    style={[styles.roleChip, { borderColor: getRoleColor(user.role) }]}
                  >
                    {user.role}
                  </Chip>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => toggleUserStatus(user)}
                      style={[
                        styles.statusButton,
                        { backgroundColor: user.isActive === 1 ? '#E94E1B' : '#F44336' }
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={user.isActive === 1 ? 'check' : 'close'}
                        size={16}
                        color="white"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleEditUser(user)}
                      style={styles.editButton}
                    >
                      <MaterialCommunityIcons name="pencil" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteUser(user)}
                      style={styles.deleteButton}
                    >
                      <MaterialCommunityIcons name="delete" size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </Card>
        ))}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateUser}
      />

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>
            {editingUser ? 'Edit User' : 'Create User'}
          </Text>

          <TextInput
            label="Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            style={styles.input}
          />

          <SegmentedButtons
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
            buttons={[
              { value: 'user', label: 'User' },
              { value: 'coach', label: 'Coach' },
              { value: 'admin', label: 'Admin' },
            ]}
            style={styles.input}
          />

          <TextInput
            label="Height (cm)"
            value={formData.height}
            onChangeText={(text) => setFormData({ ...formData, height: text })}
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Weight (kg)"
            value={formData.weight}
            onChangeText={(text) => setFormData({ ...formData, weight: text })}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSaveUser}>
              {editingUser ? 'Update' : 'Create'}
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
    marginBottom: 16,
  },
  filters: {
    marginBottom: 16,
  },
  roleFilter: {
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  exportBtn: {
    marginLeft: 8,
  },
  usersList: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    marginBottom: 8,
  },
  userActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
  },
  roleChip: {
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  statusButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16,
  },
});

export default UsersManagementScreen;