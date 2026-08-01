import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { signIn, getAuthErrorMessage, probeSupabaseConnectivity } from "@/services/auth.service";
import { Colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Login"> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (err: any) {
      let msg = getAuthErrorMessage(err, "Error al iniciar sesión");
      if (err?.name === "AuthRetryableFetchError" || err?.status === 0) {
        const diag = await probeSupabaseConnectivity();
        msg = `${msg} [Diagnóstico: ${diag}]`;
      }
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.label}>Correo</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#666" secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>¿No tienes cuenta? Registrarse</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: Colors.background },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: 24, fontWeight: "700", color: Colors.text, textAlign: "center", marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 14, color: Colors.text, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  error: { backgroundColor: "rgba(239,68,68,0.2)", color: "#fca5a5", padding: 10, borderRadius: 8, fontSize: 13, textAlign: "center", marginBottom: 12 },
  btn: { backgroundColor: Colors.primaryDark, paddingVertical: 16, borderRadius: 50, alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  link: { color: Colors.primaryLight, textAlign: "center", marginTop: 20, fontSize: 14 },
  back: { color: Colors.textMuted, textAlign: "center", marginTop: 16, fontSize: 14 },
});
