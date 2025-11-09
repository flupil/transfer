import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PlaceholderScreenProps {
  title: string;
  icon?: string;
  description?: string;
}

const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title,
  icon = 'development',
  description = 'This screen is under development'
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon as any} size={80} color="#4CAF50" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default PlaceholderScreen;