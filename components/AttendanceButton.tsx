import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MapPin, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/auth-store';

export default function AttendanceButton() {
  const { checkLocationProximity, checkIn, checkOut, hasCheckedInToday, currentUser } = useAuth();
  const [isNear, setIsNear] = useState(false);
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [isChecking, setIsChecking] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const hasCheckIn = hasCheckedInToday('check-in');
  const hasCheckOut = hasCheckedInToday('check-out');

  const checkProximity = React.useCallback(async () => {
    const result = await checkLocationProximity();
    setIsNear(result.isNear);
    setDistance(result.distance);
    console.log('Proximidad verificada:', result);
  }, [checkLocationProximity]);

  useEffect(() => {
    checkProximity();
    const interval = setInterval(checkProximity, 30000);
    return () => clearInterval(interval);
  }, [checkProximity]);

  const handleCheckIn = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para marcar asistencia');
      return;
    }
    
    if (hasCheckIn) {
      Alert.alert('Ya Registrado', 'Ya has marcado tu entrada hoy');
      return;
    }
    
    setIsCheckingIn(true);
    try {
      const result = await checkIn();
      if (result.success) {
        Alert.alert('Éxito', '\u2705 Entrada registrada exitosamente');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error durante check-in:', error);
      Alert.alert('Error', 'Error al marcar entrada');
    } finally {
      setIsCheckingIn(false);
    }
  };
  
  const handleCheckOut = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para marcar asistencia');
      return;
    }
    
    if (!hasCheckIn) {
      Alert.alert('Error', 'Debes marcar tu entrada primero');
      return;
    }
    
    if (hasCheckOut) {
      Alert.alert('Ya Registrado', 'Ya has marcado tu salida hoy');
      return;
    }
    
    setIsCheckingOut(true);
    try {
      const result = await checkOut();
      if (result.success) {
        Alert.alert('Éxito', '\u2705 Salida registrada exitosamente');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error durante check-out:', error);
      Alert.alert('Error', 'Error al marcar salida');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleRefreshLocation = async () => {
    setIsChecking(true);
    await checkProximity();
    setIsChecking(false);
  };

  if (!currentUser) {
    return null;
  }
  
  if (!isNear) {
    return (
      <View style={styles.warningContainer}>
        <MapPin size={16} color="#FF9800" />
        <Text style={styles.warningText}>
          {distance !== undefined 
            ? `Estás a ${distance}m del local (requiere ≤50m)` 
            : 'Ubicación no disponible'}
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefreshLocation}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#1976D2" />
          ) : (
            <Text style={styles.refreshButtonText}>Actualizar</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonsRow}>
        <TouchableOpacity 
          style={[
            styles.attendanceButton,
            styles.checkInButton,
            hasCheckIn && styles.buttonDisabled
          ]}
          onPress={handleCheckIn}
          disabled={isCheckingIn || hasCheckIn}
        >
          {isCheckingIn ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <LogIn size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {hasCheckIn ? '✅ Entrada' : 'Marcar Entrada'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.attendanceButton,
            styles.checkOutButton,
            (!hasCheckIn || hasCheckOut) && styles.buttonDisabled
          ]}
          onPress={handleCheckOut}
          disabled={isCheckingOut || !hasCheckIn || hasCheckOut}
        >
          {isCheckingOut ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <LogOut size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {hasCheckOut ? '✅ Salida' : 'Marcar Salida'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.distanceText}>
        📍 A {distance}m del local
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  attendanceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  checkInButton: {
    backgroundColor: '#4CAF50',
  },
  checkOutButton: {
    backgroundColor: '#FF5722',
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center' as const,
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
});
