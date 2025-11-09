import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getExerciseFromDB } from '../services/exerciseDBService';

const { width, height } = Dimensions.get('window');

interface ExerciseVideoModalProps {
  visible: boolean;
  exerciseName: string;
  onClose: () => void;
}

const ExerciseVideoModal: React.FC<ExerciseVideoModalProps> = ({
  visible,
  exerciseName,
  onClose,
}) => {
  const [exerciseData, setExerciseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gifLoading, setGifLoading] = useState(true);

  useEffect(() => {
    if (visible && exerciseName) {
      loadExerciseData();
    }
  }, [visible, exerciseName]);

  const loadExerciseData = async () => {
    setLoading(true);
    setGifLoading(true);
    try {
      const data = await getExerciseFromDB(exerciseName);
      setExerciseData(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load exercise information. Please try again.');
      console.error('Failed to load exercise data:', error);
    } finally {
      setLoading(false);
    }
  };


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'expert': return '#F44336';
      default: return '#2196F3';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{exerciseName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Loading exercise info...</Text>
            </View>
          ) : exerciseData ? (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="arm-flex" size={20} color="#FF6B35" />
                    <Text style={styles.infoLabel}>Target</Text>
                    <Text style={styles.infoValue}>{exerciseData.muscle}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="dumbbell" size={20} color="#FF6B35" />
                    <Text style={styles.infoLabel}>Equipment</Text>
                    <Text style={styles.infoValue}>{exerciseData.equipment}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="human" size={20} color="#FF6B35" />
                    <Text style={styles.infoLabel}>Body Part</Text>
                    <Text style={styles.infoValue}>{exerciseData.bodyPart || exerciseData.muscle}</Text>
                  </View>
                </View>
              </View>

              {/* Exercise GIF Animation */}
              <View style={styles.gifSection}>
                {exerciseData?.gifUrl ? (
                  <>
                    {gifLoading && (
                      <View style={styles.gifLoadingOverlay}>
                        <ActivityIndicator size="large" color="#FF6B35" />
                        <Text style={styles.loadingText}>Loading GIF...</Text>
                      </View>
                    )}
                    <Image
                      source={{
                        uri: exerciseData.gifUrl,
                        cache: 'force-cache'
                      }}
                      style={styles.exerciseGif}
                      resizeMode="contain"
                      defaultSource={{ uri: exerciseData.gifUrl }}
                      onLoadEnd={() => setGifLoading(false)}
                      onError={() => setGifLoading(false)}
                    />
                  </>
                ) : (
                  <View style={styles.exercisePlaceholder}>
                    <MaterialCommunityIcons name="dumbbell" size={60} color="#FF6B35" />
                    <Text style={styles.exerciseName}>{exerciseData?.name || exerciseName}</Text>
                    <Text style={styles.placeholderText}>No GIF URL available</Text>
                  </View>
                )}
              </View>

              {exerciseData?.secondaryMuscles && exerciseData.secondaryMuscles.length > 0 && (
                <View style={styles.secondaryMusclesSection}>
                  <Text style={styles.sectionTitle}>Secondary Muscles</Text>
                  <View style={styles.musclesList}>
                    {exerciseData.secondaryMuscles.map((muscle: string, index: number) => (
                      <View key={index} style={styles.muscleTag}>
                        <Text style={styles.muscleTagText}>{muscle}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.instructions}>{exerciseData.instructions}</Text>
              </View>

              <View style={styles.tipsSection}>
                <Text style={styles.sectionTitle}>Tips</Text>
                <View style={styles.tip}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                  <Text style={styles.tipText}>Focus on proper form over heavy weight</Text>
                </View>
                <View style={styles.tip}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                  <Text style={styles.tipText}>Control the movement in both directions</Text>
                </View>
                <View style={styles.tip}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                  <Text style={styles.tipText}>Breathe properly throughout the exercise</Text>
                </View>
                <View style={styles.tip}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color="#FF9800" />
                  <Text style={styles.tipText}>Stop if you feel pain or discomfort</Text>
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Loading exercise information...</Text>

              {/* Show placeholder for exercise */}
              <View style={styles.gifSection}>
                <View style={styles.exercisePlaceholder}>
                  <MaterialCommunityIcons name="dumbbell" size={60} color="#FF6B35" />
                  <Text style={styles.exerciseName}>{exerciseName}</Text>
                  <Text style={styles.placeholderText}>Exercise demonstration coming soon</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  infoSection: {
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  videoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsSection: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructions: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
  },
  tipsSection: {
    marginTop: 25,
    marginBottom: 20,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    color: '#666',
    fontSize: 16,
  },
  gifSection: {
    marginTop: 20,
    position: 'relative',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  exerciseGif: {
    width: '100%',
    height: 300,
    backgroundColor: '#f8f8f8',
  },
  gifLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    zIndex: 1,
  },
  noVideoSection: {
    marginTop: 20,
    padding: 40,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  exercisePlaceholder: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    textTransform: 'capitalize',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  secondaryMusclesSection: {
    marginTop: 20,
  },
  musclesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleTag: {
    backgroundColor: '#FFE5D9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  muscleTagText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default ExerciseVideoModal;