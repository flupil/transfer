import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Animated,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getFriends,
  sendNudge,
  getFriendStreaks,
  updateFriendStreak,
  Friend,
  FriendStreak,
} from '../services/friendStreakService';
import { useLanguage } from '../contexts/LanguageContext';
import { BRAND_COLORS } from '../constants/brandColors';

interface FriendStreakCardProps {
  onClose?: () => void;
  visible: boolean;
}

const FriendStreakCard: React.FC<FriendStreakCardProps> = ({ onClose, visible }) => {
  const { t } = useLanguage();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [streaks, setStreaks] = useState<FriendStreak[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      loadFriendData();
      startAnimation();
    }
  }, [visible]);

  const loadFriendData = async () => {
    const friendsList = await getFriends();
    const friendStreaks = await getFriendStreaks();
    setFriends(friendsList.slice(0, 5)); // Show top 5 friends
    setStreaks(friendStreaks);
  };

  const startAnimation = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleNudge = async (friend: Friend) => {
    const success = await sendNudge(friend.id);
    if (success) {
      Alert.alert(
        t('friends.nudgeSent'),
        t('friends.nudgeSentMessage', { name: friend.name }),
        [{ text: t('alert.ok'), style: 'default' }]
      );
    } else {
      Alert.alert(
        t('friends.noNudgesLeft'),
        t('friends.noNudgesMessage'),
        [{ text: t('alert.ok'), style: 'default' }]
      );
    }
  };

  const getStreakStatus = (friend: Friend) => {
    if (!friend.lastActivity) return 'inactive';
    const lastActivity = new Date(friend.lastActivity);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24) return 'active';
    if (hoursDiff < 48) return 'warning';
    return 'inactive';
  };

  const renderFriend = ({ item, index }: { item: Friend; index: number }) => {
    const status = getStreakStatus(item);
    const streak = streaks.find(s => s.friendId === item.id);
    const canNudge = streak && streak.nudgesLeft > 0 && status !== 'active';

    return (
      <Animated.View
        style={[
          styles.friendItem,
          {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.friendRank}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>

        <View style={styles.friendAvatar}>
          <Text style={styles.avatarEmoji}>{item.avatar || '👤'}</Text>
          {status === 'active' && (
            <View style={styles.activeIndicator} />
          )}
        </View>

        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <View style={styles.streakInfo}>
            <MaterialCommunityIcons name="fire" size={16} color={BRAND_COLORS.accent} />
            <Text style={styles.streakText}>{item.streak}</Text>
          </View>
        </View>

        {canNudge && (
          <TouchableOpacity
            style={styles.nudgeButton}
            onPress={() => handleNudge(item)}
          >
            <Text style={styles.nudgeText}>{t('friends.nudge')}</Text>
          </TouchableOpacity>
        )}

        {status === 'active' && (
          <View style={styles.activeButton}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#E94E1B" />
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.title}>{t('friends.friendStreaks')}</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Mascot Characters */}
            <View style={styles.mascotContainer}>
              <View style={styles.mascot}>
                <Text style={styles.mascotEmoji}>🦉</Text>
              </View>
              <View style={styles.mascot}>
                <Text style={styles.mascotEmoji}>👤</Text>
              </View>
            </View>

            <Text style={styles.subtitle}>
              {t('friends.keepStreaksAlive')}
            </Text>
          </View>

          {/* Friend List */}
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Bottom Action */}
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <Text style={styles.continueText}>{t('button.continue')}</Text>
          </TouchableOpacity>

          {/* Streak Counter */}
          <View style={styles.streakCounter}>
            <Text style={styles.streakCounterText}>{t('friends.friendStreakCount', { count: friends[0]?.streak || 0 })}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FriendStreakCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9500',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 36,
  },
  mascotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: -10,
  },
  mascot: {
    width: 60,
    height: 60,
    backgroundColor: '#58CC02',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  mascotEmoji: {
    fontSize: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  friendRank: {
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E94E1B',
    borderWidth: 2,
    borderColor: 'white',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  nudgeButton: {
    backgroundColor: '#1CB0F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nudgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeButton: {
    padding: 8,
  },
  continueButton: {
    backgroundColor: '#1CB0F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  streakCounter: {
    alignItems: 'center',
    marginTop: 16,
  },
  streakCounterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
});