import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { CheckCircle, Play, Square, DollarSign, X, Edit3, Trash2, Plus, Minus } from 'lucide-react';
import { Order, PaymentMethod, OrderItem } from '@/types/order';

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, status: Order['status'], station?: Order['station']) => void;
  onStartOrder?: (orderId: string, station: 'kitchen' | 'grill') => void;
  onFinishOrder?: (orderId: string, station: 'kitchen' | 'grill') => void;
  onCompletePayment?: (orderId: string, method: PaymentMethod, amount: number) => void;
  onEditOrder?: (orderId: string, items: OrderItem[]) => void;
  onCancelOrder?: (orderId: string) => void;
  showActions?: boolean;
  station?: 'kitchen' | 'grill';
  showEditOption?: boolean;
}

export default function OrderCard({ order, onStatusChange, onStartOrder, onFinishOrder, onCompletePayment, onEditOrder, onCancelOrder, showActions = true, station, showEditOption = false }: OrderCardProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showMixedPayment, setShowMixedPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [qrAmount, setQrAmount] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'kitchen-started': return '#2196F3';
      case 'grill-started': return '#9C27B0';
      case 'kitchen-completed': return '#4CAF50';
      case 'grill-completed': return '#9C27B0';
      case 'ready-for-pickup': return '#FF5722';
      case 'completed': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'kitchen-started': return '🔥 Cocina Trabajando';
      case 'grill-started': return '🔥 Plancha Trabajando';
      case 'kitchen-completed': return '✅ Cocina Lista';
      case 'grill-completed': return '✅ Plancha Lista';
      case 'ready-for-pickup': return '🔔 Listo para Recoger';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  const handleStartWork = () => {
    if (onStartOrder && station) {
      onStartOrder(order.id, station);
    }
  };

  const handleFinishWork = () => {
    if (onFinishOrder && station) {
      // Validar que cocina no pueda finalizar sin que plancha haya terminado primero
      if (station === 'kitchen' && !order.grillCompleted) {
        Alert.alert(
          'No se puede finalizar',
          'La plancha debe terminar el pedido primero antes de que cocina pueda finalizar.',
          [{ text: 'Entendido', style: 'cancel' }]
        );
        return;
      }
      
      onFinishOrder(order.id, station);
    }
  };

  const canStart = () => {
    if (!station) return false;
    if (station === 'kitchen') {
      return !order.kitchenStarted;
    } else if (station === 'grill') {
      return !order.grillStarted;
    }
    return false;
  };

  const canFinish = () => {
    if (!station) return false;
    if (station === 'kitchen') {
      return order.kitchenStarted && !order.kitchenCompleted;
    } else if (station === 'grill') {
      return order.grillStarted && !order.grillCompleted;
    }
    return false;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleOpenEditModal = () => {
    setEditedItems(JSON.parse(JSON.stringify(order.items)));
    setShowEditModal(true);
  };

  const handleQuantityChange = (index: number, delta: number) => {
    setEditedItems(prev => {
      const newItems = [...prev];
      const newQuantity = newItems[index].quantity + delta;
      
      if (newQuantity <= 0) {
        return newItems.filter((_, i) => i !== index);
      }
      
      newItems[index] = {
        ...newItems[index],
        quantity: newQuantity
      };
      return newItems;
    });
  };

  const handleSaveEdit = () => {
    if (editedItems.length === 0) {
      Alert.alert('Error', '¿Deseas cancelar el pedido completo?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar Pedido',
          style: 'destructive',
          onPress: () => {
            onCancelOrder?.(order.id);
            setShowEditModal(false);
          }
        }
      ]);
      return;
    }
    
    onEditOrder?.(order.id, editedItems);
    setShowEditModal(false);
    Alert.alert('Éxito', 'Pedido actualizado');
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancelar Pedido',
      `¿Estás seguro de cancelar el pedido #${order.orderNumber}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: () => {
            onCancelOrder?.(order.id);
          }
        }
      ]
    );
  };

  const handleCompletePayment = () => {
    if (showMixedPayment) {
      const cash = parseFloat(cashAmount);
      const qr = parseFloat(qrAmount);
      
      if (isNaN(cash) || cash < 0 || isNaN(qr) || qr < 0) {
        Alert.alert('Error', 'Ingresa montos válidos');
        return;
      }
      
      const totalPayment = cash + qr;
      if (totalPayment === 0) {
        Alert.alert('Error', 'Ingresa al menos un monto');
        return;
      }
      
      if (totalPayment > order.amountPending) {
        Alert.alert('Error', `El pago total no puede exceder ${order.amountPending.toFixed(2)} Bs.`);
        return;
      }
      
      if (cash > 0 && onCompletePayment) {
        onCompletePayment(order.id, 'cash', cash);
      }
      if (qr > 0 && onCompletePayment) {
        onCompletePayment(order.id, 'qr', qr);
      }
    } else {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Ingresa un monto válido');
        return;
      }
      
      if (amount > order.amountPending) {
        Alert.alert('Error', `El pago no puede exceder ${order.amountPending.toFixed(2)} Bs.`);
        return;
      }
      
      if (onCompletePayment) {
        onCompletePayment(order.id, paymentMethod, amount);
      }
    }
    
    setShowPaymentModal(false);
    setPaymentAmount('');
    setCashAmount('');
    setQrAmount('');
    setShowMixedPayment(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Orden #{order.orderNumber}</Text>
          <Text style={styles.time}>{formatTime(order.timestamp)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.items}>
        {order.items.map((orderItem, index) => (
          <View key={`${orderItem.item.id}-${index}`} style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemName}>
                {orderItem.quantity}x {orderItem.item.name}
              </Text>
              {orderItem.notes && (
                <Text style={styles.itemNotes}>Nota: {orderItem.notes}</Text>
              )}
            </View>
            <Text style={styles.itemPrice}>
              {(orderItem.item.price * orderItem.quantity)} Bs.
            </Text>
          </View>
        ))}
        {order.notes && (
          <View style={styles.orderNotesContainer}>
            <Text style={styles.orderNotesLabel}>Notas del pedido:</Text>
            <Text style={styles.orderNotes}>{order.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.totalAndStatus}>
          <Text style={styles.total}>Total: {order.total} Bs.</Text>
          {order.amountPending > 0 && (
            <View style={styles.paymentStatus}>
              <Text style={styles.paymentPaid}>Pagado: {order.amountPaid.toFixed(2)} Bs.</Text>
              <Text style={styles.paymentPending}>Pendiente: {order.amountPending.toFixed(2)} Bs.</Text>
            </View>
          )}
          {(order.kitchenStarted || order.grillStarted || order.kitchenCompleted || order.grillCompleted) && (
            <View style={styles.progressContainer}>
              <View style={[
                styles.progressDot, 
                order.kitchenStarted && styles.progressDotStarted,
                order.kitchenCompleted && styles.progressDotCompleted
              ]}>
                <Text style={styles.progressText}>C</Text>
              </View>
              <View style={[
                styles.progressDot, 
                order.grillStarted && styles.progressDotStarted,
                order.grillCompleted && styles.progressDotCompleted
              ]}>
                <Text style={styles.progressText}>P</Text>
              </View>
            </View>
          )}
        </View>
        
        {showActions && canStart() && (
          <TouchableOpacity style={[styles.actionButton, styles.startButton]} onPress={handleStartWork}>
            <Play size={16} color="#fff" />
            <Text style={styles.actionText}>
              {station === 'kitchen' ? 'Iniciar Cocina' : 'Iniciar Plancha'}
            </Text>
          </TouchableOpacity>
        )}

        {showActions && canFinish() && (
          <TouchableOpacity style={[styles.actionButton, styles.finishButton]} onPress={handleFinishWork}>
            <Square size={16} color="#fff" />
            <Text style={styles.actionText}>
              {station === 'kitchen' ? 'Terminar Cocina' : 'Terminar Plancha'}
            </Text>
          </TouchableOpacity>
        )}
        
        {showActions && order.amountPending > 0 && station === undefined && (
          <TouchableOpacity style={[styles.actionButton, styles.paymentButton]} onPress={() => setShowPaymentModal(true)}>
            <DollarSign size={16} color="#fff" />
            <Text style={styles.actionText}>Completar Pago</Text>
          </TouchableOpacity>
        )}
        
        {showActions && order.status === 'ready-for-pickup' && station === undefined && order.amountPending === 0 && (
          <TouchableOpacity style={[styles.actionButton, styles.pickupButton]} onPress={() => onStatusChange?.(order.id, 'completed')}>
            <CheckCircle size={16} color="#fff" />
            <Text style={styles.actionText}>Pedido Entregado</Text>
          </TouchableOpacity>
        )}
        
        {showActions && order.status === 'ready-for-pickup' && station === undefined && order.amountPending > 0 && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>⚠️ Completar pago antes de entregar</Text>
          </View>
        )}
        
        {showEditOption && order.status === 'pending' && station === undefined && (
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleOpenEditModal}>
            <Edit3 size={16} color="#fff" />
            <Text style={styles.actionText}>Modificar</Text>
          </TouchableOpacity>
        )}
        
        {showEditOption && order.status === 'pending' && station === undefined && (
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelOrder}>
            <Trash2 size={16} color="#fff" />
            <Text style={styles.actionText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Completar Pago - Orden #{order.orderNumber}</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.paymentInfoCard}>
                <Text style={styles.paymentInfoLabel}>Total de la Orden:</Text>
                <Text style={styles.paymentInfoValue}>{order.total.toFixed(2)} Bs.</Text>
                
                <Text style={styles.paymentInfoLabel}>Ya Pagado:</Text>
                <Text style={styles.paymentInfoValue}>{order.amountPaid.toFixed(2)} Bs.</Text>
                
                <Text style={styles.paymentInfoLabel}>Pendiente:</Text>
                <Text style={[styles.paymentInfoValue, styles.pendingAmount]}>{order.amountPending.toFixed(2)} Bs.</Text>
              </View>

              <Text style={styles.sectionLabel}>Tipo de Pago</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    !showMixedPayment && styles.optionCardSelected
                  ]}
                  onPress={() => setShowMixedPayment(false)}
                >
                  <Text style={[
                    styles.optionText,
                    !showMixedPayment && styles.optionTextSelected
                  ]}>Pago Simple</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    showMixedPayment && styles.optionCardSelected
                  ]}
                  onPress={() => setShowMixedPayment(true)}
                >
                  <Text style={[
                    styles.optionText,
                    showMixedPayment && styles.optionTextSelected
                  ]}>Pago Mixto</Text>
                </TouchableOpacity>
              </View>

              {!showMixedPayment ? (
                <>
                  <Text style={styles.sectionLabel}>Método de Pago</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.optionCard,
                        paymentMethod === 'cash' && styles.optionCardSelected
                      ]}
                      onPress={() => setPaymentMethod('cash')}
                    >
                      <Text style={[
                        styles.optionText,
                        paymentMethod === 'cash' && styles.optionTextSelected
                      ]}>Efectivo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.optionCard,
                        paymentMethod === 'qr' && styles.optionCardSelected
                      ]}
                      onPress={() => setPaymentMethod('qr')}
                    >
                      <Text style={[
                        styles.optionText,
                        paymentMethod === 'qr' && styles.optionTextSelected
                      ]}>QR</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionLabel}>Monto a Pagar</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`Máximo: ${order.amountPending.toFixed(2)} Bs.`}
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Monto en Efectivo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Monto en efectivo"
                    value={cashAmount}
                    onChangeText={setCashAmount}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />

                  <Text style={styles.sectionLabel}>Monto por QR</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Monto por QR"
                    value={qrAmount}
                    onChangeText={setQrAmount}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />

                  {(cashAmount || qrAmount) && (
                    <View style={styles.mixedPaymentSummary}>
                      <Text style={styles.mixedPaymentLabel}>Total a Pagar:</Text>
                      <Text style={styles.mixedPaymentValue}>
                        {((parseFloat(cashAmount) || 0) + (parseFloat(qrAmount) || 0)).toFixed(2)} Bs.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleCompletePayment}
            >
              <Text style={styles.confirmButtonText}>Confirmar Pago</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modificar Pedido #{order.orderNumber}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionLabel}>Items del Pedido</Text>
              
              {editedItems.map((item, index) => (
                <View key={index} style={styles.editItemCard}>
                  <View style={styles.editItemInfo}>
                    <Text style={styles.editItemName}>{item.item.name}</Text>
                    <Text style={styles.editItemPrice}>{item.item.price} Bs. c/u</Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(index, -1)}
                    >
                      <Minus size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(index, 1)}
                    >
                      <Plus size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.editItemTotal}>
                    {(item.item.price * item.quantity).toFixed(2)} Bs.
                  </Text>
                </View>
              ))}

              {editedItems.length === 0 && (
                <View style={styles.emptyEditState}>
                  <Text style={styles.emptyEditText}>No quedan items en el pedido</Text>
                  <Text style={styles.emptyEditSubtext}>El pedido será cancelado</Text>
                </View>
              )}

              <View style={styles.editTotalCard}>
                <Text style={styles.editTotalLabel}>Nuevo Total:</Text>
                <Text style={styles.editTotalValue}>
                  {editedItems.reduce((sum, item) => sum + (item.item.price * item.quantity), 0).toFixed(2)} Bs.
                </Text>
              </View>

              {order.amountPaid > 0 && (
                <View style={styles.paymentWarning}>
                  <Text style={styles.paymentWarningText}>
                    ⚠️ Monto ya pagado: {order.amountPaid.toFixed(2)} Bs.
                  </Text>
                  <Text style={styles.paymentWarningSubtext}>
                    El pendiente se ajustará automáticamente
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleSaveEdit}
            >
              <Text style={styles.confirmButtonText}>
                {editedItems.length === 0 ? 'Cancelar Pedido' : 'Guardar Cambios'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  time: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  items: {
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  startButton: {
    backgroundColor: '#2196F3',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
  },
  grillButton: {
    backgroundColor: '#9C27B0',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  pickupButton: {
    backgroundColor: '#FF5722',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  totalAndStatus: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotStarted: {
    backgroundColor: '#FF9800',
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  itemLeft: {
    flex: 1,
  },
  itemNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
  orderNotesContainer: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  orderNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  orderNotes: {
    fontSize: 14,
    color: '#E65100',
  },
  paymentStatus: {
    marginTop: 4,
  },
  paymentPaid: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  paymentPending: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  paymentButton: {
    backgroundColor: '#FF9800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  paymentInfoCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  paymentInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  paymentInfoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  pendingAmount: {
    color: '#FF9800',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionTextSelected: {
    color: '#1976D2',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  mixedPaymentSummary: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  mixedPaymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  mixedPaymentValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  warningText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#1976D2',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  editItemCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editItemInfo: {
    flex: 1,
  },
  editItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  editItemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    backgroundColor: '#1976D2',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    minWidth: 30,
    textAlign: 'center' as const,
  },
  editItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    minWidth: 80,
    textAlign: 'right' as const,
  },
  emptyEditState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyEditText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  emptyEditSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  editTotalCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  editTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
  },
  editTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },
  paymentWarning: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  paymentWarningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
  },
  paymentWarningSubtext: {
    fontSize: 12,
    color: '#E65100',
    marginTop: 4,
  },
});