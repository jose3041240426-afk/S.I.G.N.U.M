import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "About"> };

export default function AboutScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Acerca de</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.logo}>SIGNUM</Text>
        <Text style={styles.version}>v1.0.0</Text>
        <Text style={styles.desc}>
          Traductor de Lengua de Señas Mexicana (LSM) en tiempo real.
          {'\n\n'}
          Utiliza inteligencia artificial y modelos de Machine Learning para reconocer
          señas de la LSM y convertirlas a texto y voz en español.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tecnologías</Text>
          <Text style={styles.tech}>• MediaPipe Hand Landmarker</Text>
          <Text style={styles.tech}>• Random Forest Classifier (TS)</Text>
          <Text style={styles.tech}>• Expo / React Native</Text>
          <Text style={styles.tech}>• Supabase</Text>
          <Text style={styles.tech}>• Groq AI (Llama)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desarrollado por</Text>
          <Text style={styles.tech}>Equipo SIGNUM</Text>
          <Text style={styles.tech}>Proyecto educativo y de accesibilidad</Text>
        </View>

        <TouchableOpacity
          style={styles.refBtn}
          onPress={() => navigation.navigate("References")}
        >
          <Text style={styles.refBtnText}>Referencias</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: Colors.background, minHeight: "100%" },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24, paddingTop: 48 },
  backBtn: { color: Colors.textMuted, fontSize: 16 },
  title: { fontSize: 28, fontWeight: "800", color: Colors.text, letterSpacing: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  logo: { fontSize: 32, fontWeight: "800", color: Colors.text, textAlign: "center", letterSpacing: 2 },
  version: { fontSize: 14, color: Colors.textMuted, textAlign: "center", marginTop: 4 },
  desc: { fontSize: 15, color: Colors.textMuted, textAlign: "center", marginTop: 16, lineHeight: 22 },
  section: { marginTop: 24, borderTopWidth: 1, borderColor: Colors.border, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: Colors.text, marginBottom: 8 },
  tech: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  refBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  refBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primaryLight,
  },
});
