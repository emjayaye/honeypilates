import { Tabs } from 'expo-router';
import React from 'react';

// Navigation now lives in the global <TopNav /> mounted from app/_layout.tsx
// (see components/top-nav.tsx). We keep this Tabs layout in place so the
// file-based routes under (tabs)/ still resolve, but the visible tab bar
// is suppressed via tabBarStyle.display: 'none'.
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        tabBarItemStyle: { display: 'none' },
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="membership" />
      <Tabs.Screen name="account" />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
