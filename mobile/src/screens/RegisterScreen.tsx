import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { signUp, getGeneros, getAuthErrorMessage } from "@/services/auth.service";
import { Colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Genero = { id_genero: number; genero: string };
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Register"> };

export default function RegisterScreen({ navigation }: Props) {
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idGenero, setIdGenero] = useState("");
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { getGeneros().then(setGeneros).catch(console.error); }, []);

  const handleSubmit = async () => {
    setError("");
    if (!idGenero) { setError("Selecciona un género"); return; }
    setLoading(true);
    try {
      await signUp(email, password, nombre, apellidoPaterno, apellidoMaterno, Number(idGenero));
      navigation.replace("Login");
    } catch (err: any) {
      setError(getAuthErrorMessage(err, "Error al registrarse"));
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Registrarse</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor="#666" />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Correo</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Apellido paterno</Text>
            <TextInput style={styles.input} value={apellidoPaterno} onChangeText={setApellidoPaterno} placeholder="García" placeholderTextColor="#666" />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#666" secureTextEntry />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Apellido materno</Text>
            <TextInput style={styles.input} value={apellidoMaterno} onChangeText={setApellidoMaterno} placeholder="López (opcional)" placeholderTextColor="#666" />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Género</Text>
            <View style={styles.picker}>
              {generos.slice(0, 3).map((g) => (
                <TouchableOpacity
                  key={g.id_genero}
                  style={[styles.genderOption, Number(idGenero) === g.id_genero && styles.genderSelected]}
                  onPress={() => setIdGenero(String(g.id_genero))}
                >
                  <Text style={[styles.genderText, Number(idGenero) === g.id_genero && styles.genderTextSelected]}>{g.genero}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Crear cuenta</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>¿Ya tienes cuenta? Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: Colors.background },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 28, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: 24, fontWeight: "700", color: Colors.text, textAlign: "center", marginBottom: 24 },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  half: { flex: 1 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textMuted, marginBottom: 4 },
  input: { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 12, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  picker: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  genderOption: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  genderSelected: { backgroundColor: Colors.primaryDark, borderColor: Colors.primary },
  genderText: { color: Colors.textMuted, fontSize: 13 },
  genderTextSelected: { color: "#fff", fontWeight: "600" },
  error: { backgroundColor: "rgba(239,68,68,0.2)", color: "#fca5a5", padding: 10, borderRadius: 8, fontSize: 13, textAlign: "center", marginTop: 8, marginBottom: 8 },
  btn: { backgroundColor: Colors.primaryDark, paddingVertical: 16, borderRadius: 50, alignItems: "center", marginTop: 12 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  link: { color: Colors.primaryLight, textAlign: "center", marginTop: 20, fontSize: 14 },
  back: { color: Colors.textMuted, textAlign: "center", marginTop: 12, fontSize: 14 },
});
