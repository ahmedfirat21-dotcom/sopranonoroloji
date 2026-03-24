/* ═══════════════════════════════════════════════════════════
   SopranoChat Mobil — SwipeableBottomSheet
   Aşağı kaydırarak kapanabilen yeniden kullanılabilir bottom sheet.
   PanResponder ile sürükleme, Animated ile pürüzsüz geçişler.
   ═══════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Modal, StyleSheet, Animated, PanResponder,
  Dimensions, TouchableWithoutFeedback, Platform,
} from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Sheet yüksekliği — ekranın yüzdesi (0-1), varsayılan 0.7 */
  heightPercent?: number;
  children: React.ReactNode;
}

const DISMISS_THRESHOLD = 0.25; // %25 sürükleme → kapat
const VELOCITY_THRESHOLD = 800; // Hızlı fırlatma → kapat

export default function SwipeableBottomSheet({
  visible, onClose, heightPercent = 0.7, children,
}: Props) {
  const sheetHeight = SCREEN_H * heightPercent;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // ── Açılış / Kapanış Animasyonları ──
  const animateOpen = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 9,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [sheetHeight, onClose]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(sheetHeight);
      overlayOpacity.setValue(0);
      // Bir sonraki frame'de aç (Modal mount olduktan sonra)
      requestAnimationFrame(animateOpen);
    }
  }, [visible]);

  // ── PanResponder — Sürükleme Mantığı ──
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Sadece aşağı doğru belirgin bir hareket varsa yakala
        return gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        // Sadece aşağı izin ver (yukarı sürüklemeyi engelle)
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const draggedPercent = gestureState.dy / sheetHeight;
        if (draggedPercent > DISMISS_THRESHOLD || gestureState.vy > VELOCITY_THRESHOLD / 1000) {
          // Kapat
          animateClose();
        } else {
          // Geri yay
          Animated.spring(translateY, {
            toValue: 0,
            friction: 9,
            tension: 65,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={animateClose}>
      {/* Arka plan overlay — dokunarak kapat */}
      <TouchableWithoutFeedback onPress={animateClose}>
        <Animated.View style={[s.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          s.sheet,
          {
            height: sheetHeight,
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Sürükleme tutamağı */}
        <View style={s.dragHandleWrap}>
          <View style={s.dragHandle} />
        </View>

        {children}
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15,20,35,0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(139,92,246,0.15)',
    overflow: 'hidden',
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
