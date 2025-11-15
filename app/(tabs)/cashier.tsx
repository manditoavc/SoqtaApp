import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { ShoppingCart, Trash2, BarChart3, Package, X, Check } from 'lucide-react';
import { ALL_MENU_ITEMS, BURGERS, SIDES, DRINKS, EXTRAS } from '@/constants/burgers';
import { useOrders } from '@/hooks/orders-store';
import { OrderItem, PaymentMethod, OrderType } from '@/types/order';
import MenuItemCard from '@/components/BurgerCard';
import OrderCard from '@/components/OrderCard';
import NotificationBadge from '@/components/NotificationBadge';
import AttendanceButton from '@/components/AttendanceButton';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CartItemCustomizations = {
  removeLettuce?: boolean;
  removeTomato?: boolean;
  removeOnion?: boolean;
  removeCheese?: boolean;
  removePickles?: boolean;
};

export default function CashierScreen() {
  const { addOrder, dailySales, orders, updateOrderStatus, addPaymentToOrder, updateOrderItems, removeOrder } = useOrders();
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [cartCustomizations, setCartCustomizations] = useState<{ [itemId: string]: CartItemCustomizations }>({});
  const [selectedCategory, setSelectedCategory] = useState<'burger' | 'drink' | 'extra'>('burger');
  const [showReadyOrders, setShowReadyOrders] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [customizingItemId, setCustomizingItemId] = useState<string | null>(null);
  const [isMemberSale, setIsMemberSale] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [partialPayment, setPartialPayment] = useState('');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [payNow, setPayNow] = useState(true);
  const insets = useSafeAreaInsets();
  
  const readyOrders = useMemo(() => {
    return orders.filter(order => order.status === 'ready-for-pickup');
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter(order => order.status === 'pending');
  }, [orders]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => {
        const item = ALL_MENU_ITEMS.find(i => i.id === itemId)!;
        const customizations = cartCustomizations[itemId];
        return { item, quantity, customizations };
      });
  }, [cart, cartCustomizations]);

  const getMemberPrice = React.useCallback((itemId: string, regularPrice: number): number => {
    const memberPrices: { [key: string]: number } = {
      '1': 8,
      '2': 10,
      '3': 12,
      'd1': 3,
      'd2': 3,
      'd3': 2
    };
    
    if (isMemberSale && memberPrices[itemId]) {
      return memberPrices[itemId];
    }
    return regularPrice;
  }, [isMemberSale]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, cartItem) => {
      const price = getMemberPrice(cartItem.item.id, cartItem.item.price);
      return sum + (price * cartItem.quantity);
    }, 0);
  }, [cartItems, getMemberPrice]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setCart(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  const handleClearCart = () => {
    setCart({});
  };

  const handleOpenCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Agrega al menos un producto al pedido');
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleCreateOrder = () => {
    if (isMemberSale && !memberName.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del socio');
      return;
    }

    let initialPaymentAmount: number | undefined = undefined;
    
    if (!payNow) {
      initialPaymentAmount = 0;
    } else if (isPartialPayment) {
      const parsedPayment = parseFloat(partialPayment);
      if (isNaN(parsedPayment) || parsedPayment <= 0) {
        Alert.alert('Error', 'Ingresa un monto de pago válido');
        return;
      }
      if (parsedPayment > total) {
        Alert.alert('Error', 'El pago no puede ser mayor al total');
        return;
      }
      initialPaymentAmount = parsedPayment;
    } else {
      initialPaymentAmount = total;
    }

    const orderItems: OrderItem[] = cartItems.map(cartItem => ({
      item: cartItem.item,
      quantity: cartItem.quantity,
      customizations: cartItem.customizations
    }));

    addOrder(
      orderItems, 
      paymentMethod, 
      orderType, 
      isMemberSale, 
      isMemberSale ? memberName : undefined,
      orderNotes.trim() || undefined,
      initialPaymentAmount
    );
    
    setCart({});
    setCartCustomizations({});
    setShowCheckoutModal(false);
    setPaymentMethod('cash');
    setOrderType('dine-in');
    setIsMemberSale(false);
    setMemberName('');
    setOrderNotes('');
    setPartialPayment('');
    setIsPartialPayment(false);
    setPayNow(true);
    
    const pendingAmount = total - (initialPaymentAmount || 0);
    const message = initialPaymentAmount === 0
      ? `Pedido por ${total} Bs. creado SIN PAGO. Pagar al entregar.`
      : pendingAmount > 0 
      ? `Pedido por ${total} Bs. creado. Pagado: ${initialPaymentAmount} Bs. | Pendiente: ${pendingAmount} Bs.`
      : `Pedido por ${total} Bs. enviado a cocina y plancha`;
    
    Alert.alert('Pedido Creado', message, [{ text: 'OK' }]);
  };

  const handleCustomizeItem = (itemId: string) => {
    setCustomizingItemId(itemId);
  };

  const toggleCustomization = (key: keyof CartItemCustomizations) => {
    if (!customizingItemId) return;
    
    setCartCustomizations(prev => ({
      ...prev,
      [customizingItemId]: {
        ...prev[customizingItemId],
        [key]: !prev[customizingItemId]?.[key]
      }
    }));
  };

  const getCategoryItems = () => {
    switch (selectedCategory) {
      case 'burger': return BURGERS;
      case 'drink': return DRINKS;
      case 'extra': return EXTRAS;
      default: return BURGERS;
    }
  };

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'burger': return 'Menú';
      case 'drink': return 'Bebidas';
      case 'extra': return 'Extras';
      default: return 'Menú';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Caja - Restaurante</Text>
        <View style={styles.headerActions}>
          {dailySales && (
            <Text style={styles.salesInfo}>
              Ventas: {dailySales.totalRevenue} Bs.
            </Text>
          )}
          {readyOrders.length > 0 && (
            <TouchableOpacity 
              style={styles.readyOrdersButton} 
              onPress={() => setShowReadyOrders(!showReadyOrders)}
            >
              <Package size={20} color="#fff" />
              <Text style={styles.readyOrdersText}>{readyOrders.length}</Text>
            </TouchableOpacity>
          )}
          <NotificationBadge station="cashier" />
          <TouchableOpacity 
            style={styles.salesButton} 
            onPress={() => router.push('/sales-report')}
          >
            <BarChart3 size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {pendingOrders.length > 0 && (
        <View style={styles.pendingOrdersSection}>
          <Text style={styles.pendingOrdersTitle}>Pedidos Pendientes ({pendingOrders.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pendingOrdersList}>
            {pendingOrders.map(order => (
              <View key={order.id} style={styles.pendingOrderCard}>
                <OrderCard
                  order={order}
                  onStatusChange={updateOrderStatus}
                  onCompletePayment={addPaymentToOrder}
                  onEditOrder={updateOrderItems}
                  onCancelOrder={removeOrder}
                  showActions={false}
                  showEditOption={true}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {showReadyOrders && readyOrders.length > 0 && (
        <View style={styles.readyOrdersSection}>
          <Text style={styles.readyOrdersTitle}>Pedidos Listos para Recoger ({readyOrders.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.readyOrdersList}>
            {readyOrders.map(order => (
              <View key={order.id} style={styles.readyOrderCard}>
                <OrderCard
                  order={order}
                  onStatusChange={updateOrderStatus}
                  onCompletePayment={addPaymentToOrder}
                  showActions={true}
                  showEditOption={false}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.categoryTabs}>
        {(['burger', 'drink', 'extra'] as const).map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.categoryTabActive
            ]}
            onPress={() => {
              if (category && ['burger', 'drink', 'extra'].includes(category)) {
                setSelectedCategory(category);
              }
            }}
          >
            <Text style={[
              styles.categoryTabText,
              selectedCategory === category && styles.categoryTabTextActive
            ]}>
              {category === 'burger' ? 'Menú' :
               category === 'drink' ? 'Bebidas' : 'Extras'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.menuSection} showsVerticalScrollIndicator={false}>
        <AttendanceButton />
        <Text style={styles.sectionTitle}>{getCategoryTitle()}</Text>
        
        {getCategoryItems().map(item => (
          <MenuItemCard
            key={item.id}
            item={item}
            quantity={cart[item.id] || 0}
            onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
          />
        ))}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={styles.cartSection}>
          <View style={styles.cartHeader}>
            <View style={styles.cartTitle}>
              <ShoppingCart size={20} color="#333" />
              <Text style={styles.cartTitleText}>Pedido Actual</Text>
            </View>
            <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
              <Trash2 size={18} color="#f44336" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
            {cartItems.map((cartItem) => (
              <View key={`${cartItem.item.id}-${cartItem.quantity}`} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>
                    {cartItem.quantity}x {cartItem.item.name}
                  </Text>
                  {cartItem.item.category === 'burger' && (
                    <TouchableOpacity 
                      style={styles.customizeButton}
                      onPress={() => handleCustomizeItem(cartItem.item.id)}
                    >
                      <Text style={styles.customizeButtonText}>Personalizar</Text>
                    </TouchableOpacity>
                  )}
                  {cartItem.customizations && Object.values(cartItem.customizations).some(v => v) && (
                    <Text style={styles.customizationsText}>
                      Sin: {Object.entries(cartItem.customizations)
                        .filter(([_, v]) => v)
                        .map(([k]) => {
                          const labels: Record<string, string> = {
                            removeLettuce: 'Lechuga',
                            removeTomato: 'Tomate',
                            removeOnion: 'Cebolla',
                            removeCheese: 'Queso',
                            removePickles: 'Pepinillos'
                          };
                          return labels[k];
                        })
                        .join(', ')}
                    </Text>
                  )}
                </View>
                <View style={styles.cartItemPriceContainer}>
                  {isMemberSale && getMemberPrice(cartItem.item.id, cartItem.item.price) !== cartItem.item.price ? (
                    <>
                      <Text style={styles.cartItemPriceOriginal}>
                        {(cartItem.item.price * cartItem.quantity)} Bs.
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        {(getMemberPrice(cartItem.item.id, cartItem.item.price) * cartItem.quantity)} Bs.
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.cartItemPrice}>
                      {(cartItem.item.price * cartItem.quantity)} Bs.
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.cartFooter}>
            <Text style={styles.totalText}>Total: {total} Bs.</Text>
            <TouchableOpacity style={styles.orderButton} onPress={handleOpenCheckout}>
              <Text style={styles.orderButtonText}>Proceder al Pago</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Modal
        visible={showCheckoutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCheckoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Finalizar Pedido</Text>
              <TouchableOpacity onPress={() => setShowCheckoutModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
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

              <Text style={styles.sectionLabel}>Tipo de Pedido</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    orderType === 'dine-in' && styles.optionCardSelected
                  ]}
                  onPress={() => setOrderType('dine-in')}
                >
                  <Text style={[
                    styles.optionText,
                    orderType === 'dine-in' && styles.optionTextSelected
                  ]}>Para Comer Aquí</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    orderType === 'takeout' && styles.optionCardSelected
                  ]}
                  onPress={() => setOrderType('takeout')}
                >
                  <Text style={[
                    styles.optionText,
                    orderType === 'takeout' && styles.optionTextSelected
                  ]}>Para Llevar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Tipo de Cliente</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    !isMemberSale && styles.optionCardSelected
                  ]}
                  onPress={() => setIsMemberSale(false)}
                >
                  <Text style={[
                    styles.optionText,
                    !isMemberSale && styles.optionTextSelected
                  ]}>Normal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    isMemberSale && styles.optionCardSelected
                  ]}
                  onPress={() => setIsMemberSale(true)}
                >
                  <Text style={[
                    styles.optionText,
                    isMemberSale && styles.optionTextSelected
                  ]}>Socio</Text>
                </TouchableOpacity>
              </View>

              {isMemberSale && (
                <View style={styles.memberInputContainer}>
                  <Text style={styles.sectionLabel}>Nombre del Socio</Text>
                  <TextInput
                    style={styles.memberInput}
                    placeholder="Ingresa el nombre del socio"
                    value={memberName}
                    onChangeText={setMemberName}
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              <View style={styles.memberInputContainer}>
                <Text style={styles.sectionLabel}>Notas del Pedido (Opcional)</Text>
                <TextInput
                  style={[styles.memberInput, { height: 80 }]}
                  placeholder="Ej: Sin cebolla, huevo duro, etc."
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Text style={styles.sectionLabel}>Momento de Pago</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    payNow && styles.optionCardSelected
                  ]}
                  onPress={() => {
                    setPayNow(true);
                    setIsPartialPayment(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    payNow && styles.optionTextSelected
                  ]}>Pagar Ahora</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    !payNow && styles.optionCardSelected
                  ]}
                  onPress={() => {
                    setPayNow(false);
                    setIsPartialPayment(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    !payNow && styles.optionTextSelected
                  ]}>Por Pagar</Text>
                </TouchableOpacity>
              </View>

              {payNow && (
                <>
                  <Text style={styles.sectionLabel}>Tipo de Pago</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.optionCard,
                        !isPartialPayment && styles.optionCardSelected
                      ]}
                      onPress={() => setIsPartialPayment(false)}
                    >
                      <Text style={[
                        styles.optionText,
                        !isPartialPayment && styles.optionTextSelected
                      ]}>Pago Completo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.optionCard,
                        isPartialPayment && styles.optionCardSelected
                      ]}
                      onPress={() => setIsPartialPayment(true)}
                    >
                      <Text style={[
                        styles.optionText,
                        isPartialPayment && styles.optionTextSelected
                      ]}>Pago Parcial</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {payNow && isPartialPayment && (
                <View style={styles.memberInputContainer}>
                  <Text style={styles.sectionLabel}>Monto a Pagar Ahora</Text>
                  <TextInput
                    style={styles.memberInput}
                    placeholder={`Máximo: ${total} Bs.`}
                    value={partialPayment}
                    onChangeText={setPartialPayment}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                  {partialPayment && !isNaN(parseFloat(partialPayment)) && (
                    <Text style={styles.pendingAmountText}>
                      Pendiente: {(total - parseFloat(partialPayment)).toFixed(2)} Bs.
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.orderSummary}>
                <Text style={styles.summaryLabel}>Resumen del Pedido</Text>
                {cartItems.map((item) => {
                  const price = getMemberPrice(item.item.id, item.item.price);
                  const itemTotal = price * item.quantity;
                  const hasDiscount = isMemberSale && price !== item.item.price;
                  
                  return (
                    <View key={item.item.id} style={styles.summaryItem}>
                      <View style={styles.summaryItemLeft}>
                        <Text style={styles.summaryItemText}>
                          {item.quantity}x {item.item.name}
                        </Text>
                        {hasDiscount && (
                          <Text style={styles.discountText}>
                            Precio socio: {price} Bs.
                          </Text>
                        )}
                      </View>
                      <Text style={styles.summaryItemPrice}>
                        {itemTotal} Bs.
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.summaryTotal}>
                  <Text style={styles.summaryTotalText}>Total</Text>
                  <Text style={styles.summaryTotalAmount}>{total} Bs.</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleCreateOrder}
            >
              <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={customizingItemId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomizingItemId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Personalizar</Text>
              <TouchableOpacity onPress={() => setCustomizingItemId(null)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionLabel}>Quitar Ingredientes</Text>
              
              {[
                { key: 'removeLettuce' as const, label: 'Sin Lechuga' },
                { key: 'removeTomato' as const, label: 'Sin Tomate' },
                { key: 'removeOnion' as const, label: 'Sin Cebolla' },
                { key: 'removeCheese' as const, label: 'Sin Queso' },
                { key: 'removePickles' as const, label: 'Sin Pepinillos' },
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={styles.customizationOption}
                  onPress={() => toggleCustomization(key)}
                >
                  <Text style={styles.customizationLabel}>{label}</Text>
                  <View style={[
                    styles.checkbox,
                    cartCustomizations[customizingItemId!]?.[key] && styles.checkboxChecked
                  ]}>
                    {cartCustomizations[customizingItemId!]?.[key] && (
                      <Check size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setCustomizingItemId(null)}
            >
              <Text style={styles.confirmButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#D32F2F',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salesInfo: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  salesButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  readyOrdersButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  readyOrdersText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  readyOrdersSection: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  readyOrdersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  readyOrdersList: {
    paddingHorizontal: 16,
  },
  readyOrderCard: {
    width: 280,
    marginRight: 12,
  },
  pendingOrdersSection: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pendingOrdersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pendingOrdersList: {
    paddingHorizontal: 16,
  },
  pendingOrderCard: {
    width: 280,
    marginRight: 12,
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryTabActive: {
    borderBottomColor: '#D32F2F',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  menuSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  cartSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cartTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  cartItems: {
    maxHeight: 120,
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  cartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  totalText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  orderButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  customizeButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  customizeButtonText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
  customizationsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic' as const,
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
    maxHeight: '80%',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
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
    backgroundColor: '#FFEBEE',
    borderColor: '#D32F2F',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionTextSelected: {
    color: '#D32F2F',
  },
  orderSummary: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryItemText: {
    fontSize: 14,
    color: '#666',
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  summaryTotalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  summaryTotalAmount: {
    fontSize: 18,
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
  customizationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  customizationLabel: {
    fontSize: 16,
    color: '#333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  memberInputContainer: {
    marginBottom: 16,
  },
  memberInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  summaryItemLeft: {
    flex: 1,
  },
  discountText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  cartItemPriceContainer: {
    alignItems: 'flex-end',
  },
  cartItemPriceOriginal: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through' as const,
    marginBottom: 2,
  },
  pendingAmountText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600' as const,
    marginTop: 8,
  },
});