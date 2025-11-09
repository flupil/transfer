import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Searchbar,
  List,
  FAB,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  Chip,
  Divider,
  Avatar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSafeDatabase } from '../../database/databaseHelper';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const PlansManagementScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planType, setPlanType] = useState('workout');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'beginner',
    weeks: '',
    daysPerWeek: '',
    tags: '',
  });

  useEffect(() => {
    loadPlans();
  }, [planType]);

  useEffect(() => {
    filterPlans();
  }, [plans, searchQuery]);

  const loadPlans = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      setLoading(true);
      const tableName = planType === 'workout' ? 'workout_plans' : 'meal_plans';
      const result = await db.getAllAsync(
        `SELECT * FROM ${tableName} ORDER BY createdAt DESC`
      );

      setPlans(result);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlans = () => {
    let filtered = plans;

    if (searchQuery) {
      filtered = filtered.filter(plan =>
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPlans(filtered);
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      difficulty: 'beginner',
      weeks: '',
      daysPerWeek: '',
      tags: '',
    });
    setShowModal(true);
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    const tags = plan.tags ? JSON.parse(plan.tags).join(', ') : '';
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      difficulty: plan.difficulty || 'beginner',
      weeks: plan.weeks?.toString() || '',
      daysPerWeek: plan.daysPerWeek?.toString() || '',
      tags,
    });
    setShowModal(true);
  };

  const handleSavePlan = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      if (!formData.name) {
        Alert.alert('Error', 'Plan name is required');
        return;
      }

      const tableName = planType === 'workout' ? 'workout_plans' : 'meal_plans';
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      if (editingPlan) {
        // Update existing plan
        if (planType === 'workout') {
          await db.runAsync(
            `UPDATE workout_plans SET
             name = ?, description = ?, difficulty = ?, weeks = ?, daysPerWeek = ?, tags = ?
             WHERE id = ?`,
            [
              formData.name,
              formData.description,
              formData.difficulty,
              formData.weeks ? parseInt(formData.weeks) : null,
              formData.daysPerWeek ? parseInt(formData.daysPerWeek) : null,
              JSON.stringify(tags),
              editingPlan.id,
            ]
          );
        } else {
          await db.runAsync(
            `UPDATE meal_plans SET
             name = ?, description = ?, tags = ?
             WHERE id = ?`,
            [
              formData.name,
              formData.description,
              JSON.stringify(tags),
              editingPlan.id,
            ]
          );
        }
      } else {
        // Create new plan
        const id = `${planType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        if (planType === 'workout') {
          await db.runAsync(
            `INSERT INTO workout_plans (id, name, description, owner, ownerId, difficulty, weeks, daysPerWeek, tags, workouts, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              formData.name,
              formData.description,
              'admin',
              currentUser?.id || 'admin',
              formData.difficulty,
              formData.weeks ? parseInt(formData.weeks) : null,
              formData.daysPerWeek ? parseInt(formData.daysPerWeek) : null,
              JSON.stringify(tags),
              JSON.stringify([]), // Empty workouts array for now
              now,
            ]
          );
        } else {
          await db.runAsync(
            `INSERT INTO meal_plans (id, name, description, owner, ownerId, tags, targets, days, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              formData.name,
              formData.description,
              'admin',
              currentUser?.id || 'admin',
              JSON.stringify(tags),
              JSON.stringify({ calories: 2000, protein: 150, carbs: 250, fat: 65 }),
              JSON.stringify([]), // Empty days array for now
              now,
            ]
          );
        }
      }

      setShowModal(false);
      loadPlans();
      Alert.alert('Success', editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
    } catch (error) {
      console.error('Failed to save plan:', error);
      Alert.alert('Error', 'Failed to save plan');
    }
  };

  const handleDeletePlan = (plan: any) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getSafeDatabase();
              if (!db) return;

              const tableName = planType === 'workout' ? 'workout_plans' : 'meal_plans';
              await db.runAsync(`DELETE FROM ${tableName} WHERE id = ?`, [plan.id]);
              loadPlans();
              Alert.alert('Success', 'Plan deleted successfully');
            } catch (error) {
              console.error('Failed to delete plan:', error);
              Alert.alert('Error', 'Failed to delete plan');
            }
          },
        },
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getPlanIcon = (type: string) => {
    return type === 'workout' ? 'dumbbell' : 'food-apple';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={planType}
          onValueChange={setPlanType}
          buttons={[
            { value: 'workout', label: 'Workout Plans' },
            { value: 'meal', label: 'Meal Plans' },
          ]}
          style={styles.planTypeToggle}
        />
        <Searchbar
          placeholder={`Search ${planType} plans...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <ScrollView style={styles.plansList}>
        {filteredPlans.map((plan) => (
          <Card key={plan.id} style={styles.planCard}>
            <Card.Content>
              <View style={styles.planHeader}>
                <View style={styles.titleRow}>
                  <MaterialCommunityIcons
                    name={getPlanIcon(planType)}
                    size={24}
                    color="#4CAF50"
                    style={styles.planIcon}
                  />
                  <View style={styles.titleContainer}>
                    <Text variant="titleMedium" style={styles.planTitle}>
                      {plan.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.planOwner}>
                      by {plan.owner}
                    </Text>
                  </View>
                  <View style={styles.planActions}>
                    <TouchableOpacity
                      onPress={() => handleEditPlan(plan)}
                      style={styles.actionButton}
                    >
                      <MaterialCommunityIcons name="pencil" size={20} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePlan(plan)}
                      style={styles.actionButton}
                    >
                      <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>

                {plan.description && (
                  <Text variant="bodyMedium" style={styles.planDescription}>
                    {plan.description}
                  </Text>
                )}

                <View style={styles.planMeta}>
                  {planType === 'workout' && (
                    <>
                      {plan.difficulty && (
                        <Chip
                          mode="outlined"
                          textStyle={{ fontSize: 12 }}
                          style={[styles.chip, { borderColor: getDifficultyColor(plan.difficulty) }]}
                        >
                          {plan.difficulty}
                        </Chip>
                      )}
                      {plan.weeks && (
                        <Chip mode="outlined" textStyle={{ fontSize: 12 }} style={styles.chip}>
                          {plan.weeks} weeks
                        </Chip>
                      )}
                      {plan.daysPerWeek && (
                        <Chip mode="outlined" textStyle={{ fontSize: 12 }} style={styles.chip}>
                          {plan.daysPerWeek} days/week
                        </Chip>
                      )}
                    </>
                  )}

                  {plan.tags && JSON.parse(plan.tags).length > 0 && (
                    JSON.parse(plan.tags).slice(0, 3).map((tag: string, index: number) => (
                      <Chip
                        key={index}
                        mode="outlined"
                        textStyle={{ fontSize: 12 }}
                        style={styles.chip}
                      >
                        {tag}
                      </Chip>
                    ))
                  )}
                </View>

                <Divider style={styles.divider} />

                <View style={styles.planFooter}>
                  <Text variant="bodySmall" style={styles.dateText}>
                    Created {format(new Date(plan.createdAt), 'MMM dd, yyyy')}
                  </Text>
                  {plan.assignedUserIds && JSON.parse(plan.assignedUserIds).length > 0 && (
                    <Text variant="bodySmall" style={styles.assignedText}>
                      {JSON.parse(plan.assignedUserIds).length} users assigned
                    </Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}

        {filteredPlans.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name={getPlanIcon(planType)}
              size={80}
              color="#ccc"
            />
            <Text variant="titleMedium" style={styles.emptyText}>
              No {planType} plans found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Create your first {planType} plan to get started
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreatePlan}
      />

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>
            {editingPlan ? `Edit ${planType} Plan` : `Create ${planType} Plan`}
          </Text>

          <TextInput
            label="Plan Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
          />

          <TextInput
            label="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          {planType === 'workout' && (
            <>
              <Text variant="labelMedium" style={styles.sectionLabel}>Difficulty</Text>
              <SegmentedButtons
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                buttons={[
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' },
                ]}
                style={styles.input}
              />

              <View style={styles.row}>
                <TextInput
                  label="Weeks"
                  value={formData.weeks}
                  onChangeText={(text) => setFormData({ ...formData, weeks: text })}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfWidth]}
                />
                <TextInput
                  label="Days per Week"
                  value={formData.daysPerWeek}
                  onChangeText={(text) => setFormData({ ...formData, daysPerWeek: text })}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfWidth]}
                />
              </View>
            </>
          )}

          <TextInput
            label="Tags (comma separated)"
            value={formData.tags}
            onChangeText={(text) => setFormData({ ...formData, tags: text })}
            placeholder="strength, muscle-building, beginner"
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSavePlan}>
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  planTypeToggle: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 8,
  },
  plansList: {
    flex: 1,
    padding: 16,
  },
  planCard: {
    marginBottom: 12,
  },
  planHeader: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  planTitle: {
    fontWeight: '600',
  },
  planOwner: {
    color: '#666',
    marginTop: 2,
  },
  planActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  planDescription: {
    lineHeight: 20,
    marginBottom: 12,
    color: '#666',
  },
  planMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    height: 28,
  },
  divider: {
    marginVertical: 8,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: '#666',
  },
  assignedText: {
    color: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16,
  },
});

export default PlansManagementScreen;