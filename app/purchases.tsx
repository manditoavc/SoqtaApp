import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Modal } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Download, X, ChevronDown } from 'lucide-react';
import { usePurchases } from '@/hooks/purchases-store';
import { useInventory } from '@/hooks/inventory-store';
import { useAuth } from '@/hooks/auth-store';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function PurchasesScreen() {
  const { purchases, addPurchase, getTotalSpending } = usePurchases();
  const { inventory, addQuantityToItem } = useInventory();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [showItemPicker, setShowItemPicker] = useState(false);

  const handleAddPurchase = async () => {
    if (!selectedItemId || !quantity || !price) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const selectedItem = inventory.find(item => item.id === selectedItemId);
    if (!selectedItem) {
      Alert.alert('Error', 'Producto no encontrado en el inventario');
      return;
    }

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    if (isNaN(quantityNum) || isNaN(priceNum) || quantityNum <= 0 || priceNum <= 0) {
      Alert.alert('Error', 'Cantidad y precio deben ser números válidos mayores a 0');
      return;
    }

    const purchaseId = Date.now().toString();
    const success = await addPurchase(
      selectedItem.name,
      quantityNum,
      priceNum,
      currentUser?.username || 'Desconocido',
      purchaseId
    );

    if (success) {
      await addQuantityToItem(selectedItemId, quantityNum, priceNum, purchaseId);
      console.log(`Cantidad agregada al inventario: ${selectedItem.name} +${quantityNum} con precio ${priceNum} Bs.`);
      
      setSelectedItemId('');
      setQuantity('');
      setPrice('');
      setShowAddForm(false);
      Alert.alert('Éxito', `Compra registrada y agregada al inventario. Precio: ${priceNum} Bs.`);
    } else {
      Alert.alert('Error', 'No se pudo registrar la compra');
    }
  };

  const exportToCSV = () => {
    if (purchases.length === 0) {
      Alert.alert('Sin Datos', 'No hay compras para exportar');
      return;
    }

    let csvContent = 'Producto,Cantidad,Precio Unitario,Total,Fecha,Registrado Por\n';
    
    purchases.forEach(purchase => {
      const date = new Date(purchase.date).toLocaleDateString('es-ES');
      csvContent += `${purchase.productName},${purchase.quantity},${purchase.price},${purchase.total},${date},${purchase.addedBy}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Alert.alert('Éxito', 'Archivo CSV descargado');
  };

  const exportToCSVMobile = async () => {
    if (purchases.length === 0) {
      Alert.alert('Sin Datos', 'No hay compras para exportar');
      return;
    }

    try {
      let csvContent = 'Producto,Cantidad,Precio Unitario,Total,Fecha,Registrado Por\n';
      
      purchases.forEach(purchase => {
        const date = new Date(purchase.date).toLocaleDateString('es-ES');
        csvContent += `${purchase.productName},${purchase.quantity},${purchase.price},${purchase.total},${date},${purchase.addedBy}\n`;
      });

      const timestamp = Date.now();
      const fileName = `compras_${new Date().toISOString().split('T')[0]}_${timestamp}.csv`;
      const file = new File(Paths.cache, fileName);
      
      try {
        if (file.exists) {
          await file.delete();
        }
      } catch {
        console.log('File does not exist, creating new one');
      }
      
      await file.create();
      await file.write(csvContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri);
      } else {
        Alert.alert('\u00c9xito', `Archivo guardado en: ${file.uri}`);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo');
    }
  };

  const handleExport = async () => {
    if (Platform.OS === 'web') {
      exportToCSV();
    } else {
      await exportToCSVMobile();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registro de Compras</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Download size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Nueva Compra</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Producto (Solo del inventario)</Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setShowItemPicker(true)}
              >
                <Text style={[styles.pickerButtonText, !selectedItemId && styles.pickerButtonPlaceholder]}>
                  {selectedItemId 
                    ? inventory.find(item => item.id === selectedItemId)?.name 
                    : 'Selecciona un producto del inventario'}
                </Text>
                <ChevronDown size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Precio Unitario (Bs.)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddPurchase}>
              <Text style={styles.submitButtonText}>Registrar Compra</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Gastado</Text>
          <Text style={styles.summaryValue}>{getTotalSpending().toFixed(2)} Bs.</Text>
          <Text style={styles.summarySubtitle}>{purchases.length} compras registradas</Text>
        </View>

        <View style={styles.purchasesList}>
          <Text style={styles.sectionTitle}>Historial de Compras</Text>
          
          {purchases.length > 0 ? (
            purchases.map(purchase => (
              <View key={purchase.id} style={styles.purchaseCard}>
                <View style={styles.purchaseHeader}>
                  <Text style={styles.purchaseName}>{purchase.productName}</Text>
                  <Text style={styles.purchaseTotal}>{purchase.total.toFixed(2)} Bs.</Text>
                </View>
                <View style={styles.purchaseDetails}>
                  <Text style={styles.purchaseDetail}>
                    Cantidad: {purchase.quantity} × {purchase.price.toFixed(2)} Bs.
                  </Text>
                  <Text style={styles.purchaseDetail}>
                    Fecha: {new Date(purchase.date).toLocaleDateString('es-ES')}
                  </Text>
                  <Text style={styles.purchaseDetail}>
                    Registrado por: {purchase.addedBy}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay compras registradas</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showItemPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowItemPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Producto</Text>
              <TouchableOpacity onPress={() => setShowItemPicker(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {inventory.length > 0 ? (
                inventory.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.itemOption,
                      selectedItemId === item.id && styles.itemOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedItemId(item.id);
                      setShowItemPicker(false);
                    }}
                  >
                    <View style={styles.itemOptionInfo}>
                      <Text style={styles.itemOptionName}>{item.name}</Text>
                      <Text style={styles.itemOptionUnit}>{item.unit}</Text>
                    </View>
                    <View style={styles.itemOptionStock}>
                      <Text style={styles.itemOptionStockText}>
                        Stock: {item.quantity} {item.unit}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyInventory}>
                  <Text style={styles.emptyInventoryText}>
                    No hay productos en el inventario
                  </Text>
                  <Text style={styles.emptyInventorySubtext}>
                    El administrador debe agregar productos primero
                  </Text>
                </View>
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
    backgroundColor: '#FF9800',
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
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addForm: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#999',
  },
  purchasesList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  purchaseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  purchaseTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
  },
  purchaseDetails: {
    gap: 4,
  },
  purchaseDetail: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  pickerButton: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  pickerButtonPlaceholder: {
    color: '#999',
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
    maxHeight: '70%',
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
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  itemOption: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#FF9800',
  },
  itemOptionInfo: {
    marginBottom: 8,
  },
  itemOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemOptionUnit: {
    fontSize: 14,
    color: '#666',
  },
  itemOptionStock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemOptionStockText: {
    fontSize: 14,
    color: '#999',
  },
  emptyInventory: {
    padding: 32,
    alignItems: 'center',
  },
  emptyInventoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyInventorySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
