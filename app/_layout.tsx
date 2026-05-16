import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

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

  // Hold first paint until brand fonts load so we never flash a system
  // font (Fahkwang in particular has a very distinct silhouette).
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={HoneyTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
