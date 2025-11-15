import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { PurchaseRecord } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const [PurchasesProvider, usePurchases] = createContextHook(() => {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const stored = await AsyncStorage.getItem('purchases');
      if (stored) {
        setPurchases(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const addPurchase = useCallback(async (
    productName: string,
    quantity: number,
    price: number,
    addedBy: string,
    purchaseId?: string
  ): Promise<boolean> => {
    try {
      const newPurchase: PurchaseRecord = {
        id: purchaseId || Date.now().toString(),
        productName,
        quantity,
        price,
        total: quantity * price,
        date: new Date(),
        addedBy
      };

      const updatedPurchases = [newPurchase, ...purchases];
      setPurchases(updatedPurchases);
      await AsyncStorage.setItem('purchases', JSON.stringify(updatedPurchases));

      console.log(`Compra agregada: ${productName} x${quantity} a ${price} Bs.`);
      return true;
    } catch (error) {
      console.error('Error adding purchase:', error);
      return false;
    }
  }, [purchases]);

  const getAllPurchases = useCallback(() => {
    return purchases;
  }, [purchases]);

  const getTodayPurchases = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date).toISOString().split('T')[0];
      return purchaseDate === today;
    });
  }, [purchases]);

  const getPurchasesByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });
  }, [purchases]);

  const getTotalSpending = useCallback(() => {
    return purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  }, [purchases]);

  return useMemo(() => ({
    purchases,
    addPurchase,
    getAllPurchases,
    getTodayPurchases,
    getPurchasesByDateRange,
    getTotalSpending
  }), [purchases, addPurchase, getAllPurchases, getTodayPurchases, getPurchasesByDateRange, getTotalSpending]);
});
