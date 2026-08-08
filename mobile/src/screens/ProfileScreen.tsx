import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getCurrentUser, signOut, getUserProfile, getUserTranslations, getUserLogins } from "@/services/auth.service";
import { Colors } from "@/theme/colors";
import AppMenu from "@/components/ui/AppMenu";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Profile"> };

export default function ProfileScreen({ navigation }: Props) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [translations, setTranslations] = useState<any[]>([]);
  const [logins, setLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await getCurrentUser();
        setUser(u);
        if (u) {
          const [p, t, l] = await Promise.all([
            getUserProfile(u.id).catch(() => null),
            getUserTranslations(u.id, 10).catch(() => []),
            getUserLogins(u.id, 5).catch(() => []),
          ]);
          setProfile(p);
          setTranslations(t);
          setLogins(l);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AppMenu navigation={navigation} />
        <Text style={styles.title}>Mi Perfil</Text>
      </View>

      {user ? (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.email?.[0] || "U").toUpperCase()}</Text>
          </View>
          <Text style={styles.email}>{user.email}</Text>
          {profile && (
            <Text style={styles.name}>{[profile.nombre, profile.apellido_paterno].filter(Boolean).join(" ")}</Text>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Últimas traducciones</Text>
            {translations.length === 0 ? (
              <Text style={styles.empty}>Sin traducciones aún</Text>
            ) : (
              translations.slice(0, 5).map((t: any, i: number) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemText}>{t.texto_traducido || t.texto_original}</Text>
                  <Text style={styles.itemSubtext}>{t.precision}% - {new Date(t.fecha_hora).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.empty}>No has iniciado sesión</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  container: { padding: 24, backgroundColor: Colors.background, minHeight: "100%" },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: "800", color: Colors.text, letterSpacing: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryDark, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#fff" },
  email: { fontSize: 16, color: Colors.textMuted, marginBottom: 4 },
  name: { fontSize: 20, fontWeight: "600", color: Colors.text, marginBottom: 20 },
  section: { width: "100%", marginTop: 16, borderTopWidth: 1, borderColor: Colors.border, paddingTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: Colors.textMuted, marginBottom: 10 },
  empty: { color: Colors.textMuted, fontSize: 14, textAlign: "center" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  itemText: { color: Colors.text, fontSize: 14 },
  itemSubtext: { color: Colors.textMuted, fontSize: 11 },
  signOutBtn: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 50, borderWidth: 1, borderColor: Colors.error },
  signOutText: { color: Colors.error, fontWeight: "600", fontSize: 15 },
});
