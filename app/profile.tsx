import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, Lock, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/auth-store';
import { WorkArea } from '@/types/user';

export default function ProfileScreen() {
  const { currentUser, updatePassword, updateWorkArea } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedArea, setSelectedArea] = useState<WorkArea | undefined>(currentUser?.workArea);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa ambos campos de contraseña');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (currentUser) {
      const success = await updatePassword(currentUser.id, newPassword);
      
      if (success) {
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      } else {
        Alert.alert('Error', 'No se pudo actualizar la contraseña');
      }
    }
  };

  const handleUpdateWorkArea = async (area: WorkArea) => {
    if (currentUser && currentUser.role === 'employee') {
      const success = await updateWorkArea(currentUser.id, area);
      
      if (success) {
        setSelectedArea(area);
        Alert.alert('Éxito', `Área de trabajo actualizada a ${getAreaName(area)}`);
      } else {
        Alert.alert('Error', 'No se pudo actualizar el área de trabajo');
      }
    }
  };

  const getAreaName = (area: WorkArea): string => {
    switch (area) {
      case 'cashier': return 'Caja';
      case 'kitchen': return 'Cocina';
      case 'grill': return 'Plancha';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <User size={48} color="#fff" />
          </View>
          <Text style={styles.username}>{currentUser?.username}</Text>
          <Text style={styles.role}>
            {currentUser?.role === 'admin' ? 'Administrador' : 'Empleado'}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#333" />
            <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nueva Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa nueva contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirma la contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePassword}>
            <Text style={styles.updateButtonText}>Actualizar Contraseña</Text>
          </TouchableOpacity>
        </View>

        {currentUser?.role === 'employee' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Briefcase size={20} color="#333" />
              <Text style={styles.sectionTitle}>Área de Trabajo</Text>
            </View>

            <View style={styles.areaOptions}>
              {(['cashier', 'kitchen', 'grill'] as WorkArea[]).map(area => (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.areaOption,
                    selectedArea === area && styles.areaOptionSelected
                  ]}
                  onPress={() => handleUpdateWorkArea(area)}
                >
                  <Text style={[
                    styles.areaOptionText,
                    selectedArea === area && styles.areaOptionTextSelected
                  ]}>
                    {getAreaName(area)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#607D8B',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#607D8B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  updateButton: {
    backgroundColor: '#607D8B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  areaOptions: {
    gap: 12,
  },
  areaOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  areaOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  areaOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  areaOptionTextSelected: {
    color: '#2196F3',
  },
});
