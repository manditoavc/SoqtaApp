import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ChefHat } from 'lucide-react';
import { useOrders } from '@/hooks/orders-store';
import OrderCard from '@/components/OrderCard';
import NotificationBadge from '@/components/NotificationBadge';
import AttendanceButton from '@/components/AttendanceButton';

export default function KitchenScreen() {
  const { getKitchenOrders, updateOrderStatus, startOrder, finishOrder } = useOrders();
  const orders = getKitchenOrders();

  // Pedidos que pueden iniciar en cocina
  const pendingOrders = orders.filter(order => 
    (order.status === 'pending' || order.status === 'grill-started') && !order.kitchenStarted
  );
  
  // Pedidos que están siendo preparados en cocina
  const kitchenStartedOrders = orders.filter(order => 
    order.kitchenStarted && !order.kitchenCompleted
  );
  
  // Pedidos terminados en cocina pero esperando plancha
  const kitchenCompletedOrders = orders.filter(order => 
    order.kitchenCompleted && !order.grillCompleted
  );
  
  // Pedidos completamente listos
  const readyOrders = orders.filter(order => 
    order.status === 'ready-for-pickup'
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ChefHat size={32} color="#2196F3" />
          <Text style={styles.title}>Estación de Cocina</Text>
        </View>
        <NotificationBadge station="kitchen" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <AttendanceButton />
        {pendingOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedidos Pendientes ({pendingOrders.length})</Text>
            {pendingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={updateOrderStatus}
                onStartOrder={startOrder}
                onFinishOrder={finishOrder}
                station="kitchen"
              />
            ))}
          </View>
        )}

        {kitchenStartedOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 En Preparación - Cocina ({kitchenStartedOrders.length})</Text>
            {kitchenStartedOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={updateOrderStatus}
                onStartOrder={startOrder}
                onFinishOrder={finishOrder}
                station="kitchen"
              />
            ))}
          </View>
        )}
        
        {kitchenCompletedOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.completedTitle]}>✅ Terminados en Cocina - Esperando Plancha ({kitchenCompletedOrders.length})</Text>
            {kitchenCompletedOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={updateOrderStatus}
                onStartOrder={startOrder}
                onFinishOrder={finishOrder}
                showActions={false}
                station="kitchen"
              />
            ))}
          </View>
        )}
        
        {readyOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.readyTitle]}>¡LISTOS PARA RECOGER! ({readyOrders.length})</Text>
            {readyOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={updateOrderStatus}
                onStartOrder={startOrder}
                onFinishOrder={finishOrder}
                showActions={false}
              />
            ))}
          </View>
        )}

        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <ChefHat size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay pedidos pendientes</Text>
            <Text style={styles.emptySubtext}>Los nuevos pedidos aparecerán aquí</Text>
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
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  readyTitle: {
    color: '#FF5722',
    fontWeight: '800',
  },
  completedTitle: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  bothCompletedTitle: {
    color: '#2196F3',
    fontWeight: '800',
  },
});