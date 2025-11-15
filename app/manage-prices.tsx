import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save } from 'lucide-react';
import { ALL_MENU_ITEMS, BURGERS, SIDES, DRINKS, EXTRAS } from '@/constants/burgers';
import { MenuItem } from '@/types/order';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ManagePricesScreen() {
  const insets = useSafeAreaInsets();
  const [prices, setPrices] = useState<{ [key: string]: string }>(
    ALL_MENU_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: item.price.toString() }), {})
  );

  const handleSavePrices = async () => {
    try {
      await AsyncStorage.setItem('menuPrices', JSON.stringify(prices));
      Alert.alert('Éxito', 'Precios actualizados correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los precios');
    }
  };

  const renderCategory = (title: string, items: MenuItem[]) => (
    <View style={styles.category} key={title}>
      <Text style={styles.categoryTitle}>{title}</Text>
      {items.map(item => (
        <View key={item.id} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
          </View>
          <View style={styles.priceInput}>
            <TextInput
              style={styles.input}
              value={prices[item.id]}
              onChangeText={(value) => setPrices(prev => ({ ...prev, [item.id]: value }))}
              keyboardType="numeric"
              placeholder="0"
            />
            <Text style={styles.currency}>Bs.</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modificar Precios</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSavePrices}>
          <Save size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCategory('Hamburguesas', BURGERS)}
        {renderCategory('Acompañamientos', SIDES)}
        {renderCategory('Bebidas', DRINKS)}
        {renderCategory('Extras', EXTRAS)}
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
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  category: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  itemRow: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    width: 80,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
