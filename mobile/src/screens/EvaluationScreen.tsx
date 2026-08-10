import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors } from "@/theme/colors";
import AppMenu from "@/components/ui/AppMenu";
import { saveEvaluation, type EvaluacionData } from "@/services/auth.service";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Evaluation"> };

const initialForm: EvaluacionData = {
  resolucion: "",
  iluminacion: "",
  distancia: "",
  p4_uso_frecuente: null,
  p5_complicado: null,
  p6_facil_interactuar: null,
  p7_necesita_ayuda: null,
  p8_traduccion_natural: null,
  voz_satisfaccion: null,
  esfuerzo_mental: "",
  dispositivo: "",
  navegador: "",
  experiencia_previa: "",
  problemas: "",
  sugerencias: "",
  experiencia_general: null,
  recomendaria: "",
  facil_aprender: null,
  util_educativo: null,
  funcion_mas_util: "",
  senas_dificiles: "",
};

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {options.map((o) => {
        const selected = value === o;
        return (
          <TouchableOpacity
            key={o}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => onChange(o)}
          >
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <View style={styles.radioDot} /> : null}
            </View>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function LikertRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.likertRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.likertBtn, value === n && styles.likertBtnSelected]}
            onPress={() => onChange(n)}
          >
            <Text style={[styles.likertText, value === n && styles.likertTextSelected]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function EvaluationScreen({ navigation }: Props) {
  const [form, setForm] = useState<EvaluacionData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof EvaluacionData, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveEvaluation(form);
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Error al guardar la evaluación");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <AppMenu navigation={navigation} />
          <Text style={styles.title}>Evaluación</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.thanks}>¡Gracias por tu evaluación!</Text>
          <Text style={styles.thanksSub}>
            Tus respuestas nos ayudarán a mejorar Signum para toda la comunidad.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AppMenu navigation={navigation} />
        <Text style={styles.title}>Evaluación</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.pageTitle}>Evaluación de Signum</Text>
        <Text style={styles.pageSub}>Tu opinión nos ayuda a mejorar. Todos los campos son opcionales.</Text>

        {/* Sección 1: Configuración de uso */}
        <Text style={styles.sectionTitle}>Configuración de uso</Text>

        <RadioGroup
          label="¿Qué resolución tiene la cámara web que usaste?"
          options={["Alta resolución (HD/Full HD)", "Resolución estándar", "No estoy seguro/a"]}
          value={form.resolucion}
          onChange={(v) => update("resolucion", v)}
        />

        <RadioGroup
          label="¿Cómo describirías la iluminación del lugar donde usaste el sistema?"
          options={["Buena y constante", "Un poco oscura o con luz variable"]}
          value={form.iluminacion}
          onChange={(v) => update("iluminacion", v)}
        />

        <RadioGroup
          label="¿A qué distancia de la cámara te colocaste aproximadamente?"
          options={[
            "Muy cerca (menos de 50 cm)",
            "A una distancia cómoda (50 cm a 1 metro)",
            "Lejos (más de 1 metro)",
          ]}
          value={form.distancia}
          onChange={(v) => update("distancia", v)}
        />

        <RadioGroup
          label="¿Qué tipo de dispositivo usaste?"
          options={["Laptop", "PC de escritorio", "Tablet", "Celular"]}
          value={form.dispositivo}
          onChange={(v) => update("dispositivo", v)}
        />

        <RadioGroup
          label="¿Qué navegador usaste?"
          options={["Google Chrome", "Firefox", "Microsoft Edge", "Safari", "Otro"]}
          value={form.navegador}
          onChange={(v) => update("navegador", v)}
        />

        <RadioGroup
          label="¿Habías usado antes algún sistema de reconocimiento de señas?"
          options={["Sí", "No"]}
          value={form.experiencia_previa}
          onChange={(v) => update("experiencia_previa", v)}
        />

        {/* Sección 2: Experiencia de uso */}
        <Text style={styles.sectionTitle}>Experiencia de uso</Text>
        <Text style={styles.sectionHint}>1 = Totalmente en desacuerdo · 5 = Totalmente de acuerdo</Text>

        <LikertRow
          label="Me gustaría usar esta herramienta seguido en mis clases o reuniones de trabajo."
          value={form.p4_uso_frecuente}
          onChange={(v) => update("p4_uso_frecuente", v)}
        />
        <LikertRow
          label="El sistema es complicado y difícil de entender."
          value={form.p5_complicado}
          onChange={(v) => update("p5_complicado", v)}
        />
        <LikertRow
          label="Fue fácil interactuar con la plataforma y usarla."
          value={form.p6_facil_interactuar}
          onChange={(v) => update("p6_facil_interactuar", v)}
        />
        <LikertRow
          label="Siento que necesitaría ayuda de alguien técnico para poder usar este sistema."
          value={form.p7_necesita_ayuda}
          onChange={(v) => update("p7_necesita_ayuda", v)}
        />
        <LikertRow
          label="Las funciones para traducir mis señas se sienten naturales y bien integradas."
          value={form.p8_traduccion_natural}
          onChange={(v) => update("p8_traduccion_natural", v)}
        />
        <LikertRow
          label="En general, mi experiencia con Signum fue satisfactoria."
          value={form.experiencia_general}
          onChange={(v) => update("experiencia_general", v)}
        />
        <LikertRow
          label="Fue fácil aprender a hacer las señas que el sistema reconoce."
          value={form.facil_aprender}
          onChange={(v) => update("facil_aprender", v)}
        />
        <LikertRow
          label="Signum sería útil en entornos educativos o laborales."
          value={form.util_educativo}
          onChange={(v) => update("util_educativo", v)}
        />

        {/* Sección 3: Satisfacción */}
        <Text style={styles.sectionTitle}>Satisfacción</Text>

        <LikertRow
          label="¿Qué tan satisfecho/a quedaste con la voz que genera el sistema al interpretar tus señas?"
          value={form.voz_satisfaccion}
          onChange={(v) => update("voz_satisfaccion", v)}
        />

        <RadioGroup
          label="¿Sentiste que tuviste que esforzarte mucho mentalmente para que el sistema entendiera tus señas?"
          options={[
            "Fue muy fácil, no requirió esfuerzo.",
            "Requirió un poco de atención, pero fue fluido.",
            "Tuve que concentrarme mucho y hacer mucho esfuerzo mental.",
          ]}
          value={form.esfuerzo_mental}
          onChange={(v) => update("esfuerzo_mental", v)}
        />

        <RadioGroup
          label="¿Recomendarías Signum a otras personas?"
          options={["Sí", "No", "Tal vez"]}
          value={form.recomendaria}
          onChange={(v) => update("recomendaria", v)}
        />

        {/* Sección 4: Comentarios */}
        <Text style={styles.sectionTitle}>Comentarios</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>¿Qué función te pareció más útil?</Text>
          <TextInput
            style={styles.input}
            multiline
            value={form.funcion_mas_util}
            onChangeText={(v) => update("funcion_mas_util", v)}
            placeholder="Deletrear letras, palabras completas, auto-añadir, voz al detectar..."
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>¿Hubo alguna letra o palabra específica que el sistema no reconociera bien?</Text>
          <TextInput
            style={styles.input}
            multiline
            value={form.senas_dificiles}
            onChangeText={(v) => update("senas_dificiles", v)}
            placeholder="Por ejemplo: la letra M, la palabra 'gracias', etc."
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>¿Hubo algún problema?</Text>
          <TextInput
            style={styles.input}
            multiline
            value={form.problemas}
            onChangeText={(v) => update("problemas", v)}
            placeholder="Describe cualquier problema que hayas tenido..."
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Sugerencias o recomendaciones</Text>
          <TextInput
            style={styles.input}
            multiline
            value={form.sugerencias}
            onChangeText={(v) => update("sugerencias", v)}
            placeholder="¿Qué mejorarías de Signum?"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? "Enviando..." : "Enviar evaluación"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: Colors.background, minHeight: "100%", paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: "800", color: Colors.text, letterSpacing: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  pageTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  pageSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primaryLight,
    marginTop: 24,
    marginBottom: 4,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 16,
  },
  sectionHint: { fontSize: 12, color: Colors.textMuted, fontStyle: "italic", marginBottom: 12 },
  fieldGroup: { marginTop: 14 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 8, lineHeight: 19 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 6,
  },
  optionSelected: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderColor: Colors.primary,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  optionText: { fontSize: 14, color: Colors.textMuted, flex: 1 },
  optionTextSelected: { color: Colors.text, fontWeight: "600" },
  likertRow: { flexDirection: "row", gap: 6 },
  likertBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  likertBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(59,130,246,0.2)",
  },
  likertText: { fontSize: 16, fontWeight: "700", color: Colors.textMuted },
  likertTextSelected: { color: Colors.text },
  input: {
    width: "100%",
    minHeight: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.3)",
    color: Colors.text,
    fontSize: 15,
    padding: 12,
    textAlignVertical: "top",
  },
  submitBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
  thanks: { fontSize: 22, fontWeight: "800", color: Colors.text, textAlign: "center", marginTop: 40 },
  thanksSub: { fontSize: 15, color: Colors.textMuted, textAlign: "center", marginTop: 12, lineHeight: 22 },
});
