import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';

const { width } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════
// ALERT BANNER — Glassmorphism Snackbar
//
// Yukarıdan süzülen cam efektli uyarı afişi.
// Otomatik 5 saniye sonra gizlenir.
// ═══════════════════════════════════════════════════════

interface AlertBannerProps {
  visible: boolean;
  message: string;
  type?: 'error' | 'success' | 'warning';
  actionLabel?: string;
  onAction?: () => void;
  onHide: () => void;
}

export default function AlertBanner({
  visible,
  message,
  type = 'error',
  actionLabel,
  onAction,
  onHide,
}: AlertBannerProps) {
  const slideY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const colorMap = {
    error: { glow: 'rgba(224,82,82,0.25)', border: 'rgba(224,82,82,0.3)', icon: '#E05252', text: '#FF8A8A' },
    warning: { glow: 'rgba(255,170,60,0.25)', border: 'rgba(255,170,60,0.3)', icon: '#FFAA3C', text: '#FFD080' },
    success: { glow: COLORS.primaryGlow, border: COLORS.primaryStroke, icon: COLORS.primary, text: COLORS.primary },
  };

  const colors = colorMap[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 50, friction: 12, tension: 50, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      // Otomatik gizle (5 saniye)
      const timer = setTimeout(() => {
        dismiss();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      slideY.setValue(-120);
      opacity.setValue(0);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: -120, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideY }], opacity },
      ]}
    >
      {/* Background */}
      <LinearGradient
        colors={['rgba(12,18,36,0.92)', 'rgba(8,14,28,0.95)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />

      {/* Glow border */}
      <View style={[styles.glowBorder, { shadowColor: colors.icon, borderColor: colors.border }]} />

      {/* Left glow */}
      <View style={[styles.leftGlow, { backgroundColor: colors.glow }]} />

      {/* Content */}
      <View style={styles.iconWrap}>
        <Ionicons
          name={type === 'error' ? 'alert-circle' : type === 'warning' ? 'warning' : 'checkmark-circle'}
          size={20}
          color={colors.icon}
        />
      </View>

      <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
        {message}
      </Text>

      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onAction}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.actionGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={dismiss}>
        <Ionicons name="close" size={16} color={COLORS.silverDark} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: SPACING.md,
    right: SPACING.md,
    minHeight: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    zIndex: 999,
    overflow: 'hidden',
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  leftGlow: {
    position: 'absolute',
    left: -10,
    top: -10,
    width: 60,
    height: 80,
    borderRadius: 40,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: FONTS.medium as any,
    lineHeight: 18,
  },
  actionBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionGrad: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionText: {
    color: COLORS.deepNavy,
    fontSize: 11,
    fontWeight: FONTS.bold as any,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
