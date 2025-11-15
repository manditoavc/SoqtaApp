import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Order, OrderItem, DailySales, Notification, PaymentMethod, OrderType } from '@/types/order';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { trpc } from '@/lib/trpc';

export const [OrdersProvider, useOrders] = createContextHook(() => {
  const [notificationSound, setNotificationSound] = useState<Audio.Sound | null>(null);
  
  const ordersQuery = trpc.orders.list.useQuery(undefined, {
    refetchInterval: 2000,
  });
  
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 2000,
  });
  
  const salesQuery = trpc.sales.get.useQuery(undefined, {
    refetchInterval: 5000,
  });
  
  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
      notificationsQuery.refetch();
      salesQuery.refetch();
    },
  });
  
  const updateOrderMutation = trpc.orders.update.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
      notificationsQuery.refetch();
    },
  });
  
  const deleteOrderMutation = trpc.orders.delete.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
    },
  });
  
  const markNotificationMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
    },
  });
  
  const closeSalesMutation = trpc.sales.close.useMutation({
    onSuccess: () => {
      salesQuery.refetch();
    },
  });
  
  const resetSalesMutation = trpc.sales.reset.useMutation({
    onSuccess: () => {
      salesQuery.refetch();
    },
  });
  
  const openSalesMutation = trpc.sales.open.useMutation({
    onSuccess: () => {
      salesQuery.refetch();
    },
  });
  
  const orders = ordersQuery.data || [];
  const notifications = notificationsQuery.data || [];
  const dailySales = salesQuery.data || null;



  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  
  useEffect(() => {
    if (notifications.length > lastNotificationCount && lastNotificationCount > 0) {
      if (Platform.OS === 'web') {
        try {
          const audio = new window.Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
          audio.volume = 0.5;
          audio.play();
        } catch (error) {
          console.log('Error playing web notification sound:', error);
        }
      } else {
        (async () => {
          try {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
            
            const { sound } = await Audio.Sound.createAsync(
              { uri: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' },
              { shouldPlay: true, volume: 0.5 }
            );
            setNotificationSound(sound);
            
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync();
              }
            });
          } catch (error) {
            console.log('Error playing notification sound:', error);
          }
        })();
      }
    }
    setLastNotificationCount(notifications.length);
  }, [notifications.length, lastNotificationCount]);





  const markNotificationAsRead = useCallback((notificationId: string) => {
    markNotificationMutation.mutate({ id: notificationId });
  }, [markNotificationMutation]);

  const addOrder = useCallback((items: OrderItem[], paymentMethod: PaymentMethod, orderType: OrderType, isMemberSale?: boolean, memberName?: string, notes?: string, initialPayment?: number) => {
    const total = items.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
    const paidAmount = initialPayment !== undefined ? initialPayment : total;
    const pendingAmount = total - paidAmount;
    
    const payments: { method: PaymentMethod; amount: number; timestamp: Date }[] = [];
    if (paidAmount > 0) {
      payments.push({
        method: paymentMethod,
        amount: paidAmount,
        timestamp: new Date()
      });
    }
    
    const hasKitchenItems = items.some(item => item.item.category === 'burger' || item.item.category === 'side');
    
    let initialStatus: Order['status'] = 'pending';
    if (!hasKitchenItems) {
      initialStatus = 'ready-for-pickup';
      console.log(`🎉 Pedido es solo bebidas/extras - LISTO para recoger inmediatamente`);
    }
    
    createOrderMutation.mutate({
      items,
      total,
      status: initialStatus,
      kitchenStarted: !hasKitchenItems,
      grillStarted: !hasKitchenItems,
      kitchenCompleted: !hasKitchenItems,
      grillCompleted: !hasKitchenItems,
      paymentMethod,
      orderType,
      isMemberSale,
      memberName,
      notes,
      payments,
      amountPaid: paidAmount,
      amountPending: pendingAmount
    });
  }, [createOrderMutation]);

  const addPaymentToOrder = useCallback((orderId: string, method: PaymentMethod, amount: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const newPayment = { method, amount, timestamp: new Date() };
    const updatedPayments = [...order.payments, newPayment];
    const updatedAmountPaid = order.amountPaid + amount;
    const updatedAmountPending = order.total - updatedAmountPaid;
    
    console.log(`Pago agregado a orden #${order.orderNumber}: ${amount} Bs. vía ${method}`);
    console.log(`Total pagado: ${updatedAmountPaid} Bs. | Pendiente: ${updatedAmountPending} Bs.`);
    
    updateOrderMutation.mutate({
      id: orderId,
      updates: {
        payments: updatedPayments,
        amountPaid: updatedAmountPaid,
        amountPending: updatedAmountPending
      }
    });
  }, [orders, updateOrderMutation]);

  const updateOrderNotes = useCallback((orderId: string, notes: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      console.log(`Notas actualizadas para orden #${order.orderNumber}`);
      updateOrderMutation.mutate({
        id: orderId,
        updates: { notes }
      });
    }
  }, [orders, updateOrderMutation]);

  const updateOrderItems = useCallback((orderId: string, items: OrderItem[]) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const newTotal = items.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
    const updatedAmountPending = newTotal - order.amountPaid;
    
    console.log(`Items actualizados para orden #${order.orderNumber}. Nuevo total: ${newTotal} Bs.`);
    
    updateOrderMutation.mutate({
      id: orderId,
      updates: {
        items,
        total: newTotal,
        amountPending: updatedAmountPending
      }
    });
  }, [orders, updateOrderMutation]);

  const startOrder = useCallback((orderId: string, station: 'kitchen' | 'grill') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (station === 'kitchen') {
      console.log(`🔥 Cocina INICIÓ pedido #${order.orderNumber}`);
      updateOrderMutation.mutate({
        id: orderId,
        updates: {
          kitchenStarted: true,
          status: 'kitchen-started'
        }
      });
    } else if (station === 'grill') {
      console.log(`🔥 Plancha INICIÓ pedido #${order.orderNumber}`);
      updateOrderMutation.mutate({
        id: orderId,
        updates: {
          grillStarted: true,
          status: 'grill-started'
        }
      });
    }
  }, [orders, updateOrderMutation]);

  const finishOrder = useCallback((orderId: string, station: 'kitchen' | 'grill') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (station === 'kitchen') {
      if (!order.grillCompleted) {
        console.log(`❌ Cocina NO PUEDE finalizar pedido #${order.orderNumber} - Plancha debe terminar primero`);
        return;
      }
      
      console.log(`✅ Cocina TERMINÓ pedido #${order.orderNumber}`);
      console.log(`🎉 Pedido #${order.orderNumber} COMPLETAMENTE LISTO - Ambas estaciones terminaron`);
      
      updateOrderMutation.mutate({
        id: orderId,
        updates: {
          kitchenCompleted: true,
          status: 'ready-for-pickup'
        }
      });
    } else if (station === 'grill') {
      console.log(`✅ Plancha TERMINÓ pedido #${order.orderNumber}`);
      
      if (order.kitchenCompleted) {
        console.log(`🎉 Pedido #${order.orderNumber} COMPLETAMENTE LISTO - Ambas estaciones terminaron`);
        updateOrderMutation.mutate({
          id: orderId,
          updates: {
            grillCompleted: true,
            status: 'ready-for-pickup'
          }
        });
      } else {
        console.log(`⏳ Pedido #${order.orderNumber} - Plancha terminó, esperando cocina`);
        updateOrderMutation.mutate({
          id: orderId,
          updates: {
            grillCompleted: true,
            status: 'grill-completed'
          }
        });
      }
    }
  }, [orders, updateOrderMutation]);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status'], station?: Order['station']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (status === 'completed') {
      console.log(`✅ Pedido #${order.orderNumber} entregado y completado`);
      updateOrderMutation.mutate({
        id: orderId,
        updates: { status, station }
      });
      
      setTimeout(() => {
        deleteOrderMutation.mutate({ id: orderId });
      }, 2000);
    } else {
      updateOrderMutation.mutate({
        id: orderId,
        updates: { status, station }
      });
    }
  }, [orders, updateOrderMutation, deleteOrderMutation]);

  const removeOrder = useCallback((orderId: string) => {
    deleteOrderMutation.mutate({ id: orderId });
  }, [deleteOrderMutation]);

  const getPendingOrders = useCallback(() => {
    return orders.filter(order => order.status === 'pending');
  }, [orders]);

  const getKitchenOrders = useCallback(() => {
    return orders.filter(order => 
      order.status === 'pending' ||
      order.status === 'kitchen-started' ||
      order.status === 'grill-started' ||
      order.status === 'kitchen-completed' ||
      order.status === 'grill-completed' ||
      order.status === 'ready-for-pickup'
    );
  }, [orders]);

  const getGrillOrders = useCallback(() => {
    return orders.filter(order => 
      order.status === 'pending' ||
      order.status === 'kitchen-started' ||
      order.status === 'grill-started' ||
      order.status === 'kitchen-completed' ||
      order.status === 'grill-completed' ||
      order.status === 'ready-for-pickup'
    );
  }, [orders]);

  const resetDailySales = useCallback(async () => {
    resetSalesMutation.mutate();
  }, [resetSalesMutation]);

  const startNewDay = useCallback(async () => {
    resetSalesMutation.mutate();
    return true;
  }, [resetSalesMutation]);

  const openDailySales = useCallback(async (openedBy: string) => {
    if (dailySales && !dailySales.isClosed) {
      console.log('La caja ya está abierta');
      return false;
    }

    openSalesMutation.mutate({ openedBy });
    console.log(`Caja abierta por ${openedBy} a las ${new Date().toLocaleTimeString()}`);
    return true;
  }, [dailySales, openSalesMutation]);

  const closeDailySales = useCallback(async (closedBy: string) => {
    if (!dailySales) {
      console.error('No hay ventas para cerrar');
      return false;
    }

    if (dailySales.isClosed) {
      console.error('El día ya está cerrado');
      return false;
    }

    closeSalesMutation.mutate({ closedBy });
    console.log(`Día cerrado por ${closedBy} a las ${new Date().toLocaleTimeString()}`);
    return true;
  }, [dailySales, closeSalesMutation]);

  const getNotificationsForStation = useCallback((station: 'kitchen' | 'grill' | 'cashier') => {
    return notifications.filter(notif => notif.targetStation === station);
  }, [notifications]);

  const getUnreadNotificationsCount = useCallback((station: 'kitchen' | 'grill' | 'cashier') => {
    return notifications.filter(notif => notif.targetStation === station && !notif.read).length;
  }, [notifications]);

  useEffect(() => {
    return () => {
      if (notificationSound) {
        notificationSound.unloadAsync();
      }
    };
  }, [notificationSound]);

  useEffect(() => {
    const checkAutoOpenClose = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      if (hours === 17 && minutes === 0) {
        if (!dailySales || dailySales.isClosed) {
          console.log('🕔 5:00 PM (17:00) - Abriendo caja automáticamente...');
          openSalesMutation.mutate({ openedBy: 'Sistema (Auto)' });
        }
      }
      
      if (hours === 23 && minutes === 59) {
        if (dailySales && !dailySales.isClosed) {
          console.log('🕛 11:59 PM (23:59) - Cerrando caja automáticamente...');
          closeSalesMutation.mutate({ closedBy: 'Sistema (Auto)' });
        }
      }
    };
    
    const interval = setInterval(checkAutoOpenClose, 60000);
    
    checkAutoOpenClose();
    
    return () => clearInterval(interval);
  }, [dailySales, openSalesMutation, closeSalesMutation]);

  return useMemo(() => ({
    orders,
    addOrder,
    updateOrderStatus,
    startOrder,
    finishOrder,
    removeOrder,
    getPendingOrders,
    getKitchenOrders,
    getGrillOrders,
    dailySales,
    startNewDay,
    resetDailySales,
    closeDailySales,
    openDailySales,
    notifications,
    markNotificationAsRead,
    getNotificationsForStation,
    getUnreadNotificationsCount,
    addPaymentToOrder,
    updateOrderNotes,
    updateOrderItems
  }), [orders, addOrder, updateOrderStatus, startOrder, finishOrder, removeOrder, getPendingOrders, getKitchenOrders, getGrillOrders, dailySales, startNewDay, resetDailySales, closeDailySales, openDailySales, notifications, markNotificationAsRead, getNotificationsForStation, getUnreadNotificationsCount, addPaymentToOrder, updateOrderNotes, updateOrderItems]);
});

export const useNotifications = () => {
  const { notifications, getNotificationsForStation, getUnreadNotificationsCount, markNotificationAsRead } = useOrders();
  return { notifications, getNotificationsForStation, getUnreadNotificationsCount, markNotificationAsRead };
};