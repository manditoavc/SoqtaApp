import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { ActivityIndicator, View, Text } from 'react-native';

export default function Index() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={{ marginTop: 16, color: '#666' }}>Cargando...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return <Redirect href="/login" />;
  }

  if (currentUser.role === 'admin') {
    return <Redirect href="/admin-dashboard" />;
  }

  if (currentUser.workArea) {
    return <Redirect href={`/(tabs)/${currentUser.workArea}` as any} />;
  }

  return <Redirect href="/login" />;
}