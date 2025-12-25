import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingBodyStatsScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const { t } = useLanguage();

  const [weight, setWeight] = useState(onboardingData.currentWeight?.toString() || '');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>(onboardingData.weightUnit || 'kg');

  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');

  const [age, setAge] = useState('');

  const handleNext = () => {
    const isValidAge = age && parseInt(age) >= 13 && parseInt(age) <= 100;
    const isValidHeight = (heightUnit === 'cm' && height) || (heightUnit === 'in' && feet);

    if (weight && isValidHeight && isValidAge) {
      let heightInCm: number;
      if (heightUnit === 'cm') {
        heightInCm = parseFloat(height);
      } else {
        const totalInches = (parseInt(feet) * 12) + (parseInt(inches) || 0);
        heightInCm = totalInches * 2.54;
      }

      updateOnboardingData({
        currentWeight: parseFloat(weight),
        weightUnit: weightUnit,
        height: heightInCm,
        heightUnit: 'cm',
        age: parseInt(age)
      });

      navigation.navigate('OnboardingFitnessLevel' as never);
    }
  };

  const convertWeight = () => {
    if (weight) {
      if (weightUnit === 'kg') {
        setWeightUnit('lb');
        setWeight(Math.round(parseFloat(weight) * 2.20462).toString());
      } else {
        setWeightUnit('kg');
        setWeight(Math.round(parseFloat(weight) / 2.20462).toString());
      }
    } else {
      setWeightUnit(weightUnit === 'kg' ? 'lb' : 'kg');
    }
  };

  const switchHeightUnit = () => {
    if (heightUnit === 'cm') {
      setHeightUnit('ft');
      if (height) {
        const totalInches = parseFloat(height) / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        setFeet(ft.toString());
        setInches(inch.toString());
      }
    } else {
      setHeightUnit('cm');
      if (feet) {
        const totalInches = (parseInt(feet) * 12) + (parseInt(inches) || 0);
        const cm = Math.round(totalInches * 2.54);
        setHeight(cm.toString());
      }
    }
  };

  const isValid = () => {
    const isValidAge = age && parseInt(age) >= 13 && parseInt(age) <= 100;
    const isValidHeight = (heightUnit === 'cm' && height) || (heightUnit === 'in' && feet);
    return weight && isValidHeight && isValidAge;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '25%' }]} />
          </View>
          <Text style={styles.progressText}>3/12</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          This helps us create your personalized plan
        </Text>

        {/* Weight Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Current Weight</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholderTextColor="#4E4E50"
              placeholder="Enter weight"
            />
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
                onPress={convertWeight}
              >
                <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>
                  KG
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitButton, weightUnit === 'lb' && styles.unitButtonActive]}
                onPress={convertWeight}
              >
                <Text style={[styles.unitText, weightUnit === 'lb' && styles.unitTextActive]}>
                  LB
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Height Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Height</Text>
          {heightUnit === 'cm' ? (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholderTextColor="#4E4E50"
                placeholder="Enter height"
              />
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitButton, heightUnit === 'cm' && styles.unitButtonActive]}
                  onPress={switchHeightUnit}
                >
                  <Text style={[styles.unitText, heightUnit === 'cm' && styles.unitTextActive]}>
                    CM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, heightUnit === 'in' && styles.unitButtonActive]}
                  onPress={switchHeightUnit}
                >
                  <Text style={[styles.unitText, heightUnit === 'in' && styles.unitTextActive]}>
                    FT
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <View style={styles.feetInputContainer}>
                <TextInput
                  style={[styles.input, styles.feetInput]}
                  value={feet}
                  onChangeText={setFeet}
                  keyboardType="numeric"
                  placeholderTextColor="#4E4E50"
                  placeholder="ft"
                />
                <Text style={styles.separator}>′</Text>
                <TextInput
                  style={[styles.input, styles.inchesInput]}
                  value={inches}
                  onChangeText={setInches}
                  keyboardType="numeric"
                  placeholderTextColor="#4E4E50"
                  placeholder="in"
                />
                <Text style={styles.separator}>″</Text>
              </View>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitButton, heightUnit === 'cm' && styles.unitButtonActive]}
                  onPress={switchHeightUnit}
                >
                  <Text style={[styles.unitText, heightUnit === 'cm' && styles.unitTextActive]}>
                    CM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, heightUnit === 'in' && styles.unitButtonActive]}
                  onPress={switchHeightUnit}
                >
                  <Text style={[styles.unitText, heightUnit === 'in' && styles.unitTextActive]}>
                    FT
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Age Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Age</Text>
          <View style={styles.ageInputRow}>
            <TextInput
              style={[styles.input, styles.ageInput]}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholderTextColor="#4E4E50"
              placeholder="Enter age"
              maxLength={3}
            />
            <Text style={styles.yearsText}>years</Text>
          </View>
          {age && (parseInt(age) < 13 || parseInt(age) > 100) && (
            <Text style={styles.errorText}>Please enter a valid age between 13 and 100</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !isValid() && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!isValid()}
        >
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 15,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    color: '#8e9bab',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e9bab',
    marginBottom: 40,
    lineHeight: 24,
  },
  section: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: '#fff',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 3,
  },
  unitButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  unitButtonActive: {
    backgroundColor: '#3B82F6',
  },
  unitText: {
    fontSize: 14,
    color: '#8e9bab',
    fontWeight: '600',
  },
  unitTextActive: {
    color: '#fff',
  },
  feetInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feetInput: {
    flex: 1,
    maxWidth: 80,
  },
  inchesInput: {
    flex: 1,
    maxWidth: 80,
  },
  separator: {
    fontSize: 20,
    color: '#8e9bab',
  },
  ageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ageInput: {
    maxWidth: 120,
  },
  yearsText: {
    fontSize: 16,
    color: '#8e9bab',
  },
  errorText: {
    color: '#E94E1B',
    fontSize: 13,
    marginTop: 8,
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingBodyStatsScreen;
