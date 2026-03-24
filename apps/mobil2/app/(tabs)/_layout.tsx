import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/ThemeContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { createRoomEvents } from '../../utils/createRoomEvents';

// ─────────────────────────────────────────────────────
// Center Create Button (Premium)
// ─────────────────────────────────────────────────────
function CenterButton({ onPress }: { onPress?: () => void }) {
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.centerBtnWrapper}>
      <Animated.View style={[styles.centerGlow, { opacity: glow }]} />
      <Animated.View style={[styles.centerGlowOuter, { opacity: Animated.multiply(glow, 0.4) }]} />
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <LinearGradient
          colors={['#2DD4BF', '#14A499', '#0E8A80']}
          style={styles.centerBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Üst cam shine */}
          <LinearGradient
            colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.0)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28, borderTopLeftRadius: 27, borderTopRightRadius: 27 }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <Ionicons name="add" size={30} color={'#FFFFFF'} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Custom Tab Bar
// ─────────────────────────────────────────────────────
function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const tabs = [
    { route: '/', icon: 'home', iconOutline: 'home-outline', label: 'Lobi' },
    { route: '/discover', icon: 'compass', iconOutline: 'compass-outline', label: 'Keşfet' },
    { route: '__center__', icon: 'add', iconOutline: 'add', label: '' },
    { route: '/messages', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline', label: 'Mesajlar' },
    { route: '/profile', icon: 'person', iconOutline: 'person-outline', label: 'Profil' },
  ];

  const isActive = (route: string) => {
    if (route === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(route);
  };

  return (
    <View style={[styles.bottomNavWrapper, { bottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
      <View style={styles.bottomNav}>
        {/* Subtle glow top edge */}
        <LinearGradient
          colors={isDark ? ['rgba(92,225,230,0.10)', 'transparent'] : ['rgba(5,163,164,0.06)', 'transparent']}
          style={styles.navTopGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {tabs.map((tab) => {
          if (tab.route === '__center__') {
            return (
              <CenterButton
                key="center"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  createRoomEvents.emit();
                }}
              />
            );
          }
          const active = isActive(tab.route);
          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(tab.route as any);
              }}
            >
              <Ionicons
                name={(active ? tab.icon : tab.iconOutline) as any}
                size={22}
                color={active ? COLORS.primary : COLORS.silverDark}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ═════════════════════════════════════════════════════
// TABS LAYOUT
// ═════════════════════════════════════════════════════
export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.deepNavy }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Native tab bar gizle — custom kullanacağız
          animation: 'fade',
          sceneStyle: { backgroundColor: COLORS.deepNavy },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Lobi' }} />
        <Tabs.Screen name="discover" options={{ title: 'Keşfet' }} />
        <Tabs.Screen name="messages" options={{ title: 'Mesajlar' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      </Tabs>
      <CustomTabBar />
    </View>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const styles = StyleSheet.create({
  bottomNavWrapper: {
    position: 'absolute',
    left: SPACING.sm,
    right: SPACING.sm,
    zIndex: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(8,14,28,0.93)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'visible',
    paddingHorizontal: SPACING.sm,
    ...(Platform.OS === 'android' ? {
      elevation: 16,
      shadowColor: '#000',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.4,
      shadowRadius: 14,
    }),
  },
  navTopGlow: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    borderRadius: 1,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    flex: 1,
  },
  navLabel: {
    color: COLORS.silverDark,
    fontSize: 10,
    fontWeight: FONTS.medium as any,
    marginTop: 3,
  },
  navLabelActive: {
    color: COLORS.primary,
  },

  /* ── Center Button ── */
  centerBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    flex: 1,
  },
  centerGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(45,212,191,0.35)',
  },
  centerGlowOuter: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(45,212,191,0.14)',
  },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
  },
});
