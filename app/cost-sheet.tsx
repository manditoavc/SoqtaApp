import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { ArrowLeft, Plus, Trash2, X, Edit2 } from 'lucide-react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type UnitType = 'kg' | 'g' | 'l' | 'ml' | 'unidad' | 'pza';

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: UnitType;
  costPerUnit: string;
  totalCost: number;
}

interface Recipe {
  id: string;
  name: string;
  ingredientId: string;
  percentage: string;
  quantityUsed: number;
}

export default function CostSheetScreen() {
  const [productName, setProductName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientQuantity, setNewIngredientQuantity] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState<UnitType>('kg');
  const [newIngredientCost, setNewIngredientCost] = useState('');
  
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [recipePercentage, setRecipePercentage] = useState('');
  const [recipeName, setRecipeName] = useState('');
  
  const insets = useSafeAreaInsets();

  const units: UnitType[] = ['kg', 'g', 'l', 'ml', 'unidad', 'pza'];

  const addIngredient = () => {
    if (!newIngredientName || !newIngredientQuantity || !newIngredientCost) {
      Alert.alert('Error', 'Completa todos los campos del ingrediente');
      return;
    }

    const quantity = parseFloat(newIngredientQuantity);
    const cost = parseFloat(newIngredientCost);

    if (isNaN(quantity) || quantity <= 0 || isNaN(cost) || cost <= 0) {
      Alert.alert('Error', 'La cantidad y el costo deben ser números válidos mayores a 0');
      return;
    }

    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: newIngredientName,
      quantity: newIngredientQuantity,
      unit: newIngredientUnit,
      costPerUnit: newIngredientCost,
      totalCost: cost
    };

    setIngredients([...ingredients, newIngredient]);
    setNewIngredientName('');
    setNewIngredientQuantity('');
    setNewIngredientCost('');
    setNewIngredientUnit('kg');
    setShowIngredientModal(false);
  };

  const removeIngredient = (id: string) => {
    Alert.alert(
      'Eliminar Ingrediente',
      '¿Estás seguro de eliminar este ingrediente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setIngredients(ingredients.filter(item => item.id !== id));
            setRecipes(recipes.filter(recipe => recipe.ingredientId !== id));
          }
        }
      ]
    );
  };

  const addRecipe = () => {
    if (!recipeName || !selectedIngredientId || !recipePercentage) {
      Alert.alert('Error', 'Completa todos los campos de la preparación');
      return;
    }

    const percentage = parseFloat(recipePercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      Alert.alert('Error', 'El porcentaje debe ser entre 0 y 100');
      return;
    }

    const ingredient = ingredients.find(i => i.id === selectedIngredientId);
    if (!ingredient) {
      Alert.alert('Error', 'Ingrediente no encontrado');
      return;
    }

    const quantity = parseFloat(ingredient.quantity);
    const quantityUsed = (quantity * percentage) / 100;

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: recipeName,
      ingredientId: selectedIngredientId,
      percentage: recipePercentage,
      quantityUsed
    };

    setRecipes([...recipes, newRecipe]);
    setRecipeName('');
    setSelectedIngredientId('');
    setRecipePercentage('');
    setShowRecipeModal(false);
  };

  const removeRecipe = (id: string) => {
    Alert.alert(
      'Eliminar Preparación',
      '¿Estás seguro de eliminar esta preparación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setRecipes(recipes.filter(recipe => recipe.id !== id));
          }
        }
      ]
    );
  };

  const totalIngredientCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);

  const totalRecipeCost = recipes.reduce((sum, recipe) => {
    const ingredient = ingredients.find(i => i.id === recipe.ingredientId);
    if (!ingredient) return sum;
    
    const percentage = parseFloat(recipe.percentage);
    const ingredientCost = parseFloat(ingredient.costPerUnit);
    const recipeCost = (ingredientCost * percentage) / 100;
    
    return sum + recipeCost;
  }, 0);

  const totalCost = totalIngredientCost + totalRecipeCost;
  const sellingPriceNum = parseFloat(sellingPrice) || 0;
  const profit = sellingPriceNum - totalCost;
  const profitMargin = sellingPriceNum > 0 ? ((profit / sellingPriceNum) * 100) : 0;
  const markup = totalCost > 0 ? ((profit / totalCost) * 100) : 0;

  const clearAll = () => {
    Alert.alert(
      'Limpiar Todo',
      '¿Estás seguro de limpiar todos los datos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            setProductName('');
            setSellingPrice('');
            setIngredients([]);
            setRecipes([]);
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planilla de Costos</Text>
        <TouchableOpacity style={styles.clearAllButton} onPress={clearAll}>
          <Text style={styles.clearAllText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Producto</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Producto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Hamburguesa Especial"
              value={productName}
              onChangeText={setProductName}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Precio de Venta (Bs.)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredientes Base</Text>
            <TouchableOpacity 
              style={styles.addSectionButton}
              onPress={() => setShowIngredientModal(true)}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addSectionButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {ingredients.length > 0 ? (
            ingredients.map(ingredient => (
              <View key={ingredient.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{ingredient.name}</Text>
                  <Text style={styles.itemDetails}>
                    {ingredient.quantity} {ingredient.unit} × {parseFloat(ingredient.costPerUnit).toFixed(2)} Bs.
                  </Text>
                  <Text style={styles.itemCost}>
                    Total: {ingredient.totalCost.toFixed(2)} Bs.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeIngredient(ingredient.id)}
                >
                  <Trash2 size={18} color="#f44336" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay ingredientes agregados</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preparaciones / Recetas</Text>
            <TouchableOpacity 
              style={styles.addSectionButton}
              onPress={() => {
                if (ingredients.length === 0) {
                  Alert.alert('Información', 'Primero agrega ingredientes base');
                  return;
                }
                setShowRecipeModal(true);
              }}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addSectionButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {recipes.length > 0 ? (
            recipes.map(recipe => {
              const ingredient = ingredients.find(i => i.id === recipe.ingredientId);
              if (!ingredient) return null;
              
              const percentage = parseFloat(recipe.percentage);
              const costUsed = (parseFloat(ingredient.costPerUnit) * percentage) / 100;

              return (
                <View key={recipe.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{recipe.name}</Text>
                    <Text style={styles.itemDetails}>
                      Ingrediente: {ingredient.name}
                    </Text>
                    <Text style={styles.itemDetails}>
                      Uso: {recipe.percentage}% ({recipe.quantityUsed.toFixed(2)} {ingredient.unit})
                    </Text>
                    <Text style={styles.itemCost}>
                      Costo: {costUsed.toFixed(2)} Bs.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeRecipe(recipe.id)}
                  >
                    <Trash2 size={18} color="#f44336" />
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay preparaciones agregadas</Text>
            </View>
          )}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumen Financiero</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Costo Ingredientes Base:</Text>
              <Text style={styles.summaryValue}>{totalIngredientCost.toFixed(2)} Bs.</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Costo Preparaciones:</Text>
              <Text style={styles.summaryValue}>{totalRecipeCost.toFixed(2)} Bs.</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Costo Total:</Text>
              <Text style={styles.summaryValueBold}>{totalCost.toFixed(2)} Bs.</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Precio de Venta:</Text>
              <Text style={styles.summaryValue}>{sellingPriceNum.toFixed(2)} Bs.</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Ganancia:</Text>
              <Text style={[
                styles.summaryValueBold,
                profit >= 0 ? styles.profitPositive : styles.profitNegative
              ]}>
                {profit.toFixed(2)} Bs.
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Margen de Ganancia:</Text>
              <Text style={[
                styles.summaryValue,
                profitMargin >= 0 ? styles.profitPositive : styles.profitNegative
              ]}>
                {profitMargin.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Markup:</Text>
              <Text style={[
                styles.summaryValue,
                markup >= 0 ? styles.profitPositive : styles.profitNegative
              ]}>
                {markup.toFixed(2)}%
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Información</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Ingredientes Base:</Text> Costos totales de ingredientes comprados
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Preparaciones:</Text> Porcentaje de ingredientes usados en recetas
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Margen:</Text> % de ganancia sobre precio de venta
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Markup:</Text> % de ganancia sobre costo total
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showIngredientModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIngredientModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Ingrediente</Text>
              <TouchableOpacity onPress={() => setShowIngredientModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Ingrediente</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Carne de res"
                  value={newIngredientName}
                  onChangeText={setNewIngredientName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 5"
                  value={newIngredientQuantity}
                  onChangeText={setNewIngredientQuantity}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Unidad de Medida</Text>
                <View style={styles.unitGrid}>
                  {units.map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        newIngredientUnit === unit && styles.unitButtonSelected
                      ]}
                      onPress={() => setNewIngredientUnit(unit)}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        newIngredientUnit === unit && styles.unitButtonTextSelected
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Costo Total (Bs.)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 150.00"
                  value={newIngredientCost}
                  onChangeText={setNewIngredientCost}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={addIngredient}
            >
              <Text style={styles.confirmButtonText}>Agregar Ingrediente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRecipeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Preparación</Text>
              <TouchableOpacity onPress={() => setShowRecipeModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de la Preparación</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Salsa especial"
                  value={recipeName}
                  onChangeText={setRecipeName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Seleccionar Ingrediente</Text>
                <View style={styles.ingredientList}>
                  {ingredients.map(ingredient => (
                    <TouchableOpacity
                      key={ingredient.id}
                      style={[
                        styles.ingredientOption,
                        selectedIngredientId === ingredient.id && styles.ingredientOptionSelected
                      ]}
                      onPress={() => setSelectedIngredientId(ingredient.id)}
                    >
                      <Text style={[
                        styles.ingredientOptionText,
                        selectedIngredientId === ingredient.id && styles.ingredientOptionTextSelected
                      ]}>
                        {ingredient.name}
                      </Text>
                      <Text style={styles.ingredientOptionDetails}>
                        {ingredient.quantity} {ingredient.unit} - {parseFloat(ingredient.costPerUnit).toFixed(2)} Bs.
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Porcentaje de Uso (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 20 (significa 20%)"
                  value={recipePercentage}
                  onChangeText={setRecipePercentage}
                  keyboardType="numeric"
                />
                {selectedIngredientId && recipePercentage && !isNaN(parseFloat(recipePercentage)) && (
                  <Text style={styles.helperText}>
                    Se usarán {((parseFloat(ingredients.find(i => i.id === selectedIngredientId)?.quantity || '0') * parseFloat(recipePercentage)) / 100).toFixed(2)} {ingredients.find(i => i.id === selectedIngredientId)?.unit}
                  </Text>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={addRecipe}
            >
              <Text style={styles.confirmButtonText}>Agregar Preparación</Text>
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
    backgroundColor: '#009688',
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
  clearAllButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#333',
  },
  addSectionButton: {
    backgroundColor: '#009688',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addSectionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
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
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitButtonSelected: {
    backgroundColor: '#E0F2F1',
    borderColor: '#009688',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  unitButtonTextSelected: {
    color: '#009688',
  },
  itemCard: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  itemCost: {
    fontSize: 14,
    color: '#009688',
    fontWeight: '600' as const,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },
  summaryLabelBold: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#333',
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  profitPositive: {
    color: '#4CAF50',
  },
  profitNegative: {
    color: '#f44336',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  infoCard: {
    backgroundColor: '#E0F2F1',
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#009688',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600' as const,
    color: '#333',
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
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  confirmButton: {
    backgroundColor: '#009688',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginHorizontal: 20,
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  ingredientList: {
    gap: 8,
  },
  ingredientOption: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ingredientOptionSelected: {
    backgroundColor: '#E0F2F1',
    borderColor: '#009688',
  },
  ingredientOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  ingredientOptionTextSelected: {
    color: '#009688',
  },
  ingredientOptionDetails: {
    fontSize: 13,
    color: '#666',
  },
  helperText: {
    fontSize: 13,
    color: '#009688',
    marginTop: 8,
    fontWeight: '600' as const,
  },
});
