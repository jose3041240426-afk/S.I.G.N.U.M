import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getCurrentUser, getUserStats } from "@/services/auth.service";
import { Colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Stats"> };

export default function StatsScreen({ navigation }: Props) {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await getCurrentUser();
        if (u) {
          const s = await getUserStats(u.id).catch(() => []);
          setStats(s);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const totalTranslations = stats.reduce((sum, s) => sum + (s.traducciones_realizadas || 0), 0);
  const totalMinutes = stats.reduce((sum, s) => sum + (s.tiempo_uso_minutos || 0), 0);
  const avgPrecision = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + (s.precision_promedio || 0), 0) / stats.length)
    : 0;

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Estadísticas</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalTranslations}</Text>
          <Text style={styles.statLabel}>Traducciones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalMinutes}</Text>
          <Text style={styles.statLabel}>Minutos activo</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgPrecision}%</Text>
          <Text style={styles.statLabel}>Precisión prom.</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.length}</Text>
          <Text style={styles.statLabel}>Días activo</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen diario</Text>
        {stats.length === 0 ? (
          <Text style={styles.empty}>Sin datos aún. Empieza a traducir para ver tus estadísticas.</Text>
        ) : (
          stats.slice(0, 14).map((s: any, i: number) => (
            <View key={i} style={styles.dayRow}>
              <Text style={styles.dayDate}>{new Date(s.fecha).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}</Text>
              <Text style={styles.dayStat}>{s.traducciones_realizadas || 0} trad.</Text>
              <Text style={styles.dayStat}>{s.tiempo_uso_minutos || 0} min</Text>
              <Text style={styles.dayStat}>{s.precision_promedio || 0}%</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  container: { padding: 24, backgroundColor: Colors.background, minHeight: "100%" },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24, paddingTop: 48 },
  backBtn: { color: Colors.textMuted, fontSize: 16 },
  title: { fontSize: 28, fontWeight: "800", color: Colors.text, letterSpacing: 1 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: "44%", backgroundColor: Colors.surface, borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: 32, fontWeight: "800", color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  section: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: Colors.textMuted, marginBottom: 12 },
  empty: { color: Colors.textMuted, fontSize: 14, textAlign: "center" },
  dayRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  dayDate: { color: Colors.text, fontSize: 13, flex: 2 },
  dayStat: { color: Colors.textMuted, fontSize: 12, flex: 1, textAlign: "right" },
});
