import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';

export default function Index() {
  const [target, setTarget] = useState<'/splash' | '/home' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const savedUser = await AsyncStorage.getItem('@soprano_user');
        if (savedUser) {
          // Kayıtlı kullanıcı var — direkt home'a git
          setTarget('/home');
        } else {
          // İlk açılış — splash → login akışı
          setTarget('/splash');
        }
      } catch {
        setTarget('/splash');
      }
    })();
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.deepNavy, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={target} />;
}
