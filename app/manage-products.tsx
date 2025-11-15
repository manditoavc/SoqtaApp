import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { ArrowLeft, Plus, Edit2, Trash2, X } from 'lucide-react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProducts } from '@/hooks/products-store';

export default function ManageProductsScreen() {
  const { burgers, sides, drinks, extras, addProduct, updateProduct, deleteProduct } = useProducts();
  const insets = useSafeAreaInsets();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productCategory, setProductCategory] = useState<'burger' | 'side' | 'drink' | 'extra'>('burger');

  const resetForm = () => {
    setProductName('');
    setProductPrice('');
    setProductDescription('');
    setProductCategory('burger');
    setEditingProduct(null);
  };

  const handleAddProduct = async () => {
    if (!productName || !productPrice) {
      Alert.alert('Error', 'Por favor completa el nombre y precio');
      return;
    }

    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    const success = await addProduct({
      name: productName,
      price,
      description: productDescription,
      category: productCategory
    });

    if (success) {
      Alert.alert('Éxito', 'Producto agregado correctamente');
      resetForm();
      setShowAddModal(false);
    } else {
      Alert.alert('Error', 'No se pudo agregar el producto');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !productName || !productPrice) {
      Alert.alert('Error', 'Por favor completa el nombre y precio');
      return;
    }

    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    const success = await updateProduct(editingProduct.id, {
      name: productName,
      price,
      description: productDescription
    });

    if (success) {
      Alert.alert('Éxito', 'Producto actualizado correctamente');
      resetForm();
      setShowAddModal(false);
    } else {
      Alert.alert('Error', 'No se pudo actualizar el producto');
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro que deseas eliminar "${productName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProduct(productId);
            if (success) {
              Alert.alert('Éxito', 'Producto eliminado correctamente');
            } else {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductDescription(product.description || '');
    setProductCategory(product.category);
    setShowAddModal(true);
  };

  const renderProductCard = (product: any) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>
        <Text style={styles.productPrice}>{product.price} Bs.</Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(product)}
        >
          <Edit2 size={18} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(product.id, product.name)}
        >
          <Trash2 size={18} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestionar Productos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hamburguesas ({burgers.length})</Text>
          {burgers.map(renderProductCard)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acompañamientos ({sides.length})</Text>
          {sides.map(renderProductCard)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bebidas ({drinks.length})</Text>
          {drinks.map(renderProductCard)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extras ({extras.length})</Text>
          {extras.map(renderProductCard)}
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Categoría</Text>
                <View style={styles.categoryButtons}>
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      productCategory === 'burger' && styles.categoryButtonActive
                    ]}
                    onPress={() => setProductCategory('burger')}
                    disabled={!!editingProduct}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        productCategory === 'burger' && styles.categoryButtonTextActive
                      ]}
                    >
                      Hamburguesa
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      productCategory === 'side' && styles.categoryButtonActive
                    ]}
                    onPress={() => setProductCategory('side')}
                    disabled={!!editingProduct}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        productCategory === 'side' && styles.categoryButtonTextActive
                      ]}
                    >
                      Acompañamiento
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      productCategory === 'drink' && styles.categoryButtonActive
                    ]}
                    onPress={() => setProductCategory('drink')}
                    disabled={!!editingProduct}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        productCategory === 'drink' && styles.categoryButtonTextActive
                      ]}
                    >
                      Bebida
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      productCategory === 'extra' && styles.categoryButtonActive
                    ]}
                    onPress={() => setProductCategory('extra')}
                    disabled={!!editingProduct}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        productCategory === 'extra' && styles.categoryButtonTextActive
                      ]}
                    >
                      Extra
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del Producto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Hamburguesa Especial"
                  value={productName}
                  onChangeText={setProductName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Precio (Bs.)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={productPrice}
                  onChangeText={setProductPrice}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción (Opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descripción del producto..."
                  value={productDescription}
                  onChangeText={setProductDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={editingProduct ? handleUpdateProduct : handleAddProduct}
              >
                <Text style={styles.saveButtonText}>
                  {editingProduct ? 'Actualizar' : 'Agregar'}
                </Text>
              </TouchableOpacity>
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
    backgroundColor: '#4CAF50',
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
    textAlign: 'center',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#4CAF50',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
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
    maxWidth: 500,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
