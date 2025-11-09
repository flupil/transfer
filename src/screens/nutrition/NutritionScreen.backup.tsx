import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { getSafeDatabase } from '../../database/databaseHelper';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const NutritionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Nutrition data
  const [dailyTarget] = useState(1759);
  const [consumed, setConsumed] = useState(0);
  const [proteinData, setProteinData] = useState({ consumed: 0, target: 592 });
  const [carbsData, setCarbsData] = useState({ consumed: 0, target: 392 });
  const [fatData, setFatData] = useState({ consumed: 0, target: 720 });

  // Meals data
  const [meals, setMeals] = useState([
    {
      id: '1',
      type: 'Breakfast',
      time: '08:00',
      calories: 191,
      protein: 13,
      carbs: 22,
      fat: 5,
      icon: 'weather-sunny',
      iconColor: '#4FC3F7'
    },
    {
      id: '2',
      type: 'Snack',
      time: '11:00',
      calories: 99,
      protein: 1,
      carbs: 11,
      fat: 5,
      icon: 'weather-sunny',
      iconColor: '#4FC3F7'
    },
    {
      id: '3',
      type: 'Lunch',
      time: '14:00',
      calories: 697,
      protein: 56,
      carbs: 46,
      fat: 30,
      icon: 'white-balance-sunny',
      iconColor: '#FFB74D'
    },
    {
      id: '4',
      type: 'Snack 2',
      time: '18:00',
      calories: 110,
      protein: 1,
      carbs: 26,
      fat: 0,
      icon: 'weather-sunset',
      iconColor: '#FF8A65'
    },
    {
      id: '5',
      type: 'Dinner',
      time: '20:00',
      calories: 662,
      protein: 28,
      carbs: 42,
      fat: 38,
      icon: 'moon-waning-crescent',
      iconColor: '#9575CD'
    }
  ]);

  useEffect(() => {
    loadNutritionData();
  }, [selectedDate]);

  const loadNutritionData = async () => {
    try {
      const db = getSafeDatabase();
      if (!db || !user?.id) return;

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const result = await db.getAllAsync(
        'SELECT * FROM nutrition_logs WHERE userId = ? AND date = ?',
        [user.id, dateStr]
      ) as any[];

      if (result.length > 0) {
        const data = result[0] as any;
        setConsumed(data.totalCalories || 0);
        setProteinData({ consumed: data.totalProtein || 0, target: 150 });
        setCarbsData({ consumed: data.totalCarbs || 0, target: 250 });
        setFatData({ consumed: data.totalFat || 0, target: 65 });
      }
    } catch (error) {
      console.error('Failed to load nutrition data:', error);
    }
  };

  const navigateToFoodLog = (mealType: string) => {
    (navigation as any).navigate('FoodLog', { mealType, date: selectedDate });
  };

  const getCaloriesLeft = () => dailyTarget - consumed;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Date Picker */}
      <TouchableOpacity style={styles.datePickerContainer}>
        <MaterialCommunityIcons name="calendar" size={24} color="#333" />
        <Text style={styles.dateText}>Today | {format(selectedDate, 'dd/MM/yyyy')}</Text>
        <MaterialCommunityIcons name="chevron-down" size={24} color="#333" />
      </TouchableOpacity>

      {/* Calories Circle Section */}
      <View style={styles.caloriesSection}>
        <Text style={styles.sectionTitle}>Nutrition Menu</Text>

        <View style={styles.circleContainer}>
          <Text style={styles.targetText}>{dailyTarget}</Text>
          <Text style={styles.targetLabel}>Calorie deficit</Text>

          <View style={styles.progressCircleWrapper}>
            <CircularProgressBase
              value={consumed}
              maxValue={dailyTarget}
              radius={100}
              duration={1000}
              activeStrokeColor={'#4FC3F7'}
              activeStrokeSecondaryColor={'#9575CD'}
              inActiveStrokeColor={'#E0E0E0'}
              inActiveStrokeOpacity={0.2}
              activeStrokeWidth={15}
              inActiveStrokeWidth={15}
            />
          </View>

          {/* Macros Breakdown */}
          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: '#2C5F5D' }]} />
              <Text style={styles.macroValue}>{carbsData.consumed}/{carbsData.target} cal</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>

            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: '#9575CD' }]} />
              <Text style={styles.macroValue}>{proteinData.consumed}/{proteinData.target} cal</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>

            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: '#4FC3F7' }]} />
              <Text style={styles.macroValue}>{fatData.consumed}/{fatData.target} cal</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Empty State Message */}
        {consumed === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyTitle}>Time to get started</Text>
              <Text style={styles.emptySubtitle}>Nutrition Tips:</Text>
              <Text style={styles.emptyText}>
                The macros you add depend on your daily needs{'\n'}
                for calories, carbohydrates, fats, proteins, snacks,{'\n'}
                water, and food. To add your daily recommended{'\n'}
                macros for today, click on the button below. These{'\n'}
                are adjusted based on your intake{'\n'}
                from yesterday, accounting for food and water intake.
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Meals List */}
      <View style={styles.mealsSection}>
        {meals.map((meal) => (
          <Card key={meal.id} style={styles.mealCard}>
            <Card.Content>
              <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>
                    {meal.type} | <Text style={styles.mealTime}>{meal.time}</Text>
                  </Text>
                  <Text style={styles.mealStats}>
                    {meal.calories} Calories | {meal.protein}g Protein | {meal.carbs}g Carbs | {meal.fat}g Fat
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={meal.icon as any}
                  size={32}
                  color={meal.iconColor}
                />
              </View>

              <View style={styles.divider}>
                {[...Array(30)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 8,
                      height: 1,
                      backgroundColor: '#E0E0E0',
                      marginHorizontal: 2,
                    }}
                  />
                ))}
              </View>

              <View style={styles.mealActions}>
                <TouchableOpacity style={styles.markDoneButton}>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.markDoneText}>Mark done</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.changeMealButton}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#2196F3" />
                  <Text style={styles.changeMealText}>Change meal</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addCommentButton}>
                  <MaterialCommunityIcons name="comment-text" size={16} color="#FF9800" />
                  <Text style={styles.addCommentText}>Add comment</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  datePickerContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 25,
    gap: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  caloriesSection: {
    paddingTop: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  circleContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  targetText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  targetLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  progressCircleWrapper: {
    marginVertical: 20,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: width - 40,
    marginTop: 30,
    paddingHorizontal: 20,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 30,
    borderRadius: 15,
    backgroundColor: 'white',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  mealsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  mealCard: {
    marginBottom: 16,
    borderRadius: 15,
    backgroundColor: 'white',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  mealStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    height: 1,
    marginVertical: 12,
    marginHorizontal: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  markDoneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  markDoneText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '500',
  },
  changeMealButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  changeMealText: {
    color: '#2196F3',
    fontSize: 11,
    fontWeight: '500',
  },
  addCommentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  addCommentText: {
    color: '#FF9800',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default NutritionScreen;