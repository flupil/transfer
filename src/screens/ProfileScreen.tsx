import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Avatar, List, Button, Divider, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    Alert.alert(
      t('profile.signOut'),
      t('profile.signOutConfirm'),
      [
        { text: t('general.cancel'), style: 'cancel' },
        { text: t('profile.signOut'), onPress: () => signOut(), style: 'destructive' }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(t('profile.editProfile'), t('profile.editProfileComingSoon'));
  };

  const handleChangePassword = () => {
    Alert.alert(t('profile.changePassword'), t('profile.changePasswordComingSoon'));
  };

  const resetOnboarding = () => {
    Alert.alert(
      t('profile.resetOnboarding'),
      t('profile.resetOnboardingConfirm'),
      [
        { text: t('general.cancel'), style: 'cancel' },
        {
          text: t('general.reset'),
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(`onboarding_complete_${user?.id}`);
              Alert.alert(t('general.success'), t('profile.resetOnboardingSuccess'));
            } catch (error) {
              Alert.alert(t('general.error'), t('profile.resetOnboardingError'));
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={user?.name?.charAt(0) || 'U'}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.name || t('profile.user')}</Text>
        <Text style={styles.email}>{user?.email || t('profile.userEmail')}</Text>
        <View style={styles.roleContainer}>
          <Text style={styles.role}>{(user?.role || 'user').toUpperCase()}</Text>
        </View>
      </View>

      <Card style={[styles.quickActionsCard, { backgroundColor: '#FF6B35' }]}>
        <Card.Content>
          <TouchableOpacity
            style={styles.testOnboardingButton}
            onPress={() => navigation.navigate('TestOnboarding' as never)}
          >
            <MaterialCommunityIcons name="palette" size={28} color="#fff" />
            <Text style={styles.testOnboardingText}>{t('profile.testOnboarding')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      <Card style={styles.quickActionsCard}>
        <Card.Content>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Settings' as never)}
            >
              <MaterialCommunityIcons name="cog" size={24} color="#4CAF50" />
              <Text style={styles.quickActionText}>{t('general.settings')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Notifications' as never)}
            >
              <MaterialCommunityIcons name="bell" size={24} color="#FF9800" />
              <Text style={styles.quickActionText}>{t('profile.notifications')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Attendance' as never)}
            >
              <MaterialCommunityIcons name="calendar-check" size={24} color="#2196F3" />
              <Text style={styles.quickActionText}>{t('profile.attendance')}</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
          <List.Item
            title={t('profile.editProfile')}
            description={t('profile.editProfileDesc')}
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleEditProfile}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title={t('profile.changePassword')}
            description={t('profile.changePasswordDesc')}
            left={(props) => <List.Icon {...props} icon="lock-reset" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleChangePassword}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title={t('profile.testOnboarding')}
            description={t('profile.testOnboardingDesc')}
            left={(props) => <List.Icon {...props} icon="palette" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('TestOnboarding' as never)}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title={t('profile.resetOnboarding')}
            description={t('profile.resetOnboardingDesc')}
            left={(props) => <List.Icon {...props} icon="refresh" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={resetOnboarding}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{t('profile.activity')}</Text>
          <List.Item
            title={t('profile.workoutHistory')}
            description={t('profile.workoutHistoryDesc')}
            left={(props) => <List.Icon {...props} icon="history" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('PersonalRecords' as never)}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title={t('profile.personalRecords')}
            description={t('profile.personalRecordsDesc')}
            left={(props) => <List.Icon {...props} icon="trophy" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('PersonalRecords' as never)}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title={t('profile.monthlyReports')}
            description={t('profile.monthlyReportsDesc')}
            left={(props) => <List.Icon {...props} icon="chart-line" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('MonthlyReports' as never)}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{t('profile.stats')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>45</Text>
              <Text style={styles.statLabel}>{t('profile.workouts')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>{t('profile.streakDays')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3.2k</Text>
              <Text style={styles.statLabel}>{t('profile.caloriesBurned')}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('TestOnboarding' as never)}
        style={styles.testButton}
        buttonColor="#FF6B35"
        icon="palette"
      >
        {t('profile.testNewOnboarding')}
      </Button>

      <Button
        mode="contained"
        onPress={handleSignOut}
        style={styles.signOutButton}
        buttonColor="#F44336"
        icon="logout"
      >
        {t('profile.signOut')}
      </Button>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('profile.memberSince')}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
  },
  avatar: {
    backgroundColor: '#4CAF50',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  roleContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
  },
  role: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  quickActionsCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    backgroundColor: '#2C2C2C',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4CAF50',
  },
  listItem: {
    paddingVertical: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  testButton: {
    margin: 16,
    marginTop: 8,
    marginBottom: 0,
  },
  signOutButton: {
    margin: 16,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
  testOnboardingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  testOnboardingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
});

export default ProfileScreen;