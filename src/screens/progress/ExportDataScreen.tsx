import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import exportService, { ExportDataType, ExportFormat } from '../../services/exportService';
import DateTimePicker from '@react-native-community/datetimepicker';

const ExportDataScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [selectedTypes, setSelectedTypes] = useState<ExportDataType[]>(['all']);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dataTypeOptions: { type: ExportDataType; label: string; icon: string }[] = [
    { type: 'all', label: 'All Data', icon: 'apps' },
    { type: 'workouts', label: 'Workouts', icon: 'barbell' },
    { type: 'nutrition', label: 'Nutrition', icon: 'restaurant' },
    { type: 'weight', label: 'Weight', icon: 'speedometer' },
    { type: 'measurements', label: 'Measurements', icon: 'resize' },
    { type: 'photos', label: 'Progress Photos', icon: 'camera' },
  ];

  const toggleDataType = (type: ExportDataType) => {
    if (type === 'all') {
      setSelectedTypes(['all']);
    } else {
      const newTypes = selectedTypes.includes('all')
        ? [type]
        : selectedTypes.includes(type)
        ? selectedTypes.filter(t => t !== type)
        : [...selectedTypes, type];

      setSelectedTypes(newTypes.length === 0 ? ['all'] : newTypes);
    }
  };

  const handleExport = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to export data');
      return;
    }

    setExporting(true);

    try {
      await exportService.exportData({
        userId: user.id,
        dataTypes: selectedTypes,
        format,
        startDate: useDateRange ? startDate : undefined,
        endDate: useDateRange ? endDate : undefined,
      });

      Alert.alert(
        'Success',
        `Your data has been exported as ${format.toUpperCase()}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#202124" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Data</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#4ECDC4" />
          <Text style={styles.infoText}>
            Export your fitness data to backup or analyze in other apps
          </Text>
        </View>

        {/* Data Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Data to Export</Text>
          <View style={styles.optionsGrid}>
            {dataTypeOptions.map(option => {
              const isSelected = selectedTypes.includes(option.type);
              const isDisabled = selectedTypes.includes('all') && option.type !== 'all';

              return (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    isDisabled && styles.optionCardDisabled,
                  ]}
                  onPress={() => toggleDataType(option.type)}
                  disabled={isDisabled}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={28}
                    color={isSelected ? '#4ECDC4' : isDisabled ? '#4A5568' : '#B0B0B0'}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                      isDisabled && styles.optionLabelDisabled,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Format Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatContainer}>
            <TouchableOpacity
              style={[styles.formatButton, format === 'json' && styles.formatButtonSelected]}
              onPress={() => setFormat('json')}
            >
              <Ionicons
                name="code-slash"
                size={24}
                color={format === 'json' ? '#4ECDC4' : '#B0B0B0'}
              />
              <Text
                style={[
                  styles.formatText,
                  format === 'json' && styles.formatTextSelected,
                ]}
              >
                JSON
              </Text>
              <Text style={styles.formatDescription}>
                Best for backup and restoration
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.formatButton, format === 'csv' && styles.formatButtonSelected]}
              onPress={() => setFormat('csv')}
            >
              <Ionicons
                name="document-text"
                size={24}
                color={format === 'csv' ? '#4ECDC4' : '#B0B0B0'}
              />
              <Text
                style={[
                  styles.formatText,
                  format === 'csv' && styles.formatTextSelected,
                ]}
              >
                CSV
              </Text>
              <Text style={styles.formatDescription}>
                Best for Excel and analysis
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Range Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Date Range (Optional)</Text>
            <TouchableOpacity
              style={[styles.toggle, useDateRange && styles.toggleActive]}
              onPress={() => setUseDateRange(!useDateRange)}
            >
              <View style={[styles.toggleKnob, useDateRange && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {useDateRange && (
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>From:</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.dateText}>
                    {startDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#B0B0B0" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>To:</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.dateText}>
                    {endDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#B0B0B0" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download" size={24} color="#fff" />
              <Text style={styles.exportButtonText}>Export Data</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
          maximumDate={endDate}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202124',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3A47',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B0B0B0',
    marginTop: 8,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  optionLabelDisabled: {
    color: '#4A5568',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  formatContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatButtonSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  formatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0B0',
    marginTop: 8,
  },
  formatTextSelected: {
    color: '#4ECDC4',
  },
  formatDescription: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 4,
    textAlign: 'center',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#4ECDC4',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#B0B0B0',
  },
  toggleKnobActive: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
  dateRangeContainer: {
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateLabel: {
    fontSize: 16,
    color: '#fff',
    width: 50,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
  },
  exportButton: {
    backgroundColor: '#4ECDC4',
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ExportDataScreen;
