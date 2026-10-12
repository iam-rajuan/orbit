import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import '../global.css';

export default function RootLayout() {
  useEffect(() => {
    // Register PWA service worker on Web if supported
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('SW registration skipped:', err);
        });
      });
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#09090B' }}>
      <StatusBar style="light" />
      <Slot />
    </GestureHandlerRootView>
  );
}
