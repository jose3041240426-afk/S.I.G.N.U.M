import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Animated,
} from "react-native";
import { WebView } from "react-native-webview";
import Svg, { Path } from "react-native-svg";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useLivePrediction, type AutoResult } from "@/hooks/use-live-prediction";
import { useCapture } from "@/hooks/use-capture";
import { useModelTraining } from "@/hooks/use-model-training";
import { useTTS } from "@/hooks/use-tts";
import { usePhraseBuilder } from "@/hooks/use-phrase-builder";
import { getCurrentUser, recordTranslation, recordActiveTime } from "@/services/auth.service";
import { buildMediaPipeHTML } from "@/services/mediapipe-html";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { completePhrase } from "@/services/ai-complete.service";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { Colors } from "@/theme/colors";
import { ENV } from "@/lib/env";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Main"> };

const PREDICTION_MODES = [
  { key: "letters", label: "Deletrear" },
  { key: "words", label: "Palabras" },
  { key: "dynamic", label: "Movimiento" },
];

function CameraIcon({ color = "#fff", size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill={color} d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m8 3a5 5 0 0 0-5 5a5 5 0 0 0 5 5a5 5 0 0 0 5-5a5 5 0 0 0-5-5m0 2a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3" />
    </Svg>
  );
}

function MirrorIcon({ color = "#fff", size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill={color} d="M13 2v20h-2V2zM9 4.64V18.5H1.3zm6 0l7.7 13.86H15z" />
    </Svg>
  );
}

function VoicesIcon({ color = "#fff", size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" d="M4 10v4m4-7v10m4-13v16m4-13v10m4-7v4" />
    </Svg>
  );
}

function SendIcon({ color = "#fff", size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill={color} d="M3 20v-6l8-2l-8-2V4l19 8z" />
    </Svg>
  );
}

