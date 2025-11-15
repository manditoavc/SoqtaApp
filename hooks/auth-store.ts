import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { User, CheckInRecord, WorkArea, AttendanceType } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const INITIAL_USERS: User[] = [
  {
    id: 'admin1',
    username: 'Soqta6',
    password: 'Soqta2025',
    role: 'admin',
    createdAt: new Date()
  },
  {
    id: 'emp1',
    username: 'Nano',
    password: 'Nano2025',
    role: 'employee',
    workArea: 'cashier',
    createdAt: new Date()
  },
  {
    id: 'emp2',
    username: 'Lorena',
    password: 'Lorena2025',
    role: 'employee',
    workArea: 'kitchen',
    createdAt: new Date()
  },
  {
    id: 'emp3',
    username: 'Cristian',
    password: 'Cristian2025',
    role: 'employee',
    workArea: 'grill',
    createdAt: new Date()
  },
  {
    id: 'emp4',
    username: 'Diana',
    password: 'Diana2025',
    role: 'employee',
    workArea: 'cashier',
    createdAt: new Date()
  },
  {
    id: 'emp5',
    username: 'Armando',
    password: 'Armando2025',
    role: 'employee',
    workArea: 'kitchen',
    createdAt: new Date()
  }
];

const ADMIN_LOCATION = {
  latitude: -19.053194222424555,
  longitude: -65.2522616224834
};

