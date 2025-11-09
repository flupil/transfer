import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { foodApiService } from '../services/foodApiService';

const { width } = Dimensions.get('window');

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (foodData: any) => void;
}

interface FoodProduct {
  barcode: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize: string;
  imageUrl?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  visible,
  onClose,
  onScan,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foodData, setFoodData] = useState<FoodProduct | null>(null);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
    }
  }, [visible]);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);
    setLoading(true);

    try {
      // Use the foodApiService to get food by barcode
      const foodItem = await foodApiService.getFoodByBarcode(data);

      if (foodItem) {
        // Extract nutritional information
        const foodProduct: FoodProduct = {
          barcode: data,
          name: foodItem.name,
          brand: foodItem.brand || 'Unknown Brand',
          calories: Math.round(foodItem.calories),
          protein: Math.round(foodItem.protein),
          carbs: Math.round(foodItem.carbs),
          fat: Math.round(foodItem.fat),
          fiber: foodItem.fiber,
          sugar: foodItem.sugar,
          sodium: foodItem.sodium,
          servingSize: `${foodItem.servingSize}${foodItem.servingUnit || 'g'}`,
          imageUrl: foodItem.imageUrl,
        };

        setFoodData(foodProduct);
      } else {
        // Product not found in database
        Alert.alert(
          'Product Not Found',
          'This product is not in our database. You can add it manually.',
          [
            { text: 'Try Again', onPress: () => setScanned(false) },
            { text: 'Add Manually', onPress: () => handleManualEntry(data) },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch product information. Please try again.');
      console.error('Error fetching product data:', error);
      Alert.alert(
        'Scan Error',
        'Failed to fetch product information. Please try again.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = (barcode: string) => {
    // Navigate to manual food entry with barcode pre-filled
    onScan({
      barcode,
      manual: true,
    });
    resetScanner();
    onClose();
  };

  const confirmFoodItem = () => {
    if (foodData) {
      onScan(foodData);
      resetScanner();
      onClose();
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setFoodData(null);
    setLoading(false);
  };

  if (hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <MaterialCommunityIcons name="camera-off" size={64} color="#999" />
          <Text style={styles.errorText}>Camera permission denied</Text>
          <Text style={styles.errorSubtext}>
            Please enable camera access in your device settings to scan barcodes.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
          barCodeTypes={[
            BarCodeScanner.Constants.BarCodeType.ean13,
            BarCodeScanner.Constants.BarCodeType.ean8,
            BarCodeScanner.Constants.BarCodeType.upc_e,
            BarCodeScanner.Constants.BarCodeType.upc_a,
          ]}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <MaterialCommunityIcons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Barcode</Text>
            <TouchableOpacity
              onPress={() => setTorchOn(!torchOn)}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons
                name={torchOn ? 'flashlight' : 'flashlight-off'}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanArea}>
            <View style={styles.corner1} />
            <View style={styles.corner2} />
            <View style={styles.corner3} />
            <View style={styles.corner4} />
            {!scanned && !loading && (
              <Text style={styles.scanText}>
                Position barcode within the frame
              </Text>
            )}
          </View>

          {/* Manual Entry Button */}
          {!scanned && !loading && (
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => handleManualEntry('')}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="white" />
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          )}

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>Fetching product info...</Text>
            </View>
          )}

          {/* Product Found */}
          {foodData && !loading && (
            <View style={styles.productCard}>
              <Text style={styles.productName}>{foodData.name}</Text>
              <Text style={styles.productBrand}>{foodData.brand}</Text>

              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{foodData.calories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{foodData.protein}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{foodData.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{foodData.fat}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              </View>

              <Text style={styles.servingSize}>Per {foodData.servingSize}</Text>

              <View style={styles.productActions}>
                <TouchableOpacity
                  style={styles.rescanButton}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.rescanButtonText}>Scan Again</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmFoodItem}>
                  <LinearGradient
                    colors={['#4CAF50', '#45B839']}
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>Add to Diary</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scanArea: {
    width: width * 0.8,
    height: width * 0.5,
    alignSelf: 'center',
    marginTop: 60,
    position: 'relative',
  },
  corner1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FF6B35',
  },
  corner2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FF6B35',
  },
  corner3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FF6B35',
  },
  corner4: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FF6B35',
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: '50%',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 40,
    gap: 8,
  },
  manualButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    paddingHorizontal: 40,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 30,
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 24,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    marginTop: 40,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  servingSize: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rescanButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  rescanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  addButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default BarcodeScanner;