export default function MainScreen({ navigation }: Props) {
  const [mode, setMode] = useState("letters");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState("Cargando...");
  const [isMirrored, setIsMirrored] = useState(true);
  const [soundOnSena, setSoundOnSena] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [pointsColor, setPointsColor] = useState("#3b82f6");
  const [captureInterval, setCaptureInterval] = useState(60);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLetterFocused, setIsLetterFocused] = useState(false);

  const menuAnim = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(menuAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMenuVisible(false));
  };

  const captureActiveRef = useRef(false);
  const webViewRef = useRef<WebView>(null);
  const lastSpokenPredictionRef = useRef("");

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      const m = await storage.getBool("isCameraMirrored", true);
      setIsMirrored(m);
      const s = await storage.getBool("soundOnSena");
      setSoundOnSena(s);
      const pc = await storage.getItem("pointsColor");
      if (pc) setPointsColor(pc);
      const ci = await storage.getNumber("captureSpeed", 60);
      setCaptureInterval(ci);
    })();
  }, []);

  const {
    data: liveData, cameraOn, cameraError, setCameraError, toggleCamera,
    reloadModels, startAutoCapture, stopAutoCapture, classifyAuto,
    handleMediaPipeResult,
  } = useLivePrediction(mode, captureActiveRef);

  const {
    letterToCapture, setLetterToCapture, wordToCapture, setWordToCapture,
    dynamicToCapture, setDynamicToCapture, captureState,
    registeredLetters, registeredWords, registeredDynamic,
    fetchRegisteredLetters, fetchRegisteredWords, fetchRegisteredDynamic,
    startLetterRecording, startWordRecording, startDynamicRecording,
    startManualSample, stopManualSample, stopRecording,
    removeLetter, removeWord, removeDynamic,
  } = useCapture();

  const {
    isTraining, trainingMessage, trainLetters,
    isTrainingWords, trainingWordsMessage, trainWords,
    isTrainingDynamic, trainingDynamicMessage, trainDynamic,
  } = useModelTraining();

  const handleAutoTranslated = useCallback((label: string, confidence: number) => {
    if (!currentUser?.id || !label) return;
    recordTranslation(currentUser.id, 1, "Señas", label, confidence).catch(() => {});
  }, [currentUser?.id]);

  const {
    phrase, setPhrase,
    autoAddActive, setAutoAddActive, preventRepeat, setPreventRepeat,
    addLetter, addWord, addSpace, backspace, tryAutoAdd, resetStableCount,
  } = usePhraseBuilder(handleAutoTranslated);

  const { speak, speakPhrase, resetLastSpoken } = useTTS();

  useEffect(() => {
    if (liveData.localModelReady) setStatusMessage("Predicción local activa - Modelos cargados");
    else setStatusMessage("Modelos no encontrados. Entrena tu modelo.");
  }, [liveData.localModelReady]);

  useEffect(() => {
    fetchRegisteredLetters();
    fetchRegisteredWords();
    fetchRegisteredDynamic();
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRegisteredLetters();
    fetchRegisteredWords();
    fetchRegisteredDynamic();
  }, []));

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      recordActiveTime(currentUser.id, 1).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!soundOnSena || !liveData.handDetected) return;
    let currentPrediction = "";
    if (liveData.letter && liveData.confidence >= 55) currentPrediction = liveData.letter;
    if (liveData.word && liveData.wordConfidence >= 30) currentPrediction = liveData.word;
    if (liveData.dynamicSign && liveData.dynamicConfidence >= 30) currentPrediction = liveData.dynamicSign;
    if (!currentPrediction) return;
    if (currentPrediction !== lastSpokenPredictionRef.current) {
      lastSpokenPredictionRef.current = currentPrediction;
      speak(currentPrediction);
    }
  }, [liveData.letter, liveData.word, liveData.dynamicSign, liveData.handDetected, soundOnSena]);

  useEffect(() => {
    if (!liveData.handDetected || !autoAddActive) return;
    let currentPrediction = "";
    let currentConfidence = 0;
    let isWord = false;
    if (liveData.letter && liveData.confidence >= 55 && liveData.confidence > currentConfidence) {
      currentPrediction = liveData.letter; currentConfidence = liveData.confidence;
    }
    if (liveData.word && liveData.wordConfidence >= 80 && liveData.wordConfidence > currentConfidence) {
      currentPrediction = liveData.word; currentConfidence = liveData.wordConfidence; isWord = true;
    }
    if (liveData.dynamicSign && liveData.dynamicConfidence >= 80 && liveData.dynamicConfidence > currentConfidence) {
      currentPrediction = liveData.dynamicSign; currentConfidence = liveData.dynamicConfidence; isWord = true;
    }
    if (currentPrediction) tryAutoAdd(currentPrediction, currentConfidence, isWord);
  }, [liveData.letter, liveData.word, liveData.dynamicSign, liveData.handDetected, autoAddActive]);

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "detection") {
        handleMediaPipeResult?.current?.({
          handDetected: msg.handDetected,
          landmarks: msg.landmarks || [],
          snapshot: msg.snapshot || null,
        });
      } else if (msg.type === "error") {
        setCameraError(msg.message || "Error de cámara");
      }
    } catch {}
  }, [handleMediaPipeResult, setCameraError]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    resetLastSpoken();
    lastSpokenPredictionRef.current = "";
    stopAutoCapture();
  };

  const handleAIComplete = async () => {
    if (!phrase || phrase.length < 3 || isCompleting) return;
    setIsCompleting(true);
    try {
      const result = await completePhrase(phrase);
      if (result.error === "no_improve") setStatusMessage("La IA no pudo mejorar la frase");
      else if (result.error) setStatusMessage(`IA no disponible: ${result.error}`);
      else { setPhrase(result.completed); setStatusMessage("Frase corregida con IA"); }
    } catch { setStatusMessage("Error de conexión con la IA"); }
    finally { setIsCompleting(false); }
  };

  const handleSpeakPhrase = () => {
    const text = phrase || liveData.letter || liveData.word || liveData.dynamicSign;
    if (text) {
      speakPhrase(text);
      if (currentUser) {
        const conf = liveData.wordConfidence || liveData.dynamicConfidence || liveData.confidence || 0;
        recordTranslation(currentUser.id, 1, "Señas", text, conf).catch(() => {});
      }
    }
  };

  const handleTrainAll = async () => {
    await trainLetters();
    await trainWords();
    await trainDynamic();
    fetchRegisteredLetters();
    fetchRegisteredWords();
    fetchRegisteredDynamic();
    await reloadModels();
  };

  const webViewHTML = buildMediaPipeHTML(isMirrored, captureInterval, pointsColor);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={openMenu} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SIGNUM</Text>
      </View>

      {menuVisible && (
        <View style={styles.menuOverlay}>
          <Animated.View style={[styles.menuBackdrop, { opacity: menuAnim }]}>
            <TouchableOpacity style={styles.menuBackdropTouch} onPress={closeMenu} />
          </Animated.View>
          <Animated.View style={[styles.menuPanel, { transform: [{ translateX: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-300, 0] }) }] }]}>
            <Text style={styles.menuTitle}>Opciones</Text>
            <TouchableOpacity onPress={closeMenu} style={styles.menuItem}>
              <Text style={styles.menuItemText}>Registrar palabras</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { closeMenu(); navigation.navigate("Stats"); }} style={styles.menuItem}>
              <Text style={styles.menuItemText}>Estadísticas</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { closeMenu(); navigation.navigate("Profile"); }} style={styles.menuItem}>
              <Text style={styles.menuItemText}>Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { closeMenu(); navigation.navigate("Settings"); }} style={styles.menuItem}>
              <Text style={styles.menuItemText}>Ajustes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { closeMenu(); navigation.navigate("About"); }} style={styles.menuItem}>
              <Text style={styles.menuItemText}>Acerca de</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Conecta con el mundo usando Lengua de Señas Mexicana.</Text>
        <Text style={styles.statusMsg}>{statusMessage}</Text>

        {captureState.isRecording && (
          <View style={styles.recordingBanner}>
            <Text style={styles.recordingText}>
              Registrando "{captureState.label}": {captureState.samplesCount}/{captureState.requiredSamples} muestras
            </Text>
          </View>
        )}

        <View style={styles.cameraContainer}>
          {cameraOn ? (
            <WebView
              ref={webViewRef}
              source={{ html: webViewHTML, baseUrl: "https://app.signum.local/" }}
              style={styles.cameraView}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              allowFileAccess
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              mediaCapturePermissionGrantType="grant"
              startInLoadingState
              originWhitelist={["*"]}
              renderLoading={() => (
                <View style={styles.cameraLoading}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={{ color: Colors.textMuted, marginTop: 8 }}>Iniciando cámara...</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.cameraOff}>
              <Text style={styles.cameraOffText}>Cámara apagada</Text>
            </View>
          )}
          {cameraError ? <Text style={styles.cameraError}>{cameraError}</Text> : null}

          <View style={styles.cameraControls}>
            <TouchableOpacity onPress={toggleCamera} style={styles.camBtn}>
              <CameraIcon size={26} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsMirrored((p) => {
                const v = !p;
                storage.setItem("isCameraMirrored", String(v));
                return v;
              })}
              style={[styles.camBtn, isMirrored && { backgroundColor: Colors.primary }]}
            >
              <MirrorIcon size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSpeakPhrase} style={styles.camBtn}>
              <VoicesIcon size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modeSelector}>
          {PREDICTION_MODES.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeBtn, mode === m.key && styles.modeBtnActive]}
              onPress={() => handleModeChange(m.key)}
            >
              <Text style={[styles.modeBtnText, mode === m.key && styles.modeBtnTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!captureState.isRecording ? (
          <>
            {(mode === "letters" || mode === "dynamic") && (
              <View style={styles.captureRow}>
                <Text style={styles.captureLabel}>
                  {mode === "dynamic" ? "Letra a registrar con movimiento:" : "Letra a registrar:"}
                </Text>
                <View style={styles.captureInputRow}>
                  <TextInput
                    style={[styles.letterInput, isLetterFocused && styles.letterInputFocused]}
                    value={letterToCapture}
                    onChangeText={(t) => { setLetterToCapture(t.toUpperCase().slice(0, 1)); setWordToCapture(""); setDynamicToCapture(""); }}
                    onFocus={() => setIsLetterFocused(true)}
                    onBlur={() => setIsLetterFocused(false)}
                    maxLength={1}
                    placeholder="A"
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity
                    style={[styles.recordBtn, (!letterToCapture || !cameraOn || captureState.isRecording) && styles.disabledBtn]}
                    onPress={mode === "dynamic" ? () => startDynamicRecording(letterToCapture) : () => startLetterRecording(letterToCapture)}
                    disabled={captureState.isRecording || !letterToCapture || !cameraOn}
                  >
                    <SendIcon size={26} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {(mode === "words" || mode === "dynamic") && (
              <View style={styles.captureRow}>
                <Text style={styles.captureLabel}>
                  {mode === "dynamic" ? "Palabra a registrar con movimiento:" : "Palabra a registrar:"}
                </Text>
                <View style={styles.captureInputRow}>
                  <TextInput
                    style={styles.wordInput}
                    value={wordToCapture}
                    onChangeText={(t) => { setWordToCapture(t.slice(0, 30)); setLetterToCapture(""); setDynamicToCapture(""); }}
                    placeholder="Ej. Amor, Hola, Gracias..."
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity
                    style={[styles.recordBtn, (!wordToCapture || !cameraOn || captureState.isRecording) && styles.disabledBtn]}
                    onPress={mode === "dynamic" ? () => startDynamicRecording(wordToCapture) : () => startWordRecording(wordToCapture)}
                    disabled={captureState.isRecording || !wordToCapture || !cameraOn}
                  >
                    <SendIcon size={26} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.dynamicRecordingPanel}>
            <Text style={styles.dynamicTitle}>Grabando LSM con Movimiento</Text>
            <Text style={styles.dynamicLabel}>Seña: "{captureState.label}"</Text>
            <Text style={styles.dynamicProgress}>{captureState.samplesCount} / {captureState.requiredSamples} muestras</Text>
            <TouchableOpacity onPress={stopRecording} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancelar Grabación</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.phraseSection}>
          <Text style={styles.captureLabel}>Transcripción:</Text>
          <TextInput
            style={styles.phraseInput}
            value={phrase}
            onChangeText={setPhrase}
            placeholder="La transcripción aparecerá aquí..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
          />
          <View style={styles.predictionRow}>
            {liveData.letter ? (
              <Text style={styles.predLetter}>{liveData.letter} <Text style={styles.predConf}>({liveData.confidence}%)</Text></Text>
            ) : liveData.word ? (
              <Text style={styles.predWord}>{liveData.word} <Text style={styles.predConf}>({liveData.wordConfidence}%)</Text></Text>
            ) : liveData.dynamicSign ? (
              <Text style={styles.predDynamic}>{liveData.dynamicSign} <Text style={styles.predConf}>({liveData.dynamicConfidence}%)</Text></Text>
            ) : <Text style={styles.predNone}>—</Text>}
          </View>
          <View style={styles.phraseActions}>
            <TouchableOpacity onPress={addSpace} style={styles.smallBtn}><Text style={styles.smallBtnText}>Espacio</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => {
              let toAdd = ""; let addConf = 0; let isW = false;
              if (liveData.letter && liveData.confidence >= 55) { toAdd = liveData.letter; addConf = liveData.confidence; }
              if (liveData.word && liveData.wordConfidence >= 30 && liveData.wordConfidence > addConf) { toAdd = liveData.word; addConf = liveData.wordConfidence; isW = true; }
              if (liveData.dynamicSign && liveData.dynamicConfidence >= 30 && liveData.dynamicConfidence > addConf) { toAdd = liveData.dynamicSign; isW = true; addConf = liveData.dynamicConfidence; }
              if (!toAdd) return;
              if (isW) addWord(toAdd.trim()); else addLetter(toAdd.trim());
              speak(toAdd.trim());
              if (currentUser) recordTranslation(currentUser.id, 1, "Señas", toAdd.trim(), addConf).catch(() => {});
            }} style={styles.addBtn}><Text style={styles.addBtnText}>Añadir (+)</Text></TouchableOpacity>
            <TouchableOpacity onPress={backspace} style={styles.smallBtn}><Text style={styles.smallBtnText}>Borrar</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleAIComplete} disabled={isCompleting || phrase.length < 3} style={[styles.aiBtn, (isCompleting || phrase.length < 3) && styles.disabledBtn]}>
              {isCompleting ? <ActivityIndicator size="small" color="#c084fc" /> : <Text style={styles.aiBtnText}>IA</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.toggles}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Auto-Añadir</Text>
              <ToggleSwitch value={autoAddActive} onValueChange={setAutoAddActive} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>No repetir</Text>
              <ToggleSwitch value={preventRepeat} onValueChange={setPreventRepeat} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Voz al detectar</Text>
              <ToggleSwitch value={soundOnSena} onValueChange={(v) => { setSoundOnSena(v); storage.setItem("soundOnSena", String(v)); }} />
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleTrainAll} disabled={isTraining || isTrainingWords || isTrainingDynamic} style={[styles.trainBtn, (isTraining || isTrainingWords || isTrainingDynamic) && styles.disabledBtn]}>
          <Text style={styles.trainBtnText}>{isTraining || isTrainingWords || isTrainingDynamic ? "Entrenando..." : "Entrenar modelo"}</Text>
        </TouchableOpacity>
        {(trainingMessage || trainingWordsMessage || trainingDynamicMessage) ? (
          <Text style={styles.trainMsg}>{trainingMessage || trainingWordsMessage || trainingDynamicMessage}</Text>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, borderBottomWidth: 1, borderColor: Colors.border, position: "relative" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.text, letterSpacing: 1, position: "absolute", left: 0, right: 0, top: 56, textAlign: "center", textAlignVertical: "center", display: "flex", alignItems: "center", justifyContent: "center" },
  headerBtn: { padding: 8 },
  headerBtnText: { fontSize: 22, color: Colors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  subtitle: { fontSize: 15, color: Colors.textMuted, textAlign: "center" },
  statusMsg: { fontSize: 12, color: Colors.textMuted, textAlign: "center", opacity: 0.7 },
  recordingBanner: { backgroundColor: "rgba(251,191,36,0.2)", padding: 10, borderRadius: 12 },
  recordingText: { color: Colors.warning, fontWeight: "600", textAlign: "center", fontSize: 14 },
  cameraContainer: { borderRadius: 16, overflow: "hidden", borderWidth: 4, borderColor: "rgba(255,255,255,0.6)", backgroundColor: "#000" },
  cameraView: { width: "100%", height: 280, backgroundColor: "#000" },
  cameraLoading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  cameraOff: { height: 280, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  cameraOffText: { color: "#666", fontSize: 18 },
  cameraError: { color: "#fca5a5", fontSize: 12, textAlign: "center", padding: 8, backgroundColor: "rgba(239,68,68,0.15)" },
  cameraControls: { flexDirection: "row", justifyContent: "center", gap: 20, paddingVertical: 12, position: "absolute", bottom: 0, left: 0, right: 0 },
  camBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modeSelector: { flexDirection: "row", borderRadius: 25, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: Colors.border },
  modeBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  modeBtnActive: { backgroundColor: Colors.primaryDark },
  modeBtnText: { color: Colors.textMuted, fontWeight: "600", fontSize: 14 },
  modeBtnTextActive: { color: "#fff" },
  captureRow: { gap: 8 },
  captureLabel: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  captureInputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  letterInput: { width: 56, height: 56, backgroundColor: "#F3F3F3", borderRadius: 10, textAlign: "center", fontSize: 28, fontWeight: "800", color: Colors.textDark, borderWidth: 2, borderColor: "transparent", overflow: "hidden" },
  letterInputFocused: { borderColor: "#4A9DEC", backgroundColor: "#fff", shadowColor: "#4A9DEC", shadowOpacity: 0.2, shadowRadius: 7, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  wordInput: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 16, color: Colors.textDark },
  recordBtn: { width: 56, height: 56, backgroundColor: Colors.primaryDark, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  disabledBtn: { opacity: 0.4 },
  dynamicRecordingPanel: { backgroundColor: "rgba(15,23,42,0.15)", borderRadius: 16, padding: 20, alignItems: "center", gap: 10, borderWidth: 2, borderColor: Colors.primaryDark, borderStyle: "dashed" },
  dynamicTitle: { fontSize: 16, fontWeight: "700", color: Colors.primaryDark },
  dynamicLabel: { fontSize: 15, fontWeight: "600", color: Colors.text },
  dynamicProgress: { fontSize: 14, color: Colors.textMuted },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.error },
  cancelBtnText: { color: Colors.error, fontSize: 13, fontWeight: "600" },
  phraseSection: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, gap: 8 },
  phraseInput: { backgroundColor: "#fff", borderRadius: 12, padding: 14, minHeight: 100, fontSize: 16, color: Colors.textDark, textAlignVertical: "top" },
  predictionRow: { paddingVertical: 4 },
  predLetter: { color: Colors.primary, fontWeight: "700", fontSize: 15 },
  predWord: { color: Colors.orange, fontWeight: "700", fontSize: 15 },
  predDynamic: { color: Colors.purple, fontWeight: "700", fontSize: 15 },
  predConf: { fontSize: 11, fontWeight: "400" },
  predNone: { color: Colors.textMuted, fontSize: 15 },
  phraseActions: { flexDirection: "row", gap: 6, flexWrap: "wrap", borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingTop: 8 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: "rgba(255,255,255,0.05)" },
  smallBtnText: { color: Colors.textMuted, fontSize: 12, fontWeight: "600" },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.primaryDark },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  aiBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "rgba(168,85,247,0.1)", borderWidth: 1, borderColor: Colors.purple },
  aiBtnText: { color: "#c084fc", fontSize: 12, fontWeight: "600" },
  toggles: { gap: 8, paddingTop: 4, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toggleLabel: { color: Colors.textMuted, fontSize: 13, fontWeight: "500" },
  trainBtn: { backgroundColor: Colors.primaryDark, paddingVertical: 16, borderRadius: 50, alignItems: "center", marginTop: 8 },
  trainBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  trainMsg: { backgroundColor: "rgba(0,0,0,0.3)", padding: 8, borderRadius: 8, fontSize: 12, color: Colors.textMuted, textAlign: "center" },
  menuOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  menuBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
  menuBackdropTouch: { flex: 1 },
  menuPanel: { position: "absolute", top: 0, left: 0, bottom: 0, width: 280, backgroundColor: Colors.surfaceSolid, padding: 24, paddingTop: 80, borderRightWidth: 1, borderColor: Colors.border },
  menuTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 20 },
  menuItem: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  menuItemText: { color: Colors.textMuted, fontSize: 15, fontWeight: "600" },
});
