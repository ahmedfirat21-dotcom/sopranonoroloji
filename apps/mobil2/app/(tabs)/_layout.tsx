import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Image } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { useUser, UserProvider } from '../../contexts/UserContext';
import { ThemeProvider } from '../../constants/ThemeContext';
import * as Haptics from 'expo-haptics';
import { createRoomEvents } from '../../utils/createRoomEvents';

// Müşterinin Görselindeki Birebir Renkler
const PURPLE_ACTIVE = '#9D4EDD'; // Görseldeki canlı mor
const GRAY_INACTIVE = '#696969';
const OLED_BLACK = '#000000';
const NAV_BACKGROUND = 'rgba(10, 10, 15, 0.95)'; // Tamamen siyaha yakın hafif blur

// ─────────────────────────────────────────────────────
// Animasyonlu Nav Item (Görseldeki gibi alttan mor çizgili)
// ─────────────────────────────────────────────────────
function NavItem({ tab, active, onPress }: { tab: any, active: boolean, onPress: () => void }) {
  return (
    <TouchableOpacity style={st.navItem} activeOpacity={0.7} onPress={onPress}>
      <Ionicons
        name={active ? tab.iconActive : tab.iconOutline}
        size={24}
        color={active ? PURPLE_ACTIVE : GRAY_INACTIVE}
      />
      <Text style={[st.navLabel, { color: active ? PURPLE_ACTIVE : GRAY_INACTIVE }]}>
        {tab.label}
      </Text>
      {/* Aktif sekmenin altındaki mor çizgi */}
      {active && <View style={st.activeIndicator} />}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────
// Custom Tab Bar
// ─────────────────────────────────────────────────────
function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const tabs = [
    { route: '/', iconActive: 'home', iconOutline: 'home-outline', label: 'Ana Sayfa' },
    { route: '/discover', iconActive: 'compass', iconOutline: 'compass-outline', label: 'Keşfet' },
    { route: '/leaderboard', iconActive: 'trophy', iconOutline: 'trophy-outline', label: 'Liderlik' },
    { route: '/messages', iconActive: 'chatbubble', iconOutline: 'chatbubble-outline', label: 'Mesajlar' },
    { route: '/profile', iconActive: 'person', iconOutline: 'person-outline', label: 'Profil' },
  ];

  const isActive = (route: string) => {
    if (route === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(route);
  };

  const hapticImpact = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={st.bottomNavWrapper}>
      <BlurView intensity={80} tint="dark" style={[st.bottomNavInner, { paddingBottom: insets.bottom || 10 }]}>
        {tabs.map((tab) => (
          <NavItem
            key={tab.route}
            tab={tab}
            active={isActive(tab.route)}
            onPress={() => {
              hapticImpact();
              router.push(tab.route as any);
            }}
          />
        ))}
      </BlurView>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Massive Floating "S" Sonar Button (Görseldeki gibi ortada süzülen dev S)
// ─────────────────────────────────────────────────────
function FloatingSonarS() {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateWave = (val: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 3000, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    animateWave(wave1, 0);
    animateWave(wave2, 1500);
  }, []);

  return (
    <View style={st.floatingSWrap} pointerEvents="box-none">
      <Animated.View style={[st.sonarWave, { 
        transform: [{ scale: wave1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.5] }) }], 
        opacity: wave1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.4, 0] }) 
      }]} />
      <Animated.View style={[st.sonarWave, { 
        transform: [{ scale: wave2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.5] }) }], 
        opacity: wave2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.4, 0] }) 
      }]} />
      
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          createRoomEvents.emit();
        }}
        style={st.sButton}
      >
        {/* Özel S Logosu */}
        <Text style={st.sText}>S</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: OLED_BLACK }}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Custom bar kullanıyoruz
          animation: 'fade',
          sceneStyle: { backgroundColor: OLED_BLACK },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
        <Tabs.Screen name="discover" options={{ title: 'Keşfet' }} />
        <Tabs.Screen name="leaderboard" options={{ title: 'Liderlik' }} />
        <Tabs.Screen name="messages" options={{ title: 'Mesajlar' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      </Tabs>
      
      {/* Dev süzülen logo arka tablonun üstünde konumlanır */}
      <FloatingSonarS />
      
      {/* En alt Tab Bar */}
      <CustomTabBar />
    </View>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const st = StyleSheet.create({
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    zIndex: 100,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  bottomNavInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 8,
    backgroundColor: NAV_BACKGROUND,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 50,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8, // Yazının alt hizasına inmesi için
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: PURPLE_ACTIVE,
    shadowColor: PURPLE_ACTIVE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingSWrap: {
    position: 'absolute',
    bottom: 65, // Tab barın üzerinde havada
    left: '50%',
    transform: [{ translateX: -30 }], // 60px width
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  sonarWave: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(92,225,230,0.3)', // Cyan radar renkli
    borderWidth: 1,
    borderColor: 'rgba(92,225,230,0.8)',
  },
  sButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00E5FF', // Cyan parlak
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  sText: {
    color: '#000',
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: -2,
  },
});
