import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, FAB, List, Chip, Dialog, Portal, TextInput, IconButton, Menu, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getSafeDatabase } from '../../database/databaseHelper';
import { BRAND_COLORS } from '../../constants/brandColors';

interface MealPlan {
  id: string;
  name: string;
  description: string;
  owner: string;
  ownerId: string;
  duration: number; // in days
  meals: any[];
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  tags: string[];
  assignedUserIds?: string;
  isActive?: boolean;
}

// Predefined meal plan templates
const PRESET_MEAL_PLANS: MealPlan[] = [
  {
    id: 'preset_keto',
    name: 'Keto Diet Plan',
    description: 'High fat, low carb diet for ketosis',
    owner: 'gym',
    ownerId: 'gym',
    duration: 7,
    meals: [],
    dailyCalories: 1800,
    dailyProtein: 120,
    dailyCarbs: 25,
    dailyFat: 140,
    tags: ['keto', 'low-carb', 'weight-loss'],
  },
  {
    id: 'preset_vegan',
    name: 'Plant-Based Vegan',
    description: 'Complete plant-based nutrition plan',
    owner: 'gym',
    ownerId: 'gym',
    duration: 7,
    meals: [],
    dailyCalories: 2000,
    dailyProtein: 80,
    dailyCarbs: 300,
    dailyFat: 65,
    tags: ['vegan', 'plant-based', 'sustainable'],
  },
  {
    id: 'preset_muscle',
    name: 'Muscle Building',
    description: 'High protein plan for muscle growth',
    owner: 'gym',
    ownerId: 'gym',
    duration: 7,
    meals: [],
    dailyCalories: 2800,
    dailyProtein: 200,
    dailyCarbs: 350,
    dailyFat: 80,
    tags: ['muscle-gain', 'high-protein', 'bulking'],
  },
  {
    id: 'preset_balanced',
    name: 'Balanced Nutrition',
    description: 'Well-rounded diet for overall health',
    owner: 'gym',
    ownerId: 'gym',
    duration: 7,
    meals: [],
    dailyCalories: 2200,
    dailyProtein: 130,
    dailyCarbs: 275,
    dailyFat: 75,
    tags: ['balanced', 'healthy', 'maintenance'],
  },
  {
    id: 'preset_mediterranean',
    name: 'Mediterranean Diet',
    description: 'Heart-healthy diet rich in omega-3',
    owner: 'gym',
    ownerId: 'gym',
    duration: 7,
    meals: [],
    dailyCalories: 2000,
    dailyProtein: 100,
    dailyCarbs: 250,
    dailyFat: 75,
    tags: ['mediterranean', 'heart-healthy', 'omega-3'],
  },
  {
    id: 'preset_cutting',
    name: 'Cutting Phase',
    description: 'Low calorie, high protein for fat loss',
    owner: 'gym',
    ownerId: 'gym',
    duration: 7,
    meals: [],
    dailyCalories: 1600,
    dailyProtein: 160,
    dailyCarbs: 120,
    dailyFat: 50,
    tags: ['cutting', 'fat-loss', 'lean'],
  },
];

