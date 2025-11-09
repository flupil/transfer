import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import progressPhotosService, { ProgressPhoto } from '../../services/progressPhotosService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 60) / 3;

const ProgressPhotosScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | ProgressPhoto['type']>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<ProgressPhoto[]>([]);

  // Add photo form
  const [newPhotoUri, setNewPhotoUri] = useState<string>('');
  const [newPhotoType, setNewPhotoType] = useState<ProgressPhoto['type']>('front');
  const [newPhotoWeight, setNewPhotoWeight] = useState('');
  const [newPhotoNotes, setNewPhotoNotes] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadPhotos();
    }, [user?.id])
  );

  const loadPhotos = async () => {
    if (!user?.id) return;

    try {
      const allPhotos = await progressPhotosService.getPhotos(user.id);
      setPhotos(allPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to add photos.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewPhotoUri(result.assets[0].uri);
        setShowAddModal(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewPhotoUri(result.assets[0].uri);
        setShowAddModal(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSavePhoto = async () => {
    if (!newPhotoUri || !user?.id) return;

    try {
      await progressPhotosService.savePhoto({
        userId: user.id,
        uri: newPhotoUri,
        date: new Date(),
        type: newPhotoType,
        weight: newPhotoWeight ? parseFloat(newPhotoWeight) : undefined,
        notes: newPhotoNotes,
      });

      setShowAddModal(false);
      setNewPhotoUri('');
      setNewPhotoType('front');
      setNewPhotoWeight('');
      setNewPhotoNotes('');

      await loadPhotos();
      Alert.alert('Success', 'Progress photo saved!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await progressPhotosService.deletePhoto(user.id, photoId);
              await loadPhotos();
              setShowPhotoModal(false);
              setSelectedPhoto(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const handlePhotoPress = (photo: ProgressPhoto) => {
    if (compareMode) {
      if (selectedForCompare.find(p => p.id === photo.id)) {
        setSelectedForCompare(selectedForCompare.filter(p => p.id !== photo.id));
      } else if (selectedForCompare.length < 2) {
        setSelectedForCompare([...selectedForCompare, photo]);
      }
    } else {
      setSelectedPhoto(photo);
      setShowPhotoModal(true);
    }
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2) {
      // Navigate to comparison screen or show comparison modal
      Alert.alert(
        'Compare Photos',
        `Comparing photos from ${new Date(selectedForCompare[0].date).toLocaleDateString()} and ${new Date(selectedForCompare[1].date).toLocaleDateString()}`
      );
    }
  };

  const getFilteredPhotos = () => {
    if (selectedType === 'all') return photos;
    return photos.filter(p => p.type === selectedType);
  };

  const photoTypes: Array<'all' | ProgressPhoto['type']> = ['all', 'front', 'side', 'back', 'other'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A1A1A' : '#FAFBFD' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Progress Photos</Text>
        <TouchableOpacity onPress={() => {
          setCompareMode(!compareMode);
          setSelectedForCompare([]);
        }}>
          <MaterialCommunityIcons
            name={compareMode ? 'close' : 'compare'}
            size={24}
            color={compareMode ? '#FF6B35' : colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {photoTypes.map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              selectedType === type && styles.filterChipActive,
              { borderColor: selectedType === type ? '#FF6B35' : colors.textSecondary }
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={[
              styles.filterChipText,
              { color: selectedType === type ? '#FF6B35' : colors.textSecondary }
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Compare Mode Banner */}
      {compareMode && (
        <View style={styles.compareBanner}>
          <Text style={styles.compareBannerText}>
            Select 2 photos to compare ({selectedForCompare.length}/2)
          </Text>
          {selectedForCompare.length === 2 && (
            <TouchableOpacity onPress={handleCompare} style={styles.compareButton}>
              <Text style={styles.compareButtonText}>Compare</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Photos Grid */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.photosGrid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
            progressBackgroundColor={colors.card}
          />
        }
      >
        {getFilteredPhotos().length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="camera-off" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No progress photos yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Start tracking your journey with photos
            </Text>
          </View>
        ) : (
          getFilteredPhotos().map(photo => (
            <TouchableOpacity
              key={photo.id}
              style={[
                styles.photoCard,
                compareMode && selectedForCompare.find(p => p.id === photo.id) && styles.photoCardSelected
              ]}
              onPress={() => handlePhotoPress(photo)}
            >
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <View style={styles.photoOverlay}>
                <Text style={styles.photoDate}>
                  {new Date(photo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                {photo.weight && (
                  <Text style={styles.photoWeight}>{photo.weight} kg</Text>
                )}
              </View>
              {compareMode && selectedForCompare.find(p => p.id === photo.id) && (
                <View style={styles.selectedBadge}>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Action Buttons */}
      {!compareMode && (
        <View style={styles.fabContainer}>
          <TouchableOpacity style={[styles.fab, styles.fabSecondary]} onPress={pickImage}>
            <MaterialCommunityIcons name="image" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fab} onPress={takePhoto}>
            <MaterialCommunityIcons name="camera" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Add Photo Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#2C2C2E' : 'white' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Progress Photo</Text>

            {newPhotoUri && (
              <Image source={{ uri: newPhotoUri }} style={styles.previewImage} />
            )}

            {/* Photo Type */}
            <Text style={[styles.label, { color: colors.text }]}>Photo Type</Text>
            <View style={styles.typeSelector}>
              {(['front', 'side', 'back', 'other'] as ProgressPhoto['type'][]).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newPhotoType === type && styles.typeButtonActive
                  ]}
                  onPress={() => setNewPhotoType(type)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newPhotoType === type && styles.typeButtonTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Weight (Optional) */}
            <Text style={[styles.label, { color: colors.text }]}>Weight (kg) - Optional</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', color: colors.text }]}
              value={newPhotoWeight}
              onChangeText={setNewPhotoWeight}
              placeholder="Enter weight"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />

            {/* Notes (Optional) */}
            <Text style={[styles.label, { color: colors.text }]}>Notes - Optional</Text>
            <TextInput
              style={[styles.input, styles.notesInput, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', color: colors.text }]}
              value={newPhotoNotes}
              onChangeText={setNewPhotoNotes}
              placeholder="Add notes about this photo"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSavePhoto}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Photo Modal */}
      <Modal
        visible={showPhotoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.photoModalOverlay}>
          <View style={styles.photoModalHeader}>
            <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
              <MaterialCommunityIcons name="close" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => selectedPhoto && handleDeletePhoto(selectedPhoto.id)}
            >
              <MaterialCommunityIcons name="delete" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {selectedPhoto && (
            <>
              <Image source={{ uri: selectedPhoto.uri }} style={styles.fullPhoto} />
              <View style={styles.photoInfo}>
                <Text style={styles.photoInfoDate}>
                  {new Date(selectedPhoto.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
                <View style={styles.photoInfoRow}>
                  <Text style={styles.photoInfoLabel}>Type:</Text>
                  <Text style={styles.photoInfoValue}>
                    {selectedPhoto.type.charAt(0).toUpperCase() + selectedPhoto.type.slice(1)}
                  </Text>
                </View>
                {selectedPhoto.weight && (
                  <View style={styles.photoInfoRow}>
                    <Text style={styles.photoInfoLabel}>Weight:</Text>
                    <Text style={styles.photoInfoValue}>{selectedPhoto.weight} kg</Text>
                  </View>
                )}
                {selectedPhoto.notes && (
                  <View style={styles.photoInfoRow}>
                    <Text style={styles.photoInfoLabel}>Notes:</Text>
                    <Text style={styles.photoInfoValue}>{selectedPhoto.notes}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  compareBanner: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
  },
  compareBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  compareButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  compareButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 100,
  },
  photoCard: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoCardSelected: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  photoDate: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  photoWeight: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    width: width - 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabSecondary: {
    backgroundColor: '#4ECDC4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#FF6B35',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'black',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  fullPhoto: {
    width: '100%',
    height: '60%',
    resizeMode: 'contain',
  },
  photoInfo: {
    padding: 20,
  },
  photoInfoDate: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  photoInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  photoInfoLabel: {
    color: '#999',
    fontSize: 14,
    width: 80,
  },
  photoInfoValue: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
});

export default ProgressPhotosScreen;
