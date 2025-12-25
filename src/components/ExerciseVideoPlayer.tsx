import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useLanguage } from '../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

interface ExerciseVideo {
  id: string;
  title: string;
  youtubeId?: string;
  vimeoId?: string;
  thumbnailUrl?: string;
  duration: string;
  difficulty: string;
  tips: string[];
}

interface ExerciseVideoPlayerProps {
  exercise: any;
  visible: boolean;
  onClose: () => void;
}

// Mock exercise video database - in production, this would come from an API
const exerciseVideoDB: { [key: string]: ExerciseVideo } = {
  'bench-press': {
    id: 'bench-press',
    title: 'Bench Press Form Guide',
    youtubeId: 'rT7DgCr-3pg',
    duration: '3:45',
    difficulty: 'Intermediate',
    tips: [
      'Keep feet flat on the floor',
      'Maintain natural arch in lower back',
      'Grip bar slightly wider than shoulder-width',
      'Lower bar to chest with control',
      'Press up explosively',
    ],
  },
  'squat': {
    id: 'squat',
    title: 'Perfect Squat Technique',
    youtubeId: 'ultWZbUMPL8',
    duration: '4:20',
    difficulty: 'Beginner',
    tips: [
      'Keep chest up and core tight',
      'Knees track over toes',
      'Hip crease below knee level',
      'Drive through heels',
      'Maintain neutral spine',
    ],
  },
  'deadlift': {
    id: 'deadlift',
    title: 'Deadlift Mastery',
    youtubeId: 'op9kVnSso6Q',
    duration: '5:10',
    difficulty: 'Advanced',
    tips: [
      'Start with bar over mid-foot',
      'Grip just outside legs',
      'Keep back straight, chest up',
      'Drive hips forward at top',
      'Control the descent',
    ],
  },
  'push-up': {
    id: 'push-up',
    title: 'Push-Up Variations',
    youtubeId: 'IODxDxX7oi4',
    duration: '2:30',
    difficulty: 'Beginner',
    tips: [
      'Keep body in straight line',
      'Hands shoulder-width apart',
      'Lower chest to floor',
      'Full arm extension at top',
      'Engage core throughout',
    ],
  },
  'pull-up': {
    id: 'pull-up',
    title: 'Pull-Up Progression',
    youtubeId: 'eGo4IYlbE5g',
    duration: '3:15',
    difficulty: 'Intermediate',
    tips: [
      'Start from dead hang',
      'Pull elbows down and back',
      'Chin over bar at top',
      'Control the negative',
      'Use assistance if needed',
    ],
  },
};

const ExerciseVideoPlayer: React.FC<ExerciseVideoPlayerProps> = ({
  exercise,
  visible,
  onClose,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [showTips, setShowTips] = useState(false);

  // Get video data based on exercise name (simplified matching)
  const getVideoData = (): ExerciseVideo | null => {
    const exerciseName = exercise?.name?.toLowerCase() || '';

    // Try to find matching video
    for (const key in exerciseVideoDB) {
      if (exerciseName.includes(key) || key.includes(exerciseName)) {
        return exerciseVideoDB[key];
      }
    }

    // Default fallback videos for common muscle groups
    if (exerciseName.includes('chest')) {
      return exerciseVideoDB['bench-press'];
    } else if (exerciseName.includes('leg') || exerciseName.includes('squat')) {
      return exerciseVideoDB['squat'];
    } else if (exerciseName.includes('back')) {
      return exerciseVideoDB['deadlift'];
    }

    return null;
  };

  const videoData = getVideoData();

  const openYouTube = () => {
    if (videoData?.youtubeId) {
      Linking.openURL(`https://www.youtube.com/watch?v=${videoData.youtubeId}`);
    }
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
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <View>
                <Text style={styles.exerciseName}>{exercise?.name}</Text>
                <Text style={styles.muscleGroup}>{exercise?.muscleGroup}</Text>
              </View>
            </View>
          </View>

          {videoData ? (
            <>
              {/* Video Player */}
              <View style={styles.videoContainer}>
                {videoData.youtubeId ? (
                  <>
                    <WebView
                      source={{
                        uri: `https://www.youtube.com/embed/${videoData.youtubeId}?rel=0&showinfo=0`,
                      }}
                      style={styles.webView}
                      onLoadStart={() => setLoading(true)}
                      onLoadEnd={() => setLoading(false)}
                      allowsFullscreenVideo
                      javaScriptEnabled
                      domStorageEnabled
                    />
                    {loading && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#FF6B35" />
                        <Text style={styles.loadingText}>{t('video.loadingVideo')}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.noVideoContainer}>
                    <MaterialCommunityIcons name="video-off" size={48} color="#999" />
                    <Text style={styles.noVideoText}>{t('video.notAvailable')}</Text>
                  </View>
                )}
              </View>

              {/* Video Info */}
              <View style={styles.videoInfo}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>{videoData.duration}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="gauge" size={20} color="#666" />
                    <Text style={styles.infoText}>{videoData.difficulty}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={openYouTube}
                  >
                    <MaterialCommunityIcons name="youtube" size={20} color="#FF0000" />
                    <Text style={[styles.infoText, { color: '#FF0000' }]}>
                      {t('video.openInYouTube')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Tips */}
              <TouchableOpacity
                style={styles.tipsButton}
                onPress={() => setShowTips(!showTips)}
              >
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={24}
                  color="#FF6B35"
                />
                <Text style={styles.tipsButtonText}>{t('video.formTips')}</Text>
                <MaterialCommunityIcons
                  name={showTips ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#FF6B35"
                />
              </TouchableOpacity>

              {showTips && (
                <ScrollView style={styles.tipsContainer}>
                  {videoData.tips.map((tip, index) => (
                    <View key={index} style={styles.tipRow}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color="#E94E1B"
                      />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.noVideoContainer}>
              <MaterialCommunityIcons name="video-off" size={64} color="#999" />
              <Text style={styles.noVideoTitle}>{t('video.noVideoAvailable')}</Text>
              <Text style={styles.noVideoSubtitle}>
                {t('video.comingSoon')}
              </Text>

              {/* Exercise Instructions Fallback */}
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>{t('video.generalTips')}</Text>
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="check" size={20} color="#FF6B35" />
                  <Text style={styles.tipText}>{t('video.tip1')}</Text>
                </View>
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="check" size={20} color="#FF6B35" />
                  <Text style={styles.tipText}>{t('video.tip2')}</Text>
                </View>
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="check" size={20} color="#FF6B35" />
                  <Text style={styles.tipText}>{t('video.tip3')}</Text>
                </View>
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="check" size={20} color="#FF6B35" />
                  <Text style={styles.tipText}>{t('video.tip4')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => {
                  Linking.openURL(
                    `https://www.youtube.com/results?search_query=${exercise?.name} form tutorial`
                  );
                }}
              >
                <MaterialCommunityIcons name="youtube" size={24} color="white" />
                <Text style={styles.searchButtonText}>{t('video.searchOnYouTube')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    marginRight: 16,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  muscleGroup: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  videoContainer: {
    height: height * 0.3,
    backgroundColor: 'black',
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noVideoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  noVideoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  noVideoText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  videoInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  tipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF5F0',
  },
  tipsButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 12,
  },
  tipsContainer: {
    maxHeight: 200,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExerciseVideoPlayer;