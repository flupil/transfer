import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';

type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

interface SnackbarMessage {
  message: string;
  severity: SnackbarSeverity;
  id: number;
}

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
};

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<SnackbarMessage[]>([]);
  const [visible, setVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<SnackbarMessage | null>(null);

  const processQueue = useCallback(() => {
    if (queue.length > 0 && !visible) {
      const nextMessage = queue[0];
      setCurrentMessage(nextMessage);
      setVisible(true);
      setQueue(prev => prev.slice(1));
    }
  }, [queue, visible]);

  React.useEffect(() => {
    processQueue();
  }, [processQueue]);

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity = 'info') => {
    const newMessage: SnackbarMessage = {
      message,
      severity,
      id: Date.now(),
    };
    setQueue(prev => [...prev, newMessage]);
  }, []);

  const showSuccess = useCallback((message: string) => {
    showSnackbar(message, 'success');
  }, [showSnackbar]);

  const showError = useCallback((message: string) => {
    showSnackbar(message, 'error');
  }, [showSnackbar]);

  const showInfo = useCallback((message: string) => {
    showSnackbar(message, 'info');
  }, [showSnackbar]);

  const showWarning = useCallback((message: string) => {
    showSnackbar(message, 'warning');
  }, [showSnackbar]);

  const onDismiss = () => {
    setVisible(false);
    setCurrentMessage(null);
    // Process next message after a short delay
    setTimeout(() => {
      processQueue();
    }, 100);
  };

  const getBackgroundColor = () => {
    switch (currentMessage?.severity) {
      case 'success':
        return '#E94E1B';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#E94E1B';
      case 'info':
      default:
        return '#3B82F6';
    }
  };

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: onDismiss,
        }}
        style={[
          styles.snackbar,
          { backgroundColor: getBackgroundColor() }
        ]}
      >
        {currentMessage?.message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 80, // Above bottom navigation
  },
});
