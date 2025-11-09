import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNutrition } from '../contexts/NutritionContext';
import { geminiAIService } from '../services/geminiAIService';
import { freeAIService } from '../services/freeAIService';
import { workoutService } from '../services/workoutService';
import { firebaseDailyDataService } from '../services/firebaseDailyDataService';
import CustomHeader from '../components/CustomHeader';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  actions?: any[];
}

const AIAssistantScreen = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { addWater, addFoodIntake } = useNutrition();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('ai.welcome'),
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Removed quick actions for pure chat experience

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Use local AI only (Gemini is not working)
      console.log('Using local AI for message:', inputText);
      const response = await freeAIService.processMessage(inputText, user?.id);

      console.log('Local AI response:', response);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Error:', error);

      // Final fallback - simple hardcoded response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Hi! I'm here to help with your fitness journey. Ask me about workouts, nutrition, or your progress!",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAIAction = async (action: string, data: any) => {
    switch (action) {
      case 'CREATE_WORKOUT':
        await workoutService.createCustomWorkout(data);
        break;
      case 'LOG_MEAL':
        // Note: Full meal logging requires navigation to food search
        // This action is a placeholder for future implementation
        console.log('Logging meal:', data);
        break;
      case 'SET_GOAL':
        if (user?.id) {
          await firebaseDailyDataService.updateTargets(user.id, data);
        }
        break;
      case 'GET_STATS':
        // Navigate to progress screen or show stats
        break;
      case 'START_WORKOUT':
        // Start a workout session
        console.log('Starting workout:', data);
        break;
      case 'SHOW_EXERCISES':
        // Show exercise library
        console.log('Showing exercises:', data);
        break;
      case 'TRACK_WATER':
        try {
          const amount = data.amount || 250;
          await addWater(amount);
          console.log('Water tracked:', amount);
        } catch (error) {
          console.error('Failed to track water:', error);
        }
        break;
      case 'SET_REMINDER':
        // Set a reminder (would need notification permissions)
        console.log('Setting reminder:', data);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleQuickAction = async (action: any) => {
    setInputText(action.text);
    // Wait for state to update then send
    setTimeout(() => {
      const messageToSend = action.text;
      setInputText('');
      processMessageWithText(messageToSend);
    }, 0);
  };

  const processMessageWithText = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await geminiAIService.processMessage(text, user?.id);

      if (response.actions && response.actions.length > 0) {
        for (const action of response.actions) {
          if (action.type) {
            await handleAIAction(action.type, action);
          }
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t('ai.errorProcessing'),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessage : styles.aiMessage
    ]}>
      {item.sender === 'ai' && (
        <View style={styles.aiAvatar}>
          <Ionicons name="fitness" size={20} color="#FF6B35" />
        </View>
      )}
      <View style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'user' ? styles.userText : styles.aiText
        ]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <View style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
      <CustomHeader />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -20 : -60}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((item) => (
            <View
              key={item.id}
              style={[
                styles.messageContainer,
                item.sender === 'user' ? styles.userMessage : styles.aiMessage
              ]}
            >
              {item.sender === 'ai' && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="fitness" size={20} color="#FF6B35" />
                </View>
              )}
              <View style={[
                styles.messageBubble,
                item.sender === 'user' ? styles.userBubble : styles.aiBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  item.sender === 'user' ? styles.userText : styles.aiText
                ]}>
                  {item.text}
                </Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>{t('ai.thinking')}</Text>
              <ActivityIndicator size="small" color="#FF6B35" />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { maxHeight: 100 }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('ai.placeholder')}
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 20,
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E26',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: '#1E1E26',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#E0E0E0',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#2A2A35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  actionText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '500',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  typingText: {
    color: '#999',
    fontSize: 14,
  },
  quickActionsContainer: {
    maxHeight: 50,
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E26',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    gap: 5,
  },
  quickActionText: {
    color: '#E0E0E0',
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: 90, // Slightly more padding for bottom tab bar
    backgroundColor: '#1A1A22',
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
  },
  input: {
    flex: 1,
    backgroundColor: '#0F0F14',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    marginRight: 10,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default AIAssistantScreen;