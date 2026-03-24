import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from '../constants/theme';
import { ThemeProvider, useTheme } from '../constants/ThemeContext';
import { UserProvider, useUser } from '../contexts/UserContext';
import {
  registerForPushNotifications,
  savePushTokenToBackend,
  setupNotificationListeners,
} from '../services/push';

// Expo Router/React Navigation transition sırasında oluşan framework hatası — bizden kaynaklı değil
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

// Native splash'i otomatik gizlemeyi engelle — biz kontrol edeceğiz
SplashScreen.preventAutoHideAsync().catch(() => {});

function InnerLayout() {
  const { colors, isDark } = useTheme();
  const { token: authToken } = useUser();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

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
        // Burada router.push ile ilgili ekrana yönlendirme yapılabilir
      },
    );

    return () => listeners.remove();
  }, [authToken]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.deepNavy },
          animation: 'fade',
          animationDuration: 400,
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <ThemeProvider>
          <InnerLayout />
        </ThemeProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
