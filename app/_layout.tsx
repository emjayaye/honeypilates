import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { SkipLink, MainLandmark } from '@/components/skip-link';
import { TopNav } from '@/components/top-nav';
import { SiteFooter } from '@/components/site-footer';
import { AuthProvider } from '@/lib/auth-context';

import {
  useFonts,
  Fahkwang_400Regular,
  Fahkwang_500Medium,
  Fahkwang_600SemiBold,
} from '@expo-google-fonts/fahkwang';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';

// Honey Pilates theme — cream page, peach CTAs, ink text. We pin the
// nav theme to a custom one based on DefaultTheme so the status bar +
// header colors match the brand even on dark-mode devices.
const HoneyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F1E8DD',
    card: '#F1E8DD',
    text: '#1F1F1F',
    primary: '#EBC3A1',
    border: '#E8DCC9',
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fahkwang_400Regular,
    Fahkwang_500Medium,
    Fahkwang_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  // Set <html lang> on web so screen readers pronounce content correctly
  // (WCAG 3.1.1). RN web renders inside the host page, so we patch it once.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', 'en');
    }
  }, []);

  // Hold first paint until brand fonts load so we never flash a system
  // font (Fahkwang in particular has a very distinct silhouette).
  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <ThemeProvider value={HoneyTheme}>
        <SkipLink />
        <TopNav />
        <MainLandmark>
          <Stack>
            <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
            <Stack.Screen name="admin"       options={{ headerShown: false }} />
            <Stack.Screen name="waiver"      options={{ headerShown: false }} />
            <Stack.Screen name="contact"     options={{ headerShown: false }} />
            <Stack.Screen name="faq"         options={{ headerShown: false }} />
            <Stack.Screen name="instructors" options={{ headerShown: false }} />
            <Stack.Screen name="locations"   options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </MainLandmark>
        <SiteFooter />
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}
