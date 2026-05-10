import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox, View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { ThemeProvider, useTheme } from '../constants/ThemeContext';
import { UserProvider, useUser } from '../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerForPushNotifications,
  savePushTokenToBackend,
  setupNotificationListeners,
} from '../services/push';

// Expo Router/React Navigation transition sırasında oluşan framework hatası — bizden kaynaklı değil
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

// Native splash'i otomatik gizlemeyi engelle — biz kontrol edeceğiz
SplashScreen.preventAutoHideAsync().catch(() => {});

// ── DARK BACKGROUND constant ──
const DARK_BG = '#0A0F1C';

function InnerLayout() {
  const { colors, isDark } = useTheme();
  const { token: authToken, isLoggedIn, isProfileComplete, isLoading } = useUser();
  const router = useRouter();
  const [splashChecked, setSplashChecked] = useState(false);
  const [needsSplash, setNeedsSplash] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // ── Onboarding Router Guard ──
  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn) {
      // Çıkış yapmışsa veya giriş yapmamışsa, her zaman Splash'i göstererek lüks açılışı yapsın.
      // (Splash zaten 4.5 sn sonra login'e atıyor)
      router.replace('/splash');
    } else if (!isProfileComplete) {
      router.replace('/setup');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoading, isLoggedIn, isProfileComplete]);

  // Push notification kurulumu
  useEffect(() => {
    (async () => {
      const pushToken = await registerForPushNotifications();
      if (pushToken && authToken) {
        savePushTokenToBackend(pushToken, authToken);
      }
    })();

    const listeners = setupNotificationListeners(
      (notification) => {
        console.log('[Push] Bildirim geldi:', notification.request.content.title);
      },
      (response) => {
        const data = response.notification.request.content.data;
        console.log('[Push] Bildirime tıklandı:', data);
      },
    );

    return () => listeners.remove();
  }, [authToken]);

  return (
    <View style={{ flex: 1, backgroundColor: DARK_BG }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: DARK_BG },
          animation: 'fade',
          animationDuration: 250,
        }}
      >
        {/* (tabs) grubu — persistent bottom bar ile */}
        <Stack.Screen name="(tabs)" />
        {/* Tam ekran sayfalar — tabs gizli */}
        <Stack.Screen name="room" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="splash" options={{ animation: 'none' }} />
        <Stack.Screen name="setup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="leaderboard" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="chat" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: DARK_BG }}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: DARK_BG }}>
        <UserProvider>
          <ThemeProvider>
            <InnerLayout />
          </ThemeProvider>
        </UserProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
