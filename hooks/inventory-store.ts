import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { InventoryItem, PriceHistory } from '@/types/inventory';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Carne de Res', quantity: 50, unit: 'kg', price: 45, lowStockThreshold: 10 },
  { id: '2', name: 'Pan de Hamburguesa', quantity: 200, unit: 'unidades', price: 0.50, lowStockThreshold: 50 },
  { id: '3', name: 'Lechuga', quantity: 20, unit: 'kg', price: 8, lowStockThreshold: 5 },
  { id: '4', name: 'Tomate', quantity: 25, unit: 'kg', price: 10, lowStockThreshold: 5 },
  { id: '5', name: 'Cebolla', quantity: 30, unit: 'kg', price: 6, lowStockThreshold: 5 },
  { id: '6', name: 'Queso', quantity: 15, unit: 'kg', price: 35, lowStockThreshold: 3 },
  { id: '7', name: 'Pepinillos', quantity: 10, unit: 'kg', price: 12, lowStockThreshold: 2 },
  { id: '8', name: 'Papas', quantity: 40, unit: 'kg', price: 7, lowStockThreshold: 10 },
  { id: '9', name: 'Tocino', quantity: 12, unit: 'kg', price: 42, lowStockThreshold: 3 },
  { id: '10', name: 'Jamón', quantity: 8, unit: 'kg', price: 40, lowStockThreshold: 2 },
  { id: '11', name: 'Chorizo', quantity: 15, unit: 'kg', price: 38, lowStockThreshold: 3 },
  { id: '12', name: 'Salsa', quantity: 20, unit: 'litros', price: 15, lowStockThreshold: 5 },
  { id: '13', name: 'Aceite', quantity: 25, unit: 'litros', price: 18, lowStockThreshold: 5 },
  { id: '14', name: 'Sal', quantity: 10, unit: 'kg', price: 3, lowStockThreshold: 2 },
  { id: '15', name: 'Pimienta', quantity: 5, unit: 'kg', price: 25, lowStockThreshold: 1 },
];

export const [InventoryProvider, useInventory] = createContextHook(() => {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const stored = await AsyncStorage.getItem('inventory');
      if (stored) {
        setInventory(JSON.parse(stored));
      } else {
        await AsyncStorage.setItem('inventory', JSON.stringify(INITIAL_INVENTORY));
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      const updatedInventory = inventory.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      
      setInventory(updatedInventory);
      await AsyncStorage.setItem('inventory', JSON.stringify(updatedInventory));
      console.log(`Inventario actualizado: ${itemId} -> ${quantity}`);
      return true;
    } catch (error) {
      console.error('Error updating inventory:', error);
      return false;
    }
  }, [inventory]);

  const updateItemPrice = useCallback(async (itemId: string, price: number) => {
    try {
      const updatedInventory = inventory.map(item =>
        item.id === itemId ? { ...item, price } : item
      );
      
      setInventory(updatedInventory);
      await AsyncStorage.setItem('inventory', JSON.stringify(updatedInventory));
      console.log(`Precio actualizado: ${itemId} -> ${price} Bs.`);
      return true;
    } catch (error) {
      console.error('Error updating price:', error);
      return false;
    }
  }, [inventory]);

  const addInventoryItem = useCallback(async (name: string, unit: 'kg' | 'litros' | 'unidades', quantity: number, price: number, lowStockThreshold: number = 5) => {
    try {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name,
        quantity,
        unit,
        price,
        lowStockThreshold
      };
      
      const updatedInventory = [...inventory, newItem];
      setInventory(updatedInventory);
      await AsyncStorage.setItem('inventory', JSON.stringify(updatedInventory));
      console.log(`Nuevo producto agregado: ${name}`);
      return newItem;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      return null;
    }
  }, [inventory]);

  const removeInventoryItem = useCallback(async (itemId: string) => {
    try {
      const updatedInventory = inventory.filter(item => item.id !== itemId);
      setInventory(updatedInventory);
      await AsyncStorage.setItem('inventory', JSON.stringify(updatedInventory));
      console.log(`Producto eliminado: ${itemId}`);
      return true;
    } catch (error) {
      console.error('Error removing inventory item:', error);
      return false;
    }
  }, [inventory]);

  const getLowStockItems = useCallback(() => {
    return inventory.filter(item => item.quantity < item.lowStockThreshold);
  }, [inventory]);

  const addQuantityToItem = useCallback(async (itemId: string, quantityToAdd: number, price?: number, purchaseId?: string) => {
    try {
      const updatedInventory = inventory.map(item => {
        if (item.id === itemId) {
          const newHistory: PriceHistory[] = item.priceHistory || [];
          
          if (price !== undefined && purchaseId) {
            newHistory.push({
              price,
              quantity: quantityToAdd,
              date: new Date(),
              purchaseId
            });
          }
          
          return {
            ...item,
            quantity: item.quantity + quantityToAdd,
            price: price !== undefined ? price : item.price,
            priceHistory: newHistory
          };
        }
        return item;
      });
      
      setInventory(updatedInventory);
      await AsyncStorage.setItem('inventory', JSON.stringify(updatedInventory));
      console.log(`Cantidad agregada al inventario: ${itemId} +${quantityToAdd} con precio ${price || 'sin cambio'}`);
      return true;
    } catch (error) {
      console.error('Error adding quantity to item:', error);
      return false;
    }
  }, [inventory]);

  const getPriceHistory = useCallback((itemId: string): PriceHistory[] => {
    const item = inventory.find(i => i.id === itemId);
    return item?.priceHistory || [];
  }, [inventory]);

  const getAveragePrice = useCallback((itemId: string): number => {
    const item = inventory.find(i => i.id === itemId);
    if (!item || !item.priceHistory || item.priceHistory.length === 0) {
      return item?.price || 0;
    }
    
    const totalCost = item.priceHistory.reduce((sum, entry) => sum + (entry.price * entry.quantity), 0);
    const totalQuantity = item.priceHistory.reduce((sum, entry) => sum + entry.quantity, 0);
    
    return totalQuantity > 0 ? totalCost / totalQuantity : item.price;
  }, [inventory]);

  return useMemo(() => ({
    inventory,
    isLoading,
    updateItemQuantity,
    updateItemPrice,
    addInventoryItem,
    removeInventoryItem,
    getLowStockItems,
    addQuantityToItem,
    getPriceHistory,
    getAveragePrice
  }), [inventory, isLoading, updateItemQuantity, updateItemPrice, addInventoryItem, removeInventoryItem, getLowStockItems, addQuantityToItem, getPriceHistory, getAveragePrice]);
});