const MAX_DISTANCE_METERS = 50;

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('users');
      const storedCheckIns = await AsyncStorage.getItem('checkInRecords');
      const storedCurrentUser = await AsyncStorage.getItem('currentUser');

      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        const usersWithDates = parsedUsers.map((u: User) => ({
          ...u,
          createdAt: new Date(u.createdAt)
        }));
        setUsers(usersWithDates);
      } else {
        await AsyncStorage.setItem('users', JSON.stringify(INITIAL_USERS));
      }

      if (storedCheckIns) {
        const parsedCheckIns = JSON.parse(storedCheckIns);
        const checkInsWithDates = parsedCheckIns.map((c: CheckInRecord) => ({
          ...c,
          timestamp: new Date(c.timestamp)
        }));
        setCheckInRecords(checkInsWithDates);
      }

      if (storedCurrentUser) {
        const parsedUser = JSON.parse(storedCurrentUser);
        const userWithDate = {
          ...parsedUser,
          createdAt: new Date(parsedUser.createdAt)
        };
        setCurrentUser(userWithDate);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string, selectedArea?: WorkArea): Promise<boolean> => {
    try {
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        const userWithArea = user.role === 'employee' && selectedArea 
          ? { ...user, workArea: selectedArea }
          : user;
        
        setCurrentUser(userWithArea);
        await AsyncStorage.setItem('currentUser', JSON.stringify(userWithArea));
        console.log(`Usuario ${username} ha iniciado sesión${selectedArea ? ` en ${selectedArea}` : ''}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  }, [users]);

  const logout = useCallback(async () => {
    try {
      console.log('Cerrando sesión...');
      setCurrentUser(null);
      await AsyncStorage.removeItem('currentUser');
      console.log('Usuario ha cerrado sesión exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }, []);

  const updatePassword = useCallback(async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, password: newPassword } : user
      );
      
      setUsers(updatedUsers);
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));

      if (currentUser?.id === userId) {
        const updatedCurrentUser = { ...currentUser, password: newPassword };
        setCurrentUser(updatedCurrentUser);
        await AsyncStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
      }

      console.log('Contraseña actualizada exitosamente');
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }, [users, currentUser]);

  const updateWorkArea = useCallback(async (userId: string, workArea: WorkArea): Promise<boolean> => {
    try {
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, workArea } : user
      );
      
      setUsers(updatedUsers);
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));

      if (currentUser?.id === userId) {
        const updatedCurrentUser = { ...currentUser, workArea };
        setCurrentUser(updatedCurrentUser);
        await AsyncStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
      }

      console.log(`Área de trabajo actualizada a: ${workArea}`);
      return true;
    } catch (error) {
      console.error('Error updating work area:', error);
      return false;
    }
  }, [users, currentUser]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const checkIn = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser) {
        console.warn('Intento de check-in sin usuario autenticado');
        return { success: false, message: 'No hay usuario autenticado' };
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return { success: false, message: 'Permiso de ubicación denegado' };
      }

      const location = await Location.getCurrentPositionAsync({});
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        ADMIN_LOCATION.latitude,
        ADMIN_LOCATION.longitude
      );

      if (distance > MAX_DISTANCE_METERS) {
        return { 
          success: false, 
          message: `Estás demasiado lejos del lugar de trabajo (${Math.round(distance)}m de distancia)` 
        };
      }

      const newCheckIn: CheckInRecord = {
        id: Date.now().toString(),
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: new Date(),
        type: 'check-in',
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      };

      const updatedRecords = [newCheckIn, ...checkInRecords];
      setCheckInRecords(updatedRecords);
      await AsyncStorage.setItem('checkInRecords', JSON.stringify(updatedRecords));

      console.log(`Check-in exitoso: ${currentUser.username} a las ${new Date().toLocaleTimeString()}`);
      return { success: true, message: 'Check-in exitoso' };
    } catch (error) {
      console.error('Error during check-in:', error);
      return { success: false, message: 'Error al realizar el check-in' };
    }
  }, [currentUser, checkInRecords]);

  const getTodayCheckIns = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return checkInRecords.filter(record => {
      const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
      return recordDate === today;
    });
  }, [checkInRecords]);

  const getAllCheckIns = useCallback(() => {
    return checkInRecords;
  }, [checkInRecords]);

  const checkOut = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser) {
        console.warn('Intento de check-out sin usuario autenticado');
        return { success: false, message: 'No hay usuario autenticado' };
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return { success: false, message: 'Permiso de ubicación denegado' };
      }

      const location = await Location.getCurrentPositionAsync({});
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        ADMIN_LOCATION.latitude,
        ADMIN_LOCATION.longitude
      );

      if (distance > MAX_DISTANCE_METERS) {
        return { 
          success: false, 
          message: `Estás demasiado lejos del lugar de trabajo (${Math.round(distance)}m de distancia)` 
        };
      }

      const newCheckOut: CheckInRecord = {
        id: Date.now().toString(),
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: new Date(),
        type: 'check-out',
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      };

      const updatedRecords = [newCheckOut, ...checkInRecords];
      setCheckInRecords(updatedRecords);
      await AsyncStorage.setItem('checkInRecords', JSON.stringify(updatedRecords));

      console.log(`Check-out exitoso: ${currentUser.username} a las ${new Date().toLocaleTimeString()}`);
      return { success: true, message: 'Check-out exitoso' };
    } catch (error) {
      console.error('Error during check-out:', error);
      return { success: false, message: 'Error al realizar el check-out' };
    }
  }, [currentUser, checkInRecords]);

  const hasCheckedInToday = useCallback((type: AttendanceType) => {
    if (!currentUser) return false;
    const today = new Date().toISOString().split('T')[0];
    return checkInRecords.some(record => {
      const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
      return record.userId === currentUser.id && 
             recordDate === today && 
             record.type === type;
    });
  }, [currentUser, checkInRecords]);

  const checkLocationProximity = useCallback(async (): Promise<{ isNear: boolean; distance?: number; error?: string }> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return { isNear: false, error: 'Permiso de ubicación denegado' };
      }

      const location = await Location.getCurrentPositionAsync({});
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        ADMIN_LOCATION.latitude,
        ADMIN_LOCATION.longitude
      );

      const isNear = distance <= MAX_DISTANCE_METERS;
      console.log(`Distancia al local: ${Math.round(distance)}m - ${isNear ? 'CERCA' : 'LEJOS'}`);
      
      return { isNear, distance: Math.round(distance) };
    } catch (error) {
      console.error('Error checking location proximity:', error);
      return { isNear: false, error: 'Error al obtener ubicación' };
    }
  }, []);

  return useMemo(() => ({
    currentUser,
    users,
    checkInRecords,
    isLoading,
    login,
    logout,
    updatePassword,
    updateWorkArea,
    checkIn,
    checkOut,
    hasCheckedInToday,
    getTodayCheckIns,
    getAllCheckIns,
    checkLocationProximity
  }), [currentUser, users, checkInRecords, isLoading, login, logout, updatePassword, updateWorkArea, checkIn, checkOut, hasCheckedInToday, getTodayCheckIns, getAllCheckIns, checkLocationProximity]);
});
