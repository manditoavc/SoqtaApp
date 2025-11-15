import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { MenuItem } from '@/types/order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BURGERS, SIDES, DRINKS, EXTRAS } from '@/constants/burgers';
import React from "react";

export const [ProductsProvider, useProducts] = createContextHook(() => {
  const [burgers, setBurgers] = useState<MenuItem[]>(BURGERS);
  const [sides, setSides] = useState<MenuItem[]>(SIDES);
  const [drinks, setDrinks] = useState<MenuItem[]>(DRINKS);
  const [extras, setExtras] = useState<MenuItem[]>(EXTRAS);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const storedBurgers = await AsyncStorage.getItem('burgers');
      const storedSides = await AsyncStorage.getItem('sides');
      const storedDrinks = await AsyncStorage.getItem('drinks');
      const storedExtras = await AsyncStorage.getItem('extras');

      if (storedBurgers) setBurgers(JSON.parse(storedBurgers));
      if (storedSides) setSides(JSON.parse(storedSides));
      if (storedDrinks) setDrinks(JSON.parse(storedDrinks));
      if (storedExtras) setExtras(JSON.parse(storedExtras));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const saveProducts = async (category: string, products: MenuItem[]) => {
    try {
      await AsyncStorage.setItem(category, JSON.stringify(products));
    } catch (error) {
      console.error(`Error saving ${category}:`, error);
    }
  };

  const addProduct = useCallback(async (product: Omit<MenuItem, 'id'>) => {
    try {
      const newProduct: MenuItem = {
        ...product,
        id: Date.now().toString(),
      };

      let updatedProducts: MenuItem[] = [];
      
      switch (product.category) {
        case 'burger':
          updatedProducts = [...burgers, newProduct];
          setBurgers(updatedProducts);
          await saveProducts('burgers', updatedProducts);
          break;
        case 'side':
          updatedProducts = [...sides, newProduct];
          setSides(updatedProducts);
          await saveProducts('sides', updatedProducts);
          break;
        case 'drink':
          updatedProducts = [...drinks, newProduct];
          setDrinks(updatedProducts);
          await saveProducts('drinks', updatedProducts);
          break;
        case 'extra':
          updatedProducts = [...extras, newProduct];
          setExtras(updatedProducts);
          await saveProducts('extras', updatedProducts);
          break;
      }

      console.log(`Producto agregado: ${newProduct.name}`);
      return true;
    } catch (error) {
      console.error('Error adding product:', error);
      return false;
    }
  }, [burgers, sides, drinks, extras]);

  const updateProduct = useCallback(async (productId: string, updates: Partial<MenuItem>) => {
    try {
      let updated = false;
      
      const updateInCategory = (products: MenuItem[], setter: React.Dispatch<React.SetStateAction<MenuItem[]>>, category: string) => {
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) {
          const updatedProducts = [...products];
          updatedProducts[index] = { ...updatedProducts[index], ...updates };
          setter(updatedProducts);
          saveProducts(category, updatedProducts);
          updated = true;
          console.log(`Producto actualizado: ${updatedProducts[index].name}`);
        }
      };

      updateInCategory(burgers, setBurgers, 'burgers');
      updateInCategory(sides, setSides, 'sides');
      updateInCategory(drinks, setDrinks, 'drinks');
      updateInCategory(extras, setExtras, 'extras');

      return updated;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  }, [burgers, sides, drinks, extras]);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      let deleted = false;

      const deleteFromCategory = (products: MenuItem[], setter: React.Dispatch<React.SetStateAction<MenuItem[]>>, category: string) => {
        const filtered = products.filter(p => p.id !== productId);
        if (filtered.length !== products.length) {
          setter(filtered);
          saveProducts(category, filtered);
          deleted = true;
          console.log(`Producto eliminado: ${productId}`);
        }
      };

      deleteFromCategory(burgers, setBurgers, 'burgers');
      deleteFromCategory(sides, setSides, 'sides');
      deleteFromCategory(drinks, setDrinks, 'drinks');
      deleteFromCategory(extras, setExtras, 'extras');

      return deleted;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }, [burgers, sides, drinks, extras]);

  const getAllProducts = useCallback(() => {
    return [...burgers, ...sides, ...drinks, ...extras];
  }, [burgers, sides, drinks, extras]);

  return useMemo(() => ({
    burgers,
    sides,
    drinks,
    extras,
    addProduct,
    updateProduct,
    deleteProduct,
    getAllProducts
  }), [burgers, sides, drinks, extras, addProduct, updateProduct, deleteProduct, getAllProducts]);
});