export const MealPlansScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(PRESET_MEAL_PLANS);
  const [myPlans, setMyPlans] = useState<MealPlan[]>([]);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    duration: 7,
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 250,
    dailyFat: 65,
  });

  useEffect(() => {
    loadMealPlans();
    loadActivePlan();
  }, []);

  const loadMealPlans = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      // Load user's own plans
      const userPlans = await db.getAllAsync(
        'SELECT * FROM meal_plans WHERE ownerId = ? ORDER BY createdAt DESC',
        [user?.id || '']
      ) as MealPlan[];

      // Load coach plans if user has a coach
      let coachPlans: MealPlan[] = [];
      if (user?.coachId) {
        coachPlans = await db.getAllAsync(
          'SELECT * FROM meal_plans WHERE ownerId = ? ORDER BY createdAt DESC',
          [user.coachId]
        ) as MealPlan[];
      }

      // Combine preset plans with coach plans
      const availablePlans = [...PRESET_MEAL_PLANS, ...coachPlans];
      setMealPlans(availablePlans);
      setMyPlans(userPlans);
    } catch (error) {
      console.error('Failed to load meal plans:', error);
    }
  };

  const loadActivePlan = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const active = await db.getAllAsync(
        'SELECT * FROM meal_plans WHERE assignedUserIds LIKE ? LIMIT 1',
        [`%${user?.id}%`]
      ) as MealPlan[];

      if (active.length > 0) {
        setActivePlan(active[0]);
      }
    } catch (error) {
      console.error('Failed to load active plan:', error);
    }
  };

  const createMealPlan = async () => {
    if (!newPlan.name) {
      Alert.alert(t('alert.error'), t('mealPlans.planNameRequired'));
      return;
    }

    try {
      const db = getSafeDatabase();
      if (!db) return;

      const planId = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create empty meal structure
      const meals: any[] = [];
      for (let day = 1; day <= newPlan.duration; day++) {
        meals.push({
          day,
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: [],
        });
      }

      await db.runAsync(
        `INSERT INTO meal_plans
         (id, name, description, owner, ownerId, duration, meals, dailyCalories, dailyProtein, dailyCarbs, dailyFat, tags, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', datetime('now'), datetime('now'))`,
        [
          planId,
          newPlan.name,
          newPlan.description,
          user?.role === 'coach' ? 'coach' : 'user',
          user?.id || '',
          newPlan.duration,
          JSON.stringify(meals),
          newPlan.dailyCalories,
          newPlan.dailyProtein,
          newPlan.dailyCarbs,
          newPlan.dailyFat,
        ]
      );

      setShowCreateDialog(false);
      setNewPlan({
        name: '',
        description: '',
        duration: 7,
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 250,
        dailyFat: 65,
      });
      loadMealPlans();
      Alert.alert(t('alert.success'), t('mealPlans.planCreated'));
    } catch (error) {
      console.error('Failed to create meal plan:', error);
      Alert.alert(t('alert.error'), t('mealPlans.createFailed'));
    }
  };

  const selectPlan = async (plan: MealPlan) => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      // Update plan with user assignment
      const currentAssigned = plan.assignedUserIds ? JSON.parse(plan.assignedUserIds as string) : [];
      if (!currentAssigned.includes(user?.id)) {
        currentAssigned.push(user?.id);
      }

      await db.runAsync(
        'UPDATE meal_plans SET assignedUserIds = ? WHERE id = ?',
        [JSON.stringify(currentAssigned), plan.id]
      );

      setActivePlan(plan);
      Alert.alert(t('alert.success'), t('mealPlans.nowFollowing', { planName: plan.name }));
      loadMealPlans();
    } catch (error) {
      console.error('Failed to select plan:', error);
      Alert.alert(t('alert.error'), t('mealPlans.selectFailed'));
    }
  };

  const duplicatePlan = async (plan: MealPlan) => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const newPlanId = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.runAsync(
        `INSERT INTO meal_plans
         (id, name, description, owner, ownerId, duration, meals, dailyCalories, dailyProtein, dailyCarbs, dailyFat, tags, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          newPlanId,
          `${plan.name} (Copy)`,
          plan.description,
          user?.role === 'coach' ? 'coach' : 'user',
          user?.id || '',
          plan.duration,
          JSON.stringify(plan.meals || []),
          plan.dailyCalories,
          plan.dailyProtein,
          plan.dailyCarbs,
          plan.dailyFat,
          JSON.stringify(plan.tags || []),
        ]
      );

      loadMealPlans();
      Alert.alert(t('alert.success'), t('mealPlans.duplicated'));
    } catch (error) {
      console.error('Failed to duplicate plan:', error);
      Alert.alert(t('alert.error'), t('mealPlans.duplicateFailed'));
    }
  };

  const deletePlan = async (planId: string) => {
    Alert.alert(
      t('mealPlans.deletePlan'),
      t('mealPlans.deleteConfirm'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('action.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getSafeDatabase();
              if (!db) return;

              await db.runAsync('DELETE FROM meal_plans WHERE id = ?', [planId]);
              loadMealPlans();
              Alert.alert(t('alert.success'), t('mealPlans.planDeleted'));
            } catch (error) {
              console.error('Failed to delete plan:', error);
              Alert.alert(t('alert.error'), t('mealPlans.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const renderPlanCard = (plan: MealPlan, isMyPlan: boolean = false) => (
    <Card key={plan.id} style={styles.planCard}>
      <Card.Content>
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <Text variant="titleLarge">{plan.name}</Text>
            {plan.description && (
              <Text variant="bodyMedium" style={styles.description}>
                {plan.description}
              </Text>
            )}
            <View style={styles.nutritionInfo}>
              <Chip compact style={styles.chip}>
                {plan.dailyCalories} cal/day
              </Chip>
              <Chip compact style={styles.chip}>
                {plan.duration} days
              </Chip>
              {plan.owner === 'gym' && (
                <Chip compact style={[styles.chip, styles.gymChip]}>
                  Preset
                </Chip>
              )}
              {plan.tags && plan.tags.length > 0 && plan.tags[0] && (
                <Chip compact style={[styles.chip, styles.tagChip]}>
                  {plan.tags[0]}
                </Chip>
              )}
            </View>
            <View style={styles.macroInfo}>
              <Text variant="bodySmall">
                P: {plan.dailyProtein}g • C: {plan.dailyCarbs}g • F: {plan.dailyFat}g
              </Text>
            </View>
          </View>
          <Menu
            visible={menuVisible === plan.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(plan.id)}
              />
            }
          >
            {!isMyPlan && (
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  selectPlan(plan);
                }}
                title="Select Plan"
                leadingIcon="check"
              />
            )}
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                duplicatePlan(plan);
              }}
              title="Duplicate"
              leadingIcon="content-copy"
            />
            {isMyPlan && (
              <>
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    (navigation as any).navigate('MealPlanEditor', { planId: plan.id });
                  }}
                  title={t('action.edit')}
                  leadingIcon="pencil"
                />
                <Divider />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    deletePlan(plan.id);
                  }}
                  title={t('action.delete')}
                  leadingIcon="delete"
                  titleStyle={{ color: '#f44336' }}
                />
              </>
            )}
          </Menu>
        </View>
      </Card.Content>
      {activePlan?.id === plan.id && (
        <Card.Actions>
          <Chip icon="check" style={styles.activeChip}>
            Currently Following
          </Chip>
        </Card.Actions>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        {activePlan && (
          <Card style={[styles.planCard, styles.activePlanCard]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Active Meal Plan
              </Text>
              <Text variant="headlineSmall">{activePlan.name}</Text>
              <Text variant="bodyMedium" style={styles.description}>
                {activePlan.description}
              </Text>
              <View style={styles.activeStats}>
                <Text variant="bodyMedium">
                  Daily Targets: {activePlan.dailyCalories} cal
                </Text>
                <Text variant="bodySmall" style={styles.macroText}>
                  P: {activePlan.dailyProtein}g • C: {activePlan.dailyCarbs}g • F: {activePlan.dailyFat}g
                </Text>
              </View>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('FoodLog' as never)}
                style={styles.logButton}
              >
                Log Today's Meals
              </Button>
            </Card.Content>
          </Card>
        )}

        {myPlans.length > 0 && (
          <>
            <Text variant="titleLarge" style={styles.sectionHeader}>
              My Meal Plans
            </Text>
            {myPlans.map(plan => renderPlanCard(plan, true))}
          </>
        )}

        <Text variant="titleLarge" style={styles.sectionHeader}>
          Available Meal Plans
        </Text>
        {mealPlans.map(plan => renderPlanCard(plan))}

        {mealPlans.length === 0 && myPlans.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.emptyText}>
                No meal plans available
              </Text>
              <Text variant="bodyMedium" style={[styles.emptyText, styles.emptySubtext]}>
                Create your first meal plan to get started
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowCreateDialog(true)}
        label={t('mealPlans.createPlan')}
      />

      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>{t('mealPlans.createPlan')}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <TextInput
                label={t('mealPlans.planName')}
                value={newPlan.name}
                onChangeText={(text) => setNewPlan({...newPlan, name: text})}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label={t('form.description')}
                value={newPlan.description}
                onChangeText={(text) => setNewPlan({...newPlan, description: text})}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
              <TextInput
                label={t('mealPlans.durationDays')}
                value={newPlan.duration.toString()}
                onChangeText={(text) => setNewPlan({...newPlan, duration: parseInt(text) || 7})}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
              <Text variant="titleSmall" style={styles.dailyTargets}>Daily Targets</Text>
              <TextInput
                label={t('form.calories')}
                value={newPlan.dailyCalories.toString()}
                onChangeText={(text) => setNewPlan({...newPlan, dailyCalories: parseInt(text) || 2000})}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
              <View style={styles.row}>
                <TextInput
                  label={t('form.protein')}
                  value={newPlan.dailyProtein.toString()}
                  onChangeText={(text) => setNewPlan({...newPlan, dailyProtein: parseInt(text) || 150})}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, styles.thirdInput]}
                />
                <TextInput
                  label={t('form.carbs')}
                  value={newPlan.dailyCarbs.toString()}
                  onChangeText={(text) => setNewPlan({...newPlan, dailyCarbs: parseInt(text) || 250})}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, styles.thirdInput]}
                />
                <TextInput
                  label={t('form.fat')}
                  value={newPlan.dailyFat.toString()}
                  onChangeText={(text) => setNewPlan({...newPlan, dailyFat: parseInt(text) || 65})}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, styles.thirdInput]}
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onPress={createMealPlan}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  planCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  activePlanCard: {
    backgroundColor: '#E8F5E9',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
  },
  description: {
    color: '#666',
    marginTop: 4,
  },
  nutritionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  macroInfo: {
    marginTop: 8,
  },
  chip: {
    height: 28,
  },
  gymChip: {
    backgroundColor: '#3B82F6',
  },
  tagChip: {
    backgroundColor: '#9C27B0',
  },
  activeChip: {
    backgroundColor: BRAND_COLORS.accent,
  },
  sectionTitle: {
    color: BRAND_COLORS.accent,
    marginBottom: 8,
  },
  activeStats: {
    marginTop: 12,
  },
  macroText: {
    color: '#666',
    marginTop: 4,
  },
  logButton: {
    marginTop: 12,
  },
  emptyCard: {
    margin: 16,
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 12,
  },
  dailyTargets: {
    marginBottom: 8,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  thirdInput: {
    flex: 1,
  },
});