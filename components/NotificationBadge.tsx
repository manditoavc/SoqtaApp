import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Bell, X, Clock, CheckCircle, ChefHat } from 'lucide-react';
import { Notification } from '@/types/order';
import { useNotifications } from '@/hooks/orders-store';

interface NotificationBadgeProps {
  station: 'kitchen' | 'grill' | 'cashier';
}

export default function NotificationBadge({ station }: NotificationBadgeProps) {
  const { getNotificationsForStation, getUnreadNotificationsCount, markNotificationAsRead } = useNotifications();
  const [showModal, setShowModal] = React.useState(false);
  
  const notifications = getNotificationsForStation(station);
  const unreadCount = getUnreadNotificationsCount(station);
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new-order': return <ChefHat size={16} color="#2196F3" />;
      case 'kitchen-completed': return <CheckCircle size={16} color="#4CAF50" />;
      case 'grill-completed': return <CheckCircle size={16} color="#9C27B0" />;
      case 'ready-for-pickup': return <Bell size={16} color="#FF9800" />;
      default: return <Clock size={16} color="#666" />;
    }
  };
  
  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'new-order': return '#E3F2FD';
      case 'kitchen-completed': return '#E8F5E8';
      case 'grill-completed': return '#F3E5F5';
      case 'ready-for-pickup': return '#FFF3E0';
      default: return '#F5F5F5';
    }
  };
  
  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  if (unreadCount === 0) {
    return null;
  }
  
  return (
    <>
      <TouchableOpacity 
        style={styles.badge} 
        onPress={() => setShowModal(true)}
      >
        <Bell size={20} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notificaciones</Text>
            <TouchableOpacity 
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.notificationsList}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={48} color="#ccc" />
                <Text style={styles.emptyText}>No hay notificaciones</Text>
              </View>
            ) : (
              notifications.map(notification => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    { backgroundColor: getNotificationColor(notification.type) },
                    !notification.read && styles.unreadNotification
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[
                      styles.notificationMessage,
                      !notification.read && styles.unreadText
                    ]}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTime(notification.timestamp)}
                    </Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF5722',
    borderRadius: 20,
    padding: 8,
    position: 'relative',
  },
  counter: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
});