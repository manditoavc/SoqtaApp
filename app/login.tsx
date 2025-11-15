import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '@/hooks/auth-store';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkArea } from '@/types/user';
import { CaseLower, ChefHat, Flame, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const { login, currentUser, checkIn, isLoading, users } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showAreaSelection, setShowAreaSelection] = useState(false);
  const [selectedArea, setSelectedArea] = useState<WorkArea>('cashier');
  const [authenticatedRole, setAuthenticatedRole] = useState<'admin' | 'employee' | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (currentUser && !isLoading) {
      if (currentUser.role === 'admin') {
        router.replace('/admin-dashboard');
      } else if (currentUser.workArea) {
        router.replace(`/(tabs)/${currentUser.workArea}`);
      }
    }
  }, [currentUser, isLoading]);

  const handleInitialLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    setIsLoggingIn(true);
    console.log('Iniciando login para:', username);

    try {
      const user = users.find(u => u.username === username && u.password === password);
      console.log('Usuario encontrado:', user);

      if (user) {
        if (user.role === 'admin') {
          console.log('Usuario admin detectado');
          const success = await login(username, password);
          if (success) {
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const checkInResult = await checkIn();
            if (checkInResult.success) {
              Alert.alert('Bienvenido', `Check-in exitoso. Bienvenido ${username}!`);
            } else {
              console.warn('Check-in falló:', checkInResult.message);
            }
          }
          setIsLoggingIn(false);
        } else {
          console.log('Usuario empleado detectado, mostrando selección de área');
          setAuthenticatedRole('employee');
          setShowAreaSelection(true);
          setIsLoggingIn(false);
        }
      } else {
        Alert.alert('Error', 'Usuario o contraseña incorrectos');
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Error', 'Error al iniciar sesión');
      setIsLoggingIn(false);
    }
  };

  const handleAreaSelection = async () => {
    setIsLoggingIn(true);
    console.log('Seleccionando área:', selectedArea);
    
    try {
      const success = await login(username, password, selectedArea);
      console.log('Login con área success:', success);
      
      if (success) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const checkInResult = await checkIn();
        console.log('Check-in result:', checkInResult);
        
        if (checkInResult.success) {
          Alert.alert('Bienvenido', `Check-in exitoso. Bienvenido a ${selectedArea === 'cashier' ? 'Caja' : selectedArea === 'kitchen' ? 'Cocina' : 'Plancha'}!`);
        } else {
          console.warn('Check-in falló:', checkInResult.message);
        }
      } else {
        Alert.alert('Error', 'Error al seleccionar área');
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error('Error during area selection:', error);
      Alert.alert('Error', 'Error al seleccionar área');
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  console.log('Estado actual - showAreaSelection:', showAreaSelection, 'authenticatedRole:', authenticatedRole);
  
  if (showAreaSelection && authenticatedRole === 'employee') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pk1qi7hpv0fdgd9blcvqy' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Selecciona tu Área</Text>
            <Text style={styles.subtitle}>Hola, {username}</Text>
          </View>

          <View style={styles.areaSelection}>
            <TouchableOpacity
              style={[
                styles.areaCard,
                selectedArea === 'cashier' && styles.areaCardSelected
              ]}
              onPress={() => setSelectedArea('cashier')}
            >
              <CaseLower size={48} color={selectedArea === 'cashier' ? '#1976D2' : '#666'} />
              <Text style={[
                styles.areaCardTitle,
                selectedArea === 'cashier' && styles.areaCardTitleSelected
              ]}>Caja</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.areaCard,
                selectedArea === 'kitchen' && styles.areaCardSelected
              ]}
              onPress={() => setSelectedArea('kitchen')}
            >
              <ChefHat size={48} color={selectedArea === 'kitchen' ? '#1976D2' : '#666'} />
              <Text style={[
                styles.areaCardTitle,
                selectedArea === 'kitchen' && styles.areaCardTitleSelected
              ]}>Cocina</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.areaCard,
                selectedArea === 'grill' && styles.areaCardSelected
              ]}
              onPress={() => setSelectedArea('grill')}
            >
              <Flame size={48} color={selectedArea === 'grill' ? '#1976D2' : '#666'} />
              <Text style={[
                styles.areaCardTitle,
                selectedArea === 'grill' && styles.areaCardTitleSelected
              ]}>Plancha</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
            onPress={handleAreaSelection}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Continuar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pk1qi7hpv0fdgd9blcvqy' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Restaurante Soqta</Text>
          <Text style={styles.subtitle}>Iniciar Sesión</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!isLoggingIn}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoggingIn}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <Eye size={20} color="#666" />
                ) : (
                  <EyeOff size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
            onPress={handleInitialLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sistema de Gestión de Restaurante</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  areaSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  areaCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  areaCardSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  areaCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  areaCardTitleSelected: {
    color: '#1976D2',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
  },
  loginButton: {
    backgroundColor: '#1976D2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});
