import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Dimensions, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../constants/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors: C, isDark, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const insets = useSafeAreaInsets();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [dmEnabled, setDmEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [onlineHidden, setOnlineHidden] = useState(false);
  const [profileHidden, setProfileHidden] = useState(false);
  const [selectedLang, setSelectedLang] = useState('Türkçe');

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış', style: 'destructive', onPress: () => { logout(); router.replace('/login'); } },
    ]);
  };

  const handlePasswordChange = () => {
    Alert.alert('Şifre Değiştir', 'Şifre değiştirme bağlantısı e-posta adresinize gönderilecek.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Gönder', onPress: () => Alert.alert('Başarılı', 'E-postanızı kontrol edin.') },
    ]);
  };

  const handleLanguage = () => {
    Alert.alert('Dil Seçin', undefined, [
      { text: 'Türkçe', onPress: () => setSelectedLang('Türkçe') },
      { text: 'English', onPress: () => setSelectedLang('English') },
      { text: 'العربية', onPress: () => setSelectedLang('العربية') },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const SettingRow = ({ icon, label, value, onPress, toggle, toggleValue, danger }: any) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={toggle ? 1 : 0.6}>
      <View style={[styles.settingIcon, { backgroundColor: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)' }]}>
        <Ionicons name={icon} size={18} color={danger ? '#EF4444' : COLORS.silver} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, danger && { color: '#EF4444' }]}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onPress}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(35,186,196,0.4)' }}
          thumbColor={toggleValue ? COLORS.primary : '#666'}
        />
      ) : (
        !danger && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.deepNavy }]}>
      <LinearGradient
        colors={isDark ? ['#0B1222', '#070D1A'] : ['#F2F2F7', '#EEEDF5']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.silver} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingHorizontal: 14 }} showsVerticalScrollIndicator={false}>
        {/* Hesap */}
        <Text style={styles.sectionTitle}>HESAP</Text>
        <View style={styles.section}>
          <SettingRow icon="person" label="Profil Düzenle" onPress={() => router.push('/profile')} />
          <SettingRow icon="mail" label="E-posta" value={(user as any)?.email || 'Bağlı değil'} />
        </View>

        {/* Güvenlik */}
        <Text style={styles.sectionTitle}>GÜVENLİK</Text>
        <View style={styles.section}>
          <SettingRow icon="key" label="Şifre Değiştir" onPress={handlePasswordChange} />
          <SettingRow icon="finger-print" label="Biyometrik Kilit" toggle toggleValue={biometricEnabled} onPress={() => setBiometricEnabled(!biometricEnabled)} />
          <SettingRow icon="shield-checkmark" label="İki Adımlı Doğrulama" toggle toggleValue={twoFAEnabled} onPress={() => setTwoFAEnabled(!twoFAEnabled)} />
        </View>

        {/* Bildirimler */}
        <Text style={styles.sectionTitle}>BİLDİRİMLER</Text>
        <View style={styles.section}>
          <SettingRow icon="notifications" label="Push Bildirimleri" toggle toggleValue={pushEnabled} onPress={() => setPushEnabled(!pushEnabled)} />
          <SettingRow icon="chatbubble" label="DM Bildirimleri" toggle toggleValue={dmEnabled} onPress={() => setDmEnabled(!dmEnabled)} />
          <SettingRow icon="volume-high" label="Sesler" toggle toggleValue={soundEnabled} onPress={() => setSoundEnabled(!soundEnabled)} />
        </View>

        {/* Görünüm & Dil */}
        <Text style={styles.sectionTitle}>GÖRÜNÜM & DİL</Text>
        <View style={styles.section}>
          <SettingRow icon="moon" label="Karanlık Mod" toggle toggleValue={isDark} onPress={toggleTheme} />
          <SettingRow icon="language" label="Dil" value={selectedLang} onPress={handleLanguage} />
        </View>

        {/* Gizlilik */}
        <Text style={styles.sectionTitle}>GİZLİLİK</Text>
        <View style={styles.section}>
          <SettingRow icon="eye-off" label="Çevrimiçi Durumu Gizle" toggle toggleValue={onlineHidden} onPress={() => setOnlineHidden(!onlineHidden)} />
          <SettingRow icon="lock-closed" label="Profili Gizle" toggle toggleValue={profileHidden} onPress={() => setProfileHidden(!profileHidden)} />
          <SettingRow icon="ban" label="Engellenen Kullanıcılar" onPress={() => Alert.alert('Engellenenler', 'Henüz engellenen kullanıcı yok.')} />
        </View>

        {/* Hakkında */}
        <Text style={styles.sectionTitle}>HAKKINDA</Text>
        <View style={styles.section}>
          <SettingRow icon="document-text" label="Gizlilik Politikası" onPress={() => Alert.alert('Gizlilik Politikası', 'Bu bölüm yakında eklenecek.')} />
          <SettingRow icon="reader" label="Kullanım Şartları" onPress={() => Alert.alert('Kullanım Şartları', 'Bu bölüm yakında eklenecek.')} />
          <SettingRow icon="information-circle" label="Versiyon" value="2.0.0 Elite" />
        </View>

        {/* Çıkış */}
        <View style={[styles.section, { marginTop: 12 }]}>
          <SettingRow icon="log-out" label="Çıkış Yap" danger onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  settingIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14, fontWeight: '600', color: '#E2E8F0',
  },
  settingValue: {
    fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 1,
  },
});
