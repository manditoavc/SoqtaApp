import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/hooks/auth-store';
import { useInventory } from '@/hooks/inventory-store';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Settings, 
  Clock, 
  LogOut, 
  FileText,
  ShoppingCart,
  Package,
  AlertTriangle,
  Utensils,
  Calculator,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const { getLowStockItems } = useInventory();
  const insets = useSafeAreaInsets();
  
  const lowStockItems = getLowStockItems();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      icon: Utensils,
      title: 'Gestionar Productos',
      description: 'Crear, editar y eliminar productos del menú',
      color: '#4CAF50',
      onPress: () => router.push('/manage-products')
    },
    {
      icon: FileText,
      title: 'Reporte de Ventas',
      description: 'Ver y exportar ventas',
      color: '#2196F3',
      onPress: () => router.push('/sales-report')
    },
    {
      icon: ShoppingCart,
      title: 'Registro de Compras',
      description: 'Ver y exportar compras',
      color: '#FF9800',
      onPress: () => router.push('/purchases')
    },
    {
      icon: Package,
      title: 'Inventario',
      description: 'Gestionar stock de productos',
      color: '#f44336',
      onPress: () => router.push('/inventory'),
      badge: lowStockItems.length > 0 ? lowStockItems.length : undefined
    },
    {
      icon: Clock,
      title: 'Registros de Asistencia',
      description: 'Ver check-ins de empleados',
      color: '#9C27B0',
      onPress: () => router.push('/attendance')
    },
    {
      icon: FileSpreadsheet,
      title: 'Planilla de Costos',
      description: 'Calcular costos y márgenes',
      color: '#009688',
      onPress: () => router.push('/cost-sheet')
    },
    {
      icon: Settings,
      title: 'Configuración',
      description: 'Ajustes de la cuenta',
      color: '#607D8B',
      onPress: () => router.push('/profile')
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Panel de Administrador</Text>
          <Text style={styles.headerSubtitle}>Bienvenido, {currentUser?.username}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {lowStockItems.length > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertContent}>
              <AlertTriangle size={20} color="#fff" />
              <Text style={styles.alertText}>
                {lowStockItems.length} producto{lowStockItems.length > 1 ? 's' : ''} con stock bajo
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.alertButton}
              onPress={() => router.push('/inventory')}
            >
              <Text style={styles.alertButtonText}>Ver</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={item.onPress}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <item.icon size={32} color="#fff" />
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    backgroundColor: '#1976D2',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  menuGrid: {
    gap: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
  alertBanner: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  alertText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  alertButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '700' as const,
  },
});
