/**
 * index.tsx — Entry Point
 * Yönlendirme tamamen _layout.tsx router guard tarafından yapılır.
 */
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0F1C', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );
}
