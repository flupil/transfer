import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const NODE_SIZE = 75;

interface WorkoutNode {
  id: string;
  type: 'legs' | 'arms' | 'chest' | 'a' | 'b' | 'star';
  status: 'completed' | 'current' | 'locked';
  position: { x: number; y: number };
  isCheckpoint?: boolean;
}

const WorkoutPathScreen: React.FC = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentUnit, setCurrentUnit] = useState('SECTION 3, UNIT 17');
  const [unitTitle, setUnitTitle] = useState('Give directions, use object pronouns');

  // Generate workout nodes with slight zigzag pattern
  const generatePath = () => {
    const nodes: WorkoutNode[] = [];
    let yPos = 50; // Start from top with padding

    const workoutSequence = [
      { type: 'star', status: 'completed' },
      { type: 'arms', status: 'completed' },
      { type: 'legs', status: 'completed' },
      { type: 'star', status: 'completed' },
      { type: 'star', status: 'current', isCheckpoint: true }, // Current with circle
      { type: 'chest', status: 'locked' },
      { type: 'a', status: 'locked' },
      { type: 'chest', status: 'locked' },
    ];

    workoutSequence.forEach((workout, index) => {
      // Create a gentle wave pattern
      let xOffset = 0;
      if (index % 4 === 1) xOffset = 30;
      else if (index % 4 === 2) xOffset = -30;
      else if (index % 4 === 3) xOffset = 15;

      nodes.push({
        id: `node-${index}`,
        type: workout.type as any,
        status: workout.status as any,
        position: {
          x: width / 2 - NODE_SIZE / 2 + xOffset,
          y: yPos,
        },
        isCheckpoint: workout.isCheckpoint,
      });

      yPos += 120;
    });

    return nodes;
  };

  const [workoutPath] = useState(generatePath());

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'star':
        return <Ionicons name="star" size={40} color="white" />;
      case 'legs':
        return <MaterialCommunityIcons name="run-fast" size={35} color="white" />;
      case 'arms':
        return <MaterialCommunityIcons name="arm-flex" size={35} color="white" />;
      case 'chest':
        return <MaterialCommunityIcons name="weight-lifter" size={35} color="white" />;
      case 'a':
        return <Text style={styles.letterIcon}>A</Text>;
      case 'b':
        return <Text style={styles.letterIcon}>B</Text>;
      default:
        return <Ionicons name="star" size={40} color="white" />;
    }
  };

  const renderNode = (node: WorkoutNode) => {
    const isLocked = node.status === 'locked';
    const isCurrent = node.status === 'current';

    return (
      <TouchableOpacity
        key={node.id}
        style={[
          styles.nodeContainer,
          {
            left: node.position.x,
            top: node.position.y,
          },
        ]}
        activeOpacity={isLocked ? 1 : 0.7}
        onPress={() => !isLocked && navigation.navigate('WorkoutDetail' as never)}
      >
        {isCurrent && node.isCheckpoint && (
          <View style={styles.currentRing} />
        )}

        <LinearGradient
          colors={
            isLocked
              ? ['#5A5A5A', '#3A3A3A']
              : isCurrent
              ? ['#FFB6D9', '#FF6BAD']
              : ['#D8BFD8', '#9370DB']
          }
          style={[
            styles.node,
            isLocked && styles.lockedNode,
          ]}
        >
          {isLocked ? (
            <View style={styles.lockContainer}>
              <MaterialCommunityIcons name="lock" size={30} color="#999" />
            </View>
          ) : (
            getNodeIcon(node.type)
          )}
        </LinearGradient>

        {/* Stars decoration for some nodes */}
        {node.status === 'completed' && (
          <View style={styles.starsContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={20} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Path Container */}
        <View style={styles.pathContainer}>
          {/* Render connecting path lines */}
          {workoutPath.map((node, index) => {
            if (index === 0) return null;
            const prevNode = workoutPath[index - 1];
            const lineHeight = node.position.y - prevNode.position.y;
            const lineX = (node.position.x + prevNode.position.x) / 2 + NODE_SIZE / 2;

            return (
              <View
                key={`line-${index}`}
                style={[
                  styles.pathLine,
                  {
                    left: lineX,
                    top: prevNode.position.y + NODE_SIZE,
                    height: lineHeight - NODE_SIZE,
                    backgroundColor: node.status === 'locked' ? '#444' : '#666',
                  },
                ]}
              />
            );
          })}

          {/* Render workout nodes */}
          {workoutPath.map(renderNode)}

          {/* Decorative elements */}
          <Image
            source={require('../../assets/logotransparent.png')}
            style={[styles.mascot, { top: 200, right: 20 }]}
          />

          {/* Side decorations */}
          <View style={[styles.decoration, { top: 350, left: 30 }]}>
            <Ionicons name="star" size={20} color="#444" />
            <Ionicons name="star" size={16} color="#444" />
            <Ionicons name="star" size={18} color="#444" />
          </View>
        </View>

        {/* Bottom character */}
        <View style={styles.bottomCharacter}>
          <Text style={styles.characterName}>COACH</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  pathContainer: {
    position: 'relative',
    minHeight: height,
    marginTop: 10,
  },
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 3,
    borderBottomWidth: 5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lockedNode: {
    borderColor: 'rgba(0,0,0,0.3)',
  },
  lockContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: '100%',
    height: '100%',
    borderRadius: NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentRing: {
    position: 'absolute',
    width: NODE_SIZE + 20,
    height: NODE_SIZE + 20,
    borderRadius: (NODE_SIZE + 20) / 2,
    borderWidth: 4,
    borderColor: '#4A5568',
    zIndex: -1,
  },
  starsContainer: {
    position: 'absolute',
    bottom: -25,
    flexDirection: 'row',
    gap: 2,
  },
  letterIcon: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  pathLine: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#444',
  },
  mascot: {
    position: 'absolute',
    width: 60,
    height: 60,
    opacity: 0.3,
  },
  decoration: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 5,
  },
  bottomCharacter: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  characterName: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default WorkoutPathScreen;