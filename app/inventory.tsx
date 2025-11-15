import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { ArrowLeft, AlertTriangle, Plus, Trash2, X, Edit, History } from 'lucide-react';
import { useInventory } from '@/hooks/inventory-store';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InventoryScreen() {
  const { inventory, updateItemQuantity, updateItemPrice, addInventoryItem, removeInventoryItem, getLowStockItems, getPriceHistory, getAveragePrice } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [priceHistoryItem, setPriceHistoryItem] = useState<string | null>(null);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<'kg' | 'litros' | 'unidades'>('kg');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemThreshold, setNewItemThreshold] = useState('');
  
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  
  const insets = useSafeAreaInsets();
  
  const lowStockItems = getLowStockItems();

  const handleAddItem = async () => {
    if (!newItemName || !newItemQuantity || !newItemPrice) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const quantity = parseFloat(newItemQuantity);
    const price = parseFloat(newItemPrice);
    const threshold = newItemThreshold ? parseFloat(newItemThreshold) : 5;

    if (isNaN(quantity) || isNaN(price) || quantity < 0 || price < 0) {
      Alert.alert('Error', 'Los valores deben ser números válidos');
      return;
    }

    const result = await addInventoryItem(newItemName, newItemUnit, quantity, price, threshold);
    if (result) {
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemPrice('');
      setNewItemThreshold('');
      setNewItemUnit('kg');
      setShowAddModal(false);
      Alert.alert('Éxito', 'Producto agregado al inventario');
    }
  };

  const handleOpenEdit = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      setEditingItem(itemId);
      setEditQuantity(item.quantity.toString());
      setEditPrice(item.price.toString());
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const quantity = parseFloat(editQuantity);
    const price = parseFloat(editPrice);

    if (isNaN(quantity) || isNaN(price) || quantity < 0 || price < 0) {
      Alert.alert('Error', 'Los valores deben ser números válidos');
      return;
    }

    await updateItemQuantity(editingItem, quantity);
    await updateItemPrice(editingItem, price);
    
    setShowEditModal(false);
    setEditingItem(null);
    Alert.alert('Éxito', 'Producto actualizado');
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro que deseas eliminar "${itemName}" del inventario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await removeInventoryItem(itemId);
            if (success) {
              Alert.alert('Éxito', 'Producto eliminado del inventario');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (quantity: number, threshold: number) => {
    if (quantity < threshold) return '#f44336';
    if (quantity < threshold * 2) return '#FF9800';
    return '#4CAF50';
  };

  const editingItemData = editingItem ? inventory.find(i => i.id === editingItem) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventario</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {lowStockItems.length > 0 && (
        <View style={styles.alertSection}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color="#f44336" />
            <Text style={styles.alertTitle}>Productos con Stock Bajo ({lowStockItems.length})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lowStockItems.map(item => (
              <View key={item.id} style={styles.alertCard}>
                <Text style={styles.alertCardName}>{item.name}</Text>
                <Text style={styles.alertCardPercentage}>{item.quantity} {item.unit}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {inventory.map((item) => (
          <View key={item.id} style={styles.inventoryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemUnit}>{item.unit}</Text>
              </View>
              <View style={styles.cardActions}>
                {item.priceHistory && item.priceHistory.length > 0 && (
                  <TouchableOpacity 
                    style={styles.historyIconButton}
                    onPress={() => {
                      setPriceHistoryItem(item.id);
                      setShowPriceHistoryModal(true);
                    }}
                  >
                    <History size={18} color="#FF9800" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.editIconButton}
                  onPress={() => handleOpenEdit(item.id)}
                >
                  <Edit size={18} color="#1976D2" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleRemoveItem(item.id, item.name)}
                >
                  <Trash2 size={18} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsSection}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Cantidad</Text>
                <Text 
                  style={[
                    styles.statValue,
                    { color: getStatusColor(item.quantity, item.lowStockThreshold) }
                  ]}
                >
                  {item.quantity} {item.unit}
                </Text>
                {item.quantity < item.lowStockThreshold && (
                  <View style={styles.lowStockBadge}>
                    <AlertTriangle size={12} color="#fff" />
                    <Text style={styles.lowStockText}>Stock Bajo</Text>
                  </View>
                )}
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Precio Actual</Text>
                <Text style={styles.statValue}>
                  {item.price.toFixed(2)} Bs.
                </Text>
                {item.priceHistory && item.priceHistory.length > 0 && (
                  <Text style={styles.statSubtext}>
                    Promedio: {getAveragePrice(item.id).toFixed(2)} Bs.
                  </Text>
                )}
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Valor Total</Text>
                <Text style={styles.statValue}>
                  {(item.quantity * item.price).toFixed(2)} Bs.
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Producto</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del Producto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Carne de Res"
                  value={newItemName}
                  onChangeText={setNewItemName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Unidad de Medida</Text>
                <View style={styles.unitButtons}>
                  {(['kg', 'litros', 'unidades'] as const).map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        newItemUnit === unit && styles.unitButtonActive
                      ]}
                      onPress={() => setNewItemUnit(unit)}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        newItemUnit === unit && styles.unitButtonTextActive
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cantidad Inicial</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 50"
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Precio Unitario (Bs.)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 45"
                  value={newItemPrice}
                  onChangeText={setNewItemPrice}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Umbral de Stock Bajo (Opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Por defecto: 5"
                  value={newItemThreshold}
                  onChangeText={setNewItemThreshold}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddItem}
              >
                <Text style={styles.saveButtonText}>Agregar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Producto</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {editingItemData && (
                <>
                  <Text style={styles.editItemName}>{editingItemData.name}</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Cantidad ({editingItemData.unit})</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Cantidad"
                      value={editQuantity}
                      onChangeText={setEditQuantity}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Precio Unitario (Bs.)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Precio"
                      value={editPrice}
                      onChangeText={setEditPrice}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.valueSummary}>
                    <Text style={styles.valueSummaryLabel}>Valor Total:</Text>
                    <Text style={styles.valueSummaryValue}>
                      {((parseFloat(editQuantity) || 0) * (parseFloat(editPrice) || 0)).toFixed(2)} Bs.
                    </Text>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPriceHistoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriceHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Historial de Precios</Text>
              <TouchableOpacity onPress={() => setShowPriceHistoryModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {priceHistoryItem && (
                <>
                  {(() => {
                    const item = inventory.find(i => i.id === priceHistoryItem);
                    const history = getPriceHistory(priceHistoryItem);
                    const avgPrice = getAveragePrice(priceHistoryItem);
                    
                    if (!item) return null;

                    return (
                      <>
                        <Text style={styles.historyItemName}>{item.name}</Text>
                        
                        <View style={styles.avgPriceCard}>
                          <Text style={styles.avgPriceLabel}>Precio Promedio Ponderado</Text>
                          <Text style={styles.avgPriceValue}>{avgPrice.toFixed(2)} Bs.</Text>
                          <Text style={styles.avgPriceSubtext}>
                            Basado en {history.length} {history.length === 1 ? 'compra' : 'compras'}
                          </Text>
                        </View>

                        <Text style={styles.historyListTitle}>Historial de Compras</Text>
                        {history.length > 0 ? (
                          history.map((entry, index) => (
                            <View key={entry.purchaseId} style={styles.historyEntry}>
                              <View style={styles.historyEntryHeader}>
                                <Text style={styles.historyEntryNumber}>Compra #{history.length - index}</Text>
                                <Text style={styles.historyEntryDate}>
                                  {new Date(entry.date).toLocaleDateString('es-ES')}
                                </Text>
                              </View>
                              <View style={styles.historyEntryDetails}>
                                <View style={styles.historyDetailRow}>
                                  <Text style={styles.historyDetailLabel}>Cantidad:</Text>
                                  <Text style={styles.historyDetailValue}>{entry.quantity} {item.unit}</Text>
                                </View>
                                <View style={styles.historyDetailRow}>
                                  <Text style={styles.historyDetailLabel}>Precio:</Text>
                                  <Text style={styles.historyDetailValue}>{entry.price.toFixed(2)} Bs.</Text>
                                </View>
                                <View style={styles.historyDetailRow}>
                                  <Text style={styles.historyDetailLabel}>Total:</Text>
                                  <Text style={[styles.historyDetailValue, styles.historyDetailTotal]}>
                                    {(entry.quantity * entry.price).toFixed(2)} Bs.
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))
                        ) : (
                          <View style={styles.emptyHistory}>
                            <Text style={styles.emptyHistoryText}>No hay historial de precios</Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </ScrollView>
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
    backgroundColor: '#1976D2',
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
    fontWeight: '700' as const,
    flex: 1,
    textAlign: 'center' as const,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  alertSection: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#f44336',
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 2,
    borderColor: '#f44336',
  },
  alertCardName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  alertCardPercentage: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#f44336',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inventoryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 14,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editIconButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#333',
  },
  lowStockBadge: {
    flexDirection: 'row',
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lowStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
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
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
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
  unitButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  unitButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#1976D2',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  editItemName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  valueSummary: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  valueSummaryLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2E7D32',
  },
  valueSummaryValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#2E7D32',
  },
  historyIconButton: {
    padding: 8,
  },
  statSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  historyItemName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  avgPriceCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  avgPriceLabel: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 8,
  },
  avgPriceValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FF9800',
    marginBottom: 4,
  },
  avgPriceSubtext: {
    fontSize: 12,
    color: '#666',
  },
  historyListTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 16,
  },
  historyEntry: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  historyEntryNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1976D2',
  },
  historyEntryDate: {
    fontSize: 12,
    color: '#666',
  },
  historyEntryDetails: {
    gap: 8,
  },
  historyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  historyDetailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  historyDetailTotal: {
    fontSize: 16,
    color: '#FF9800',
  },
  emptyHistory: {
    padding: 32,
    alignItems: 'center' as const,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#999',
  },
});
