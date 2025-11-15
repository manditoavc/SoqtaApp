import { Tabs } from "expo-router";
import { CaseLower, ChefHat, Flame, Menu } from "lucide-react";
import React from "react";
import { useAuth } from '@/hooks/auth-store';

export default function TabLayout() {
  const { currentUser } = useAuth();
  const workArea = currentUser?.workArea;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#757575',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="cashier"
        options={{
          title: "Caja",
          tabBarIcon: ({ color, size }) => <CaseLower size={size} color={color} />,
          href: workArea === 'cashier' ? '/(tabs)/cashier' : null,
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: "Cocina",
          tabBarIcon: ({ color, size }) => <ChefHat size={size} color={color} />,
          href: workArea === 'kitchen' ? '/(tabs)/kitchen' : null,
        }}
      />
      <Tabs.Screen
        name="grill"
        options={{
          title: "Plancha",
          tabBarIcon: ({ color, size }) => <Flame size={size} color={color} />,
          href: workArea === 'grill' ? '/(tabs)/grill' : null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Más",
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}