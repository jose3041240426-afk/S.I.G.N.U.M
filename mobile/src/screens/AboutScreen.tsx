import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors } from "@/theme/colors";
import AppMenu from "@/components/ui/AppMenu";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "About"> };

const DICCIONARIO_URL = "https://signum.animare.dev/diccionario-senas-mx.pdf";

const DESARROLLADORES = [
  { nombre: "José Manuel Guerrero Simental", rol: "Desarrollador" },
  { nombre: "Josué Joan Hernández Tavizón", rol: "Desarrollador" },
  { nombre: "Humberto Castillo Díaz", rol: "Desarrollador" },
  { nombre: "Manuel Alejandro Mathey Ortiz", rol: "Desarrollador" },
];

const TECNOLOGIAS = [
  "MediaPipe Hand Landmarker",
  "Random Forest Classifier (TS)",
  "Next.js / React",
  "Expo / React Native",
  "Supabase",
  "Groq AI (Llama)",
  "ElevenLabs TTS",
];

export default function AboutScreen({ navigation }: Props) {
  const openPdf = () => {
    Linking.openURL(DICCIONARIO_URL).catch(() => {
      Alert.alert("Error", "No se pudo abrir el diccionario. Revisa tu conexión a internet.");
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AppMenu navigation={navigation} />
        <Text style={styles.title}>Acerca de</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.logo}>SIGNUM</Text>
        <Text style={styles.version}>v1.0.0</Text>
        <Text style={styles.desc}>
          Traductor de Lengua de Señas Mexicana (LSM) en tiempo real.
          {"\n\n"}
          Signum es un proyecto escolar desarrollado como parte del programa académico de la{" "}
          <Text style={styles.highlight}>Universidad Tecnológica de Durango</Text>. Su propósito es crear una
          herramienta accesible y funcional que permita la traducción de la Lengua de Señas Mexicana (LSM) a
          texto y voz, utilizando visión por computadora y modelos de inteligencia artificial ejecutados
          directamente en el dispositivo.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cómo funciona</Text>
          <Text style={styles.body}>
            El sistema utiliza <Text style={styles.highlight}>MediaPipe Hands</Text> para la detección y
            seguimiento de manos en tiempo real, y un clasificador{" "}
            <Text style={styles.highlight}>Random Forest</Text> entrenado en el dispositivo para reconocer
            letras, palabras y señas dinámicas del abecedario mexicano. Todo el procesamiento se realiza
            localmente en el dispositivo del usuario, garantizando privacidad y respuesta inmediata sin
            necesidad de conexión a internet para la traducción.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tecnologías</Text>
          {TECNOLOGIAS.map((t) => (
            <Text key={t} style={styles.tech}>• {t}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desarrollado por</Text>
          <Text style={styles.tech}>Universidad Tecnológica de Durango</Text>
          {DESARROLLADORES.map((d) => (
            <Text key={d.nombre} style={styles.tech}>
              ✦ {d.nombre}
            </Text>
          ))}
          <Text style={styles.tech}>Proyecto educativo y de accesibilidad</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.refBtn} onPress={() => navigation.navigate("References")}>
            <Text style={styles.refBtnText}>Referencias</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refBtn} onPress={openPdf}>
            <Text style={styles.refBtnText}>Descargar diccionario LSM (PDF)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.refBtn, styles.primaryBtn]}
            onPress={() => navigation.navigate("Evaluation")}
          >
            <Text style={styles.primaryBtnText}>Evaluar proyecto</Text>
          </TouchableOpacity>

          <Text style={styles.opinionHint}>Tu opinión nos ayuda a mejorar</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: Colors.background, minHeight: "100%", paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: "800", color: Colors.text, letterSpacing: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  logo: { fontSize: 32, fontWeight: "800", color: Colors.text, textAlign: "center", letterSpacing: 2 },
  version: { fontSize: 14, color: Colors.textMuted, textAlign: "center", marginTop: 4 },
  desc: { fontSize: 14, color: Colors.textMuted, textAlign: "center", marginTop: 16, lineHeight: 22 },
  highlight: { color: Colors.primaryLight, fontWeight: "700" },
  section: { marginTop: 24, borderTopWidth: 1, borderColor: Colors.border, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: Colors.text, marginBottom: 8 },
  body: { fontSize: 14, color: Colors.textMuted, lineHeight: 21 },
  tech: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  actions: { marginTop: 28, gap: 10 },
  refBtn: {
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  refBtnText: { fontSize: 15, fontWeight: "700", color: Colors.primaryLight },
  primaryBtn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
  opinionHint: { fontSize: 12, color: Colors.textMuted, textAlign: "center", opacity: 0.6, marginTop: 4 },
});
