import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { storage } from "@/lib/storage";
import { db } from "@/lib/db";
import { Colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Settings"> };
type TabKey = "camara" | "autoAdd" | "tts" | "mantenimiento";

export default function SettingsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("camara");
  const [isMirrored, setIsMirrored] = useState(true);
  const [autoAddConfidence, setAutoAddConfidence] = useState(55);
  const [autoAddStableFrames, setAutoAddStableFrames] = useState(6);
  const [ttsRate, setTtsRate] = useState(0.95);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [captureSpeed, setCaptureSpeed] = useState(60);
  const [savedMessage, setSavedMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setIsMirrored(await storage.getBool("isCameraMirrored", true));
      setAutoAddConfidence(await storage.getNumber("autoAddConfidence", 55));
      setAutoAddStableFrames(await storage.getNumber("autoAddStableFrames", 6));
      setTtsRate(await storage.getNumber("ttsRate", 0.95));
      setTtsPitch(await storage.getNumber("ttsPitch", 1.0));
      setCaptureSpeed(await storage.getNumber("captureSpeed", 60));
    })();
  }, []);

  const handleSave = async () => {
    await storage.setItem("isCameraMirrored", String(isMirrored));
    await storage.setItem("autoAddConfidence", String(autoAddConfidence));
    await storage.setItem("autoAddStableFrames", String(autoAddStableFrames));
    await storage.setItem("ttsRate", String(ttsRate));
    await storage.setItem("ttsPitch", String(ttsPitch));
    await storage.setItem("captureSpeed", String(captureSpeed));
    setSavedMessage("Configuración guardada correctamente");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleClearCache = async () => {
    await db.clearAll();
    const keys = ["isCameraMirrored", "soundOnSena", "autoAddActive", "preventRepeat", "autoAddConfidence", "autoAddStableFrames", "ttsRate", "ttsPitch", "captureSpeed"];
    for (const k of keys) await storage.removeItem(k);
    setIsMirrored(true);
    setAutoAddConfidence(55);
    setAutoAddStableFrames(6);
    setTtsRate(0.95);
    setTtsPitch(1.0);
    setCaptureSpeed(60);
    setSavedMessage("Caché limpiado y configuración restablecida");
    setTimeout(() => setSavedMessage(""), 3000);
    setConfirmAction(null);
  };

  const handleResetModel = async () => {
    await db.clearSamples();
    await db.deleteModel("rf-letter");
    await db.deleteModel("rf-word");
    await db.deleteModel("rf-dynamic");
    setSavedMessage("Modelo vaciado completamente");
    setTimeout(() => setSavedMessage(""), 3000);
    setConfirmAction(null);
  };

  const handleReset = () => {
    setIsMirrored(true);
    setAutoAddConfidence(55);
    setAutoAddStableFrames(6);
    setTtsRate(0.95);
    setTtsPitch(1.0);
    setCaptureSpeed(60);
    storage.removeItem("isCameraMirrored");
    storage.removeItem("autoAddConfidence");
    storage.removeItem("autoAddStableFrames");
    storage.removeItem("ttsRate");
    storage.removeItem("ttsPitch");
    storage.removeItem("captureSpeed");
    setSavedMessage("Configuración restablecida a valores por defecto");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: "camara", label: "Cámara" },
    { key: "autoAdd", label: "Auto-Añadir" },
    { key: "tts", label: "Voz" },
    { key: "mantenimiento", label: "Mantenimiento" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {savedMessage ? (
        <View style={styles.toast}><Text style={styles.toastText}>{savedMessage}</Text></View>
      ) : null}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ajustes</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]} onPress={() => setActiveTab(t.key)}>
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.body}>
          {activeTab === "camara" && (
            <View style={styles.panel}>
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Efecto Espejo</Text>
                  <Text style={styles.settingHint}>Refleja horizontalmente la cámara</Text>
                </View>
                <Switch value={isMirrored} onValueChange={setIsMirrored} trackColor={{ false: "#555", true: Colors.primary }} />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Velocidad de Captura: {captureSpeed}ms</Text>
              </View>
            </View>
          )}
          {activeTab === "autoAdd" && (
            <View style={styles.panel}>
              <Text style={styles.settingLabel}>Confianza Mínima: {autoAddConfidence}%</Text>
              <Text style={styles.settingHint}>Precisión requerida del modelo (por defecto: 55%)</Text>
              <Text style={[styles.settingLabel, { marginTop: 8 }]}>Fotogramas Estables: {autoAddStableFrames}</Text>
              <Text style={styles.settingHint}>Frames consecutivos necesarios (por defecto: 6)</Text>
            </View>
          )}
          {activeTab === "tts" && (
            <View style={styles.panel}>
              <Text style={styles.settingLabel}>Velocidad: {ttsRate}x</Text>
              <Text style={styles.settingLabel}>Tono: {ttsPitch}</Text>
            </View>
          )}
          {activeTab === "mantenimiento" && (
            <View style={styles.panel}>
              {confirmAction === "resetModel" ? (
                <View style={styles.confirmRow}>
                  <TouchableOpacity onPress={() => setConfirmAction(null)} style={styles.cancelSmall}><Text style={{ color: Colors.textMuted }}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleResetModel} style={styles.confirmSmallDanger}><Text style={{ color: "#fff" }}>Confirmar</Text></TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setConfirmAction("resetModel")} style={styles.maintBtn}><Text style={styles.maintBtnText}>Vaciar Modelo</Text></TouchableOpacity>
              )}
              <Text style={styles.settingHintCenter}>Elimina todas las letras, palabras y señas registradas</Text>

              {confirmAction === "clearCache" ? (
                <View style={styles.confirmRow}>
                  <TouchableOpacity onPress={() => setConfirmAction(null)} style={styles.cancelSmall}><Text style={{ color: Colors.textMuted }}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleClearCache} style={styles.confirmSmallDanger}><Text style={{ color: "#fff" }}>Confirmar</Text></TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setConfirmAction("clearCache")} style={[styles.maintBtn, { marginTop: 12 }]}><Text style={styles.maintBtnText}>Limpiar Caché</Text></TouchableOpacity>
              )}
              <Text style={styles.settingHintCenter}>Borra todos los datos guardados y restablece ajustes</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn}><Text style={styles.resetBtnText}>Restablecer</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text style={styles.saveBtnText}>Guardar Cambios</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60, backgroundColor: Colors.background, minHeight: "100%" },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24, paddingTop: 48 },
  backBtn: { color: Colors.textMuted, fontSize: 16 },
  title: { fontSize: 28, fontWeight: "800", color: Colors.text, letterSpacing: 1 },
  toast: { position: "absolute", top: 16, left: "50%", transform: [{ translateX: -150 }], zIndex: 100, backgroundColor: Colors.cardDark, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 50, width: 300 },
  toastText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 14 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 3, borderBottomColor: Colors.primaryDark },
  tabText: { color: Colors.textMuted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: Colors.text },
  body: { padding: 20 },
  panel: { gap: 12 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  settingLabel: { color: Colors.text, fontSize: 15, fontWeight: "600" },
  settingHint: { color: Colors.textMuted, fontSize: 12 },
  settingHintCenter: { color: Colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 4 },
  confirmRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  cancelSmall: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: Colors.border },
  confirmSmallDanger: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.error },
  maintBtn: { paddingVertical: 14, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  maintBtnText: { color: Colors.textMuted, fontWeight: "600", fontSize: 15 },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  resetBtn: { flex: 1, paddingVertical: 14, borderRadius: 50, alignItems: "center", borderWidth: 2, borderColor: Colors.error },
  resetBtnText: { color: Colors.error, fontWeight: "600", fontSize: 15 },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 50, alignItems: "center", backgroundColor: Colors.primaryDark },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
