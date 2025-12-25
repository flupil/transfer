import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodWithVariations, FoodVariation } from '../data/foodVariations';
import { useTheme } from '../contexts/ThemeContext';

const { height } = Dimensions.get('window');

interface FoodVariationModalProps {
  visible: boolean;
  foodWithVariations: FoodWithVariations | null;
  onSelectVariation: (variation: FoodVariation) => void;
  onClose: () => void;
}

const FoodVariationModal: React.FC<FoodVariationModalProps> = ({
  visible,
  foodWithVariations,
  onSelectVariation,
  onClose,
}) => {
  const { colors } = useTheme();

  if (!foodWithVariations) return null;

  const renderVariationCard = (variation: FoodVariation) => (
    <TouchableOpacity
      key={variation.id}
      style={[styles.variationCard, { backgroundColor: colors.cardBackground }]}
      onPress={() => onSelectVariation(variation)}
      activeOpacity={0.7}
    >
      <View style={styles.variationHeader}>
        <Text style={styles.variationEmoji}>{variation.emoji}</Text>
        <View style={styles.variationInfo}>
          <Text style={[styles.variationName, { color: colors.text }]}>
            {variation.name}
          </Text>
          {variation.description && (
            <Text style={[styles.variationDescription, { color: colors.textSecondary }]}>
              {variation.description}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>

      <View style={styles.nutritionRow}>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>
            {Math.round(variation.calories)}
          </Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>cal</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>
            {Math.round(variation.protein)}g
          </Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>protein</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>
            {Math.round(variation.carbs)}g
          </Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>carbs</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>
            {Math.round(variation.fat)}g
          </Text>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>fat</Text>
        </View>
      </View>

      <Text style={[styles.perServing, { color: colors.textSecondary }]}>
        per 100g
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerEmoji}>{foodWithVariations.emoji}</Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Choose {foodWithVariations.baseFoodName} Type
              </Text>
            </View>
            <View style={{ width: 28 }} />
          </View>

          {/* Variations List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Select the type of {foodWithVariations.baseFoodName.toLowerCase()} you had:
            </Text>

            {foodWithVariations.variations.map(renderVariationCard)}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.85,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  variationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  variationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  variationEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  variationInfo: {
    flex: 1,
  },
  variationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  variationDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 11,
  },
  perServing: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default FoodVariationModal;
