import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

interface NutritionOnboardingScreenProps {
  onComplete: () => void;
}

const NutritionOnboardingScreen: React.FC<NutritionOnboardingScreenProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(-1); // Start at -1 for welcome screen

  // Only ask for goal in nutrition onboarding
  const [goal, setGoal] = useState('');

  // Nutrition preferences (optional)
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [calculatedTargets, setCalculatedTargets] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  const allergens = [
    { id: 'alcohol', name: 'Alcohol' },
    { id: 'caffeine', name: 'Caffeine' },
    { id: 'celery', name: 'Celery' },
    { id: 'crustacean', name: 'Crustacean' },
    { id: 'egg', name: 'Egg' },
    { id: 'fish', name: 'Fish' },
    { id: 'gluten', name: 'Gluten' },
    { id: 'groundnut', name: 'Groundnut' },
    { id: 'milk', name: 'Milk' },
    { id: 'mollusc', name: 'Mollusc' },
    { id: 'mustard', name: 'Mustard' },
    { id: 'sesame', name: 'Sesame' },
    { id: 'soybean', name: 'Soybean' },
    { id: 'sulphites', name: 'Sulphites' },
    { id: 'tree-nut', name: 'Tree Nut' },
    { id: 'wheat', name: 'Wheat' },
    { id: 'lactose', name: 'Lactose' },
    { id: 'yeast', name: 'Yeast' },
  ];

  const diets = [
    { id: 'dairy-free', name: 'Dairy Free' },
    { id: 'gluten-free', name: 'Gluten Free' },
    { id: 'keto', name: 'Keto' },
    { id: 'lacto-vegetarian', name: 'Lacto Vegetarian' },
    { id: 'low-carb', name: 'Low Carb' },
    { id: 'mediterranean', name: 'Mediterranean' },
    { id: 'ovo-vegetarian', name: 'Ovo Vegetarian' },
    { id: 'ovo-lacto-vegetarian', name: 'Ovo-Lacto Vegetarian' },
    { id: 'paleo', name: 'Paleo' },
    { id: 'pescatarian', name: 'Pescatarian' },
    { id: 'vegan', name: 'Vegan' },
    { id: 'vegetarian', name: 'Vegetarian' },
  ];

  // Load user data from regular onboarding on mount
  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Try to load from regular onboarding
      const onboardingDataKey = `onboarding_data_${user?.id}`;
      const dataStr = await AsyncStorage.getItem(onboardingDataKey);

      if (dataStr) {
        const data = JSON.parse(dataStr);
        setUserData(data);
        console.log('Loaded user data from onboarding:', data);
      } else {
        console.warn('No user data found from onboarding');
        // Use default values
        setUserData({
          weight: 70,
          height: 175,
          age: 25,
          gender: 'male',
          activityLevel: 'moderately-active'
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const toggleAllergen = (id: string) => {
    setSelectedAllergens(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleDiet = (id: string) => {
    setSelectedDiets(prev => {
      if (prev.includes(id)) {
        return prev.filter(d => d !== id);
      } else if (prev.length < 2) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const toggleCategory = (mealType: string, categoryId: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [mealType]: prev[mealType].includes(categoryId)
        ? prev[mealType].filter(c => c !== categoryId)
        : [...prev[mealType], categoryId],
    }));
  };

  const handleNext = async () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 2) {
      // Calculate targets and show results
      setCurrentStep(3); // Move to results screen first (shows loading)
      await calculateAndSaveTargets(); // Calculate and save
    } else {
      await handleComplete();
    }
  };

  const calculateAndSaveTargets = async () => {
    try {
      setIsGenerating(true);
      console.log('=== Starting Calorie Calculation ===');

      if (!userData) {
        console.error('No user data available!');
        return;
      }

      const weightKg = userData.weight;
      const heightCm = userData.height;
      const ageNum = userData.age;
      const gender = userData.gender;
      const activityLevel = userData.activityLevel;

      console.log('Using data:', { weightKg, heightCm, ageNum, gender, activityLevel, goal });

      // Calculate BMR using Mifflin-St Jeor equation
      let bmr: number;
      if (gender === 'male') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5;
      } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;
      }

      // Activity multipliers
      const activityMultipliers: Record<string, number> = {
        'sedentary': 1.2,
        'lightly-active': 1.375,
        'moderately-active': 1.55,
        'very-active': 1.725,
        'extra-active': 1.9
      };

      const activityMultiplier = activityMultipliers[activityLevel] || 1.55;
      const tdee = bmr * activityMultiplier;

      // Calculate calories based on goal
      let calories = Math.round(tdee);
      if (goal === 'lose') {
        calories = Math.round(tdee * 0.85); // 15% deficit
      } else if (goal === 'gain') {
        calories = Math.round(tdee * 1.15); // 15% surplus
      }

      // Calculate macros based on goal
      let proteinRatio = 0.30;
      let carbRatio = 0.40;
      let fatRatio = 0.30;

      if (goal === 'gain') {
        proteinRatio = 0.30;
        carbRatio = 0.45;
        fatRatio = 0.25;
      } else if (goal === 'lose') {
        proteinRatio = 0.35;
        carbRatio = 0.40;
        fatRatio = 0.25;
      }

      const protein = Math.round((calories * proteinRatio) / 4);
      const carbs = Math.round((calories * carbRatio) / 4);
      const fat = Math.round((calories * fatRatio) / 9);
      const water = Math.round(weightKg * 35);

      const targets = { calories, protein, carbs, fat, water };
      console.log('Calculated targets:', targets);

      setCalculatedTargets(targets);

      // Save targets locally
      const nutritionDataKey = `nutrition_data_${user?.id}`;
      await AsyncStorage.setItem(nutritionDataKey, JSON.stringify({
        ...userData,
        goal,
        targets,
        allergens: selectedAllergens,
        diets: selectedDiets
      }));

      console.log('✓ Nutrition data saved locally');

    } catch (error) {
      console.error('!!! Error calculating targets:', error);
      setCalculatedTargets({
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 67,
        water: 2500
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSkip = () => {
    if (currentStep === -1) {
      // Skip entire onboarding from welcome screen
      handleComplete();
    } else if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      console.log('=== Completing Nutrition Onboarding ===');

      const nutritionOnboardingKey = `nutrition_onboarding_complete_${user?.id}`;
      await AsyncStorage.setItem(nutritionOnboardingKey, 'true');
      console.log('✓ Onboarding completion saved');

      console.log('=== Onboarding Complete - Ready to track food! ===');
      onComplete();
    } catch (error) {
      console.error('!!! Error saving nutrition onboarding:', error);
    }
  };

  const renderWelcomeScreen = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeEmoji}>🍎</Text>
        <Text style={styles.welcomeTitle}>Welcome to Nutrition!</Text>
        <Text style={styles.welcomeSubtitle}>
          Let's calculate your daily calorie needs and set up food tracking.{'\n\n'}
          We'll ask a few questions to personalize your nutrition goals.
        </Text>
        <View style={styles.welcomeFeatures}>
          <View style={styles.welcomeFeature}>
            <Ionicons name="checkmark-circle" size={24} color="#FF8C42" />
            <Text style={styles.welcomeFeatureText}>Calculate your calorie target</Text>
          </View>
          <View style={styles.welcomeFeature}>
            <Ionicons name="checkmark-circle" size={24} color="#FF8C42" />
            <Text style={styles.welcomeFeatureText}>Track your meals easily</Text>
          </View>
          <View style={styles.welcomeFeature}>
            <Ionicons name="checkmark-circle" size={24} color="#FF8C42" />
            <Text style={styles.welcomeFeatureText}>Monitor your progress</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderWeightHeightStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>What's your weight{'\n'}and height?</Text>
      <Text style={styles.subtitle}>We'll use this to calculate your calorie needs</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Weight (kg)</Text>
        <TextInput
          style={styles.textInput}
          value={weight}
          onChangeText={setWeight}
          placeholder="70"
          keyboardType="decimal-pad"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Height (cm)</Text>
        <TextInput
          style={styles.textInput}
          value={height}
          onChangeText={setHeight}
          placeholder="175"
          keyboardType="decimal-pad"
          placeholderTextColor="#666"
        />
      </View>
    </ScrollView>
  );

  const renderAgeGenderStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>How old are you?</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Age</Text>
        <TextInput
          style={styles.textInput}
          value={age}
          onChangeText={setAge}
          placeholder="25"
          keyboardType="number-pad"
          placeholderTextColor="#666"
        />
      </View>

      <Text style={[styles.title, { marginTop: 30 }]}>What's your gender?</Text>
      <View style={styles.optionsList}>
        <TouchableOpacity
          style={[styles.optionCard, gender === 'male' && styles.optionCardSelected]}
          onPress={() => setGender('male')}
        >
          <Text style={[styles.optionText, gender === 'male' && styles.optionTextSelected]}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionCard, gender === 'female' && styles.optionCardSelected]}
          onPress={() => setGender('female')}
        >
          <Text style={[styles.optionText, gender === 'female' && styles.optionTextSelected]}>Female</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderActivityLevelStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>What's your activity{'\n'}level?</Text>
      <Text style={styles.subtitle}>How active are you on a daily basis?</Text>

      <View style={styles.optionsList}>
        {[
          { id: 'sedentary', name: 'Sedentary', desc: 'Little or no exercise' },
          { id: 'lightly-active', name: 'Lightly Active', desc: 'Exercise 1-3 times/week' },
          { id: 'moderately-active', name: 'Moderately Active', desc: 'Exercise 4-5 times/week' },
          { id: 'very-active', name: 'Very Active', desc: 'Daily exercise or intense 3-4 times/week' },
          { id: 'extra-active', name: 'Extra Active', desc: 'Intense exercise 6-7 times/week' }
        ].map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[styles.optionCard, activityLevel === level.id && styles.optionCardSelected]}
            onPress={() => setActivityLevel(level.id)}
          >
            <Text style={[styles.optionText, activityLevel === level.id && styles.optionTextSelected]}>{level.name}</Text>
            <Text style={[styles.optionDesc, activityLevel === level.id && styles.optionDescSelected]}>{level.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderGoalStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>What's your goal?</Text>
      <Text style={styles.subtitle}>This will determine your calorie target</Text>

      <View style={styles.optionsList}>
        <TouchableOpacity
          style={[styles.optionCard, goal === 'lose' && styles.optionCardSelected]}
          onPress={() => setGoal('lose')}
        >
          <Text style={[styles.optionText, goal === 'lose' && styles.optionTextSelected]}>Lose Weight</Text>
          <Text style={[styles.optionDesc, goal === 'lose' && styles.optionDescSelected]}>15% calorie deficit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionCard, goal === 'maintain' && styles.optionCardSelected]}
          onPress={() => setGoal('maintain')}
        >
          <Text style={[styles.optionText, goal === 'maintain' && styles.optionTextSelected]}>Maintain Weight</Text>
          <Text style={[styles.optionDesc, goal === 'maintain' && styles.optionDescSelected]}>Balanced calories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionCard, goal === 'gain' && styles.optionCardSelected]}
          onPress={() => setGoal('gain')}
        >
          <Text style={[styles.optionText, goal === 'gain' && styles.optionTextSelected]}>Gain Weight</Text>
          <Text style={[styles.optionDesc, goal === 'gain' && styles.optionDescSelected]}>15% calorie surplus</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderAllergensStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Are you avoiding any{'\n'}ingredients?</Text>
      <View style={styles.allergensList}>
        {allergens.map((allergen) => (
          <TouchableOpacity
            key={allergen.id}
            style={[
              styles.allergenPill,
              selectedAllergens.includes(allergen.id) && styles.allergenPillSelected,
            ]}
            onPress={() => toggleAllergen(allergen.id)}
          >
            <Text
              style={[
                styles.allergenText,
                selectedAllergens.includes(allergen.id) && styles.allergenTextSelected,
              ]}
            >
              {allergen.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderDietsStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Do you have a special{'\n'}diet?</Text>
      <Text style={styles.subtitle}>Choose up to 2 diets to personalize your experience. Change them anytime.</Text>
      <View style={styles.dietsList}>
        {diets.map((diet) => (
          <TouchableOpacity
            key={diet.id}
            style={[
              styles.dietPill,
              selectedDiets.includes(diet.id) && styles.dietPillSelected,
              selectedDiets.length >= 2 && !selectedDiets.includes(diet.id) && styles.dietPillDisabled,
            ]}
            onPress={() => toggleDiet(diet.id)}
            disabled={selectedDiets.length >= 2 && !selectedDiets.includes(diet.id)}
          >
            <Text
              style={[
                styles.dietText,
                selectedDiets.includes(diet.id) && styles.dietTextSelected,
              ]}
            >
              {diet.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderCategoriesStep = (mealType: string, mealName: string) => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Preferred Categories for{'\n'}{mealName}</Text>
      <Text style={styles.subtitle}>
        Select the food categories you love most. Recipes from these categories will be prioritized within this Meal Type, provided they match your other preferences. For maximum variety, leave all options unchecked.
      </Text>
      <View style={styles.categoriesList}>
        {foodCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryPill,
              selectedCategories[mealType].includes(category.id) && styles.categoryPillSelected,
            ]}
            onPress={() => toggleCategory(mealType, category.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategories[mealType].includes(category.id) && styles.categoryTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderResultsScreen = () => {
    if (isGenerating) {
      return (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsContent}>
            <ActivityIndicator size="large" color="#FF8C42" />
            <Text style={[styles.resultsSubtitle, { marginTop: 20 }]}>
              Generating your personalized meal plans...
            </Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.resultsScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsContent}>
          <Text style={styles.resultsEmoji}>✨</Text>
          <Text style={styles.resultsTitle}>Your Daily Targets</Text>
          <Text style={styles.resultsSubtitle}>
            Based on your profile and goals:
          </Text>

          <View style={styles.macrosCard}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{calculatedTargets?.calories || 2000}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>

            <View style={styles.macrosDivider} />

            <View style={styles.macrosRow}>
              <View style={styles.macroSmallItem}>
                <Text style={styles.macroSmallValue}>{calculatedTargets?.protein || 150}g</Text>
                <Text style={styles.macroSmallLabel}>Protein</Text>
              </View>
              <View style={styles.macroSmallItem}>
                <Text style={styles.macroSmallValue}>{calculatedTargets?.carbs || 200}g</Text>
                <Text style={styles.macroSmallLabel}>Carbs</Text>
              </View>
              <View style={styles.macroSmallItem}>
                <Text style={styles.macroSmallValue}>{calculatedTargets?.fat || 67}g</Text>
                <Text style={styles.macroSmallLabel}>Fat</Text>
              </View>
            </View>
          </View>

          <View style={[styles.macrosDivider, { marginTop: 16 }]} />

          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{calculatedTargets?.water || 2500}ml</Text>
            <Text style={styles.macroLabel}>Water</Text>
          </View>

          <View style={styles.resultsNote}>
            <Ionicons name="information-circle" size={20} color="#FF8C42" />
            <Text style={styles.resultsNoteText}>
              Start logging your meals to track your progress. You can also browse meal plans from the nutrition tab if you want pre-planned meals.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    );
  };

  let stepContent;
  let stepTitle = '';

  switch (currentStep) {
    case -1:
      stepContent = renderWelcomeScreen();
      stepTitle = 'Welcome';
      break;
    case 0:
      stepContent = renderGoalStep();
      stepTitle = 'Your Goal';
      break;
    case 1:
      stepContent = renderAllergensStep();
      stepTitle = 'Allergens (Optional)';
      break;
    case 2:
      stepContent = renderDietsStep();
      stepTitle = 'Diets (Optional)';
      break;
    case 3:
      stepContent = renderResultsScreen();
      stepTitle = 'Your Targets';
      break;
    default:
      stepContent = null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {currentStep !== -1 && currentStep !== 3 && (
        <>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressIndicator}>
            {[0, 1, 2].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressDot,
                  step === currentStep && styles.progressDotActive,
                  step < currentStep && styles.progressDotCompleted,
                ]}
              />
            ))}
          </View>
        </>
      )}

      {stepContent}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === -1 ? "Let's Go" : currentStep === 2 ? 'Calculate' : currentStep === 3 ? 'Start Tracking' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  welcomeFeatures: {
    width: '100%',
    gap: 16,
  },
  welcomeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeFeatureText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  resultsContent: {
    alignItems: 'center',
  },
  resultsEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  macrosCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  macroItem: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  macroValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 16,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  macrosDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  macroSmallItem: {
    alignItems: 'center',
  },
  macroSmallValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  macroSmallLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  resultsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  resultsNoteText: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerSpacer: {
    width: 50,
  },
  skipText: {
    color: '#FF8C42',
    fontSize: 16,
    fontWeight: '600',
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#FF8C42',
  },
  progressDotCompleted: {
    backgroundColor: '#FF8C42',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: '#999',
    marginBottom: 20,
    lineHeight: 22,
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  allergenPill: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  allergenPillSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  allergenText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  allergenTextSelected: {
    color: '#000',
  },
  dietsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dietPill: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dietPillSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  dietPillDisabled: {
    opacity: 0.4,
  },
  dietText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  dietTextSelected: {
    color: '#000',
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryPill: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryPillSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  categoryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#000',
  },
  footer: {
    padding: 20,
    paddingBottom: 100,
  },
  nextButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: 18,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  resultsScrollView: {
    flex: 1,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  planCardSelected: {
    borderColor: '#FF8C42',
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioSelected: {
    borderColor: '#FF8C42',
  },
  planRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF8C42',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  planCalories: {
    fontSize: 14,
    color: '#999',
  },
  planMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  planMacroItem: {
    alignItems: 'center',
  },
  planMacroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: 4,
  },
  planMacroLabel: {
    fontSize: 12,
    color: '#999',
  },
  planMealsPreview: {
    marginTop: 16,
    gap: 8,
  },
  planMealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planMealName: {
    fontSize: 14,
    color: '#fff',
  },
  planMealCalories: {
    fontSize: 14,
    color: '#999',
  },
  // New styles for inputs and options
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionCardSelected: {
    borderColor: '#FF8C42',
    backgroundColor: 'rgba(255, 140, 66, 0.15)',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionTextSelected: {
    color: '#FF8C42',
  },
  optionDesc: {
    fontSize: 14,
    color: '#999',
  },
  optionDescSelected: {
    color: '#FFA366',
  },
});

export default NutritionOnboardingScreen;
