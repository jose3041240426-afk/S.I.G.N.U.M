import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Landing"> };

export default function LandingScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>SIGNUM</Text>
        <Text style={styles.subtitle}>Traductor de Lengua de Señas Mexicana</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.secondaryBtnText}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, backgroundColor: Colors.background },
  header: { alignItems: "center", marginBottom: 48 },
  logo: { fontSize: 42, fontWeight: "800", color: Colors.text, letterSpacing: 2, marginBottom: 12 },
  subtitle: { fontSize: 16, color: Colors.textMuted, textAlign: "center" },
  actions: { width: "100%", gap: 16, paddingHorizontal: 20 },
  primaryBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 50, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondaryBtn: { borderWidth: 2, borderColor: Colors.primary, paddingVertical: 16, borderRadius: 50, alignItems: "center" },
  secondaryBtnText: { color: Colors.primary, fontSize: 17, fontWeight: "700" },
});
