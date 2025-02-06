import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  useSharedValue,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.8;
const CENTER_BUTTON_SIZE = 60;

interface WheelItem {
  id: string;
  text: string;
  color: string;
}

const COLORS = [
  '#7C3AED',
  '#4F46E5',
  '#0EA5E9',
  '#3730A3',
  '#8B5CF6',
  '#6D28D9',
  '#4C1D95',
  '#3730A3',
];

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function App() {
  const [items, setItems] = useState<WheelItem[]>([
    { id: '1', text: 'Seçenek 1', color: '#FF0000' },
    { id: '2', text: 'Seçenek 2', color: '#FF69B4' },
    { id: '3', text: 'Seçenek 3', color: '#FF1493' },
    { id: '4', text: 'Seçenek 4', color: '#8A2BE2' },
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const rotation = useSharedValue(0);
  const confettiAnimation = useRef<LottieView>(null);

  const wheelStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const spinWheel = () => {
    if (isSpinning || items.length < 2) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSpinning(true);

    const minSpins = 8;
    const maxSpins = 12;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const additionalDegrees = Math.floor(Math.random() * 360);
    const totalDegrees = spins * 360 + additionalDegrees;

    rotation.value = withTiming(
      totalDegrees,
      {
        duration: 5000,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      },
      () => {
        setIsSpinning(false);
        setShowConfetti(true);
        confettiAnimation.current?.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
      }
    );
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;

    const newItem: WheelItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      color: COLORS[items.length % COLORS.length],
    };

    setItems([...items, newItem]);
    setNewItemText('');
    setShowAddModal(false);
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 2) {
      Alert.alert('Uyarı', 'En az 2 seçenek bulunmalıdır!');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const calculateSliceStyles = (index: number, total: number) => {
    const angle = 360 / total;
    const startAngle = index * angle;
    const endAngle = startAngle + angle;
    
    const centerX = 50;
    const centerY = 50;
    const radius = 50;

    const startX = centerX + radius * Math.cos((Math.PI * startAngle) / 180);
    const startY = centerY - radius * Math.sin((Math.PI * startAngle) / 180);
    const endX = centerX + radius * Math.cos((Math.PI * endAngle) / 180);
    const endY = centerY - radius * Math.sin((Math.PI * endAngle) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${endX} ${endY} Z`;
  };

  const calculateTextPosition = (index: number, total: number) => {
    const sliceAngle = 360 / total;
    const midAngle = ((index * sliceAngle) + (sliceAngle / 2)) * (Math.PI / 180);
    const radius = 32;
    
    const x = 50 + (radius * Math.cos(midAngle));
    const y = 50 + (radius * Math.sin(midAngle));
    
    const rotation = (index * sliceAngle) + (sliceAngle / 2);
    const adjustedRotation = rotation > 180 ? rotation - 180 : rotation;
    
    return {
      x,
      y,
      rotation: adjustedRotation - 90
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Şans Çarkı</Text>
      <Text style={styles.subtitle}>Çarkı çevir ve şansını dene!</Text>

      <View style={styles.wheelContainer}>
        <AnimatedSvg
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          viewBox="0 0 100 100"
          style={[styles.wheel, wheelStyle]}
        >
          <Circle cx="50" cy="50" r="48" fill="#5B21B6" stroke="#8B5CF6" strokeWidth="4"/>
          <G>
            {items.map((item, index) => (
              <Path
                key={`slice-${item.id}`}
                d={calculateSliceStyles(index, items.length)}
                fill={item.color}
                stroke="#fff"
                strokeWidth="0.5"
              />
            ))}
          </G>
          <G>
            {items.map((item, index) => {
              const textPos = calculateTextPosition(index, items.length);
              return (
                <SvgText
                  key={`text-${item.id}`}
                  x={textPos.x}
                  y={textPos.y}
                  fill="white"
                  fontSize="6"
                  fontWeight="bold"
                  textAnchor="middle"
                  rotation={textPos.rotation}
                  origin={`${textPos.x}, ${textPos.y}`}
                >
                  {item.text}
                </SvgText>
              );
            })}
          </G>
        </AnimatedSvg>

        <View style={styles.pointer} />

        {!isSpinning && (
          <TouchableOpacity
            style={styles.centerButton}
            onPress={spinWheel}
            activeOpacity={0.8}
          >
            <MaterialIcons name="play-arrow" size={36} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={styles.buttonText}>Yeni Ekle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => setShowDeleteModal(true)}
        >
          <MaterialIcons name="delete" size={24} color="white" />
          <Text style={styles.buttonText}>Sil</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Seçenek Ekle</Text>
            <TextInput
              style={styles.input}
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder="Seçenek yazın..."
              placeholderTextColor="#666"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddItem}
              >
                <Text style={styles.buttonText}>Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.buttonText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seçenekleri Sil</Text>
            <ScrollView style={styles.deleteList}>
              {items.map(item => (
                <View key={item.id} style={styles.deleteItem}>
                  <Text style={styles.deleteItemText}>{item.text}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.id)}
                    style={styles.deleteItemButton}
                  >
                    <MaterialIcons name="delete" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.buttonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showConfetti && (
        <LottieView
          ref={confettiAnimation}
          source={require('./assets/confetti.json')}
          style={styles.confetti}
          autoPlay
          loop={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 30,
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheel: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pointer: {
    position: 'absolute',
    top: -20,
    width: 20,
    height: 40,
    backgroundColor: '#333',
    transform: [{ rotate: '180deg' }],
    zIndex: 1,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  centerButton: {
    position: 'absolute',
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 3,
    borderColor: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  addButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  deleteList: {
    maxHeight: 300,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  deleteItemText: {
    fontSize: 16,
  },
  deleteItemButton: {
    padding: 8,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});