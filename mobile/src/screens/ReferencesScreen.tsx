import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors } from "@/theme/colors";
import AppMenu from "@/components/ui/AppMenu";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "References"> };

interface RefItem {
  title: string;
  authors?: string;
  source?: string;
  year?: string;
  url: string;
}

const estadoArte: RefItem[] = [
  {
    title: "Aikyam: A video conferencing utility for deaf and dumb",
    authors: "Deshpande, K., Mashalkar, V., Mhaisekar, K., Naikwadi, A., & Ghotkar, A.",
    source: "9th International Conference on Smart Computing and Communications (ICSCC). IEEE Xplore",
    year: "2023",
    url: "http://ieeexplore.ieee.org/xpl/conhome/10334953/proceeding",
  },
  {
    title: "A comprehensive survey on recent advances and challenges in sign language recognition systems",
    authors: "Melanshia Violet, I. M., & Leena Sri, R.",
    source: "Discover Artificial Intelligence, 5(419)",
    year: "2025",
    url: "https://link.springer.com/article/10.1007/s44163-025-00629-7",
  },
  {
    title: "Speech-to-sign gesture translation for Kazakh: Dataset and sign gesture translation system",
    authors: "Mnuarbek, A., Bekarystankyzy, A., Turdalyuly, M., Oralbekova, D., & Dyussemkhanov, A.",
    source: "Computers, 15(3). MDPI",
    year: "2026",
    url: "https://www.mdpi.com/2073-431X/15/3/188",
  },
  {
    title: "Sign language interpretation using machine learning and artificial intelligence",
    authors: "Najib, F. M.",
    source: "Neural Computing and Applications, 37(2)",
    year: "2024",
    url: "https://link.springer.com/article/10.1007/s00521-024-10395-9",
  },
];

const datasets: RefItem[] = [
  {
    title: "Corpus del alfabeto dactilológico de la Lengua de Señas Mexicana (LSM) en entornos estáticos y dinámicos",
    authors: "CICESE",
    source: "Centro de Investigación Científica y de Educación Superior de Ensenada",
    year: "2026",
    url: "https://cicese.repositorioinstitucional.mx",
  },
  {
    title: "Dataset para el reconocimiento dinámico de Lengua de Señas Mexicana mediante secuencias de landmarks esqueléticos",
    authors: "ICKMejia",
    source: "MDPI Data Repository",
    year: "2025",
    url: "https://www.mdpi.com/journal/applsci",
  },
  {
    title: "MSL-150: Landmark dataset for 150 Mexican Sign Language isolated signs in healthcare and emergency contexts",
    authors: "MSL-150",
    source: "Zenodo",
    year: "2025",
    url: "https://zenodo.org/records/17783312",
  },
];

const marcoLegal: RefItem[] = [
  {
    title: "Code of Ethics and Professional Conduct",
    authors: "ACM & IEEE Computer Society",
    source: "Association for Computing Machinery",
    year: "2018",
    url: "https://www.acm.org/code-of-ethics",
  },
  {
    title: "Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)",
    authors: "Congreso de la Unión",
    source: "Diario Oficial de la Federación",
    year: "2010",
    url: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf",
  },
  {
    title: "Ley Federal del Derecho de Autor (LFDA)",
    authors: "Congreso de la Unión",
    source: "Diario Oficial de la Federación",
    year: "1996",
    url: "",
  },
  {
    title: "Norma Mexicana NMX-I-153/03-NYCE-2008: Tecnologías de la información - Accesibilidad para software (Basada en WCAG 2.1)",
    authors: "Secretaría de Economía / NYCE",
    source: "Estados Unidos Mexicanos",
    year: "2008",
    url: "https://www.w3.org/TR/WCAG21/",
  },
];

const instrumentos: RefItem[] = [
  {
    title: "SUS: A 'quick and dirty' usability scale",
    authors: "Brooke, J.",
    source: "Usability Evaluation in Industry, 189(194), 4–7",
    year: "1996",
    url: "",
  },
  {
    title: "The Quebec User Evaluation of Satisfaction with Assistive Technology (QUEST 2.0)",
    authors: "Demers, L., Weiss-Lambrou, R., & Ska, B.",
    source: "Assistive Technology, 14(2), 101–116",
    year: "2002",
    url: "",
  },
];

function RefCard({ item }: { item: RefItem }) {
  return (
    <View style={styles.refCard}>
      {item.url ? (
        <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
          <Text style={styles.refTitleLink}>{item.title}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.refTitle}>{item.title}</Text>
      )}
      {item.authors ? <Text style={styles.refAuthors}>{item.authors}</Text> : null}
      {item.source ? (
        <Text style={styles.refSource}>
          {item.source}{item.year ? ` (${item.year})` : ""}
        </Text>
      ) : null}
    </View>
  );
}

export default function ReferencesScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AppMenu navigation={navigation} />
        <Text style={styles.title}>Referencias</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>
          Fuentes documentales, datasets, normatividad y metodologías consultadas
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado del Arte e Investigaciones</Text>
          {estadoArte.map((r, i) => (
            <RefCard key={`ea-${i}`} item={r} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datasets Secundarios (Fuentes de Entrenamiento)</Text>
          {datasets.map((r, i) => (
            <RefCard key={`ds-${i}`} item={r} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marco Legal, Normatividad y Estándares Éticos</Text>
          {marcoLegal.map((r, i) => (
            <RefCard key={`ml-${i}`} item={r} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instrumentos y Metodología de Evaluación</Text>
          {instrumentos.map((r, i) => (
            <RefCard key={`im-${i}`} item={r} />
          ))}
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
  subtitle: { fontSize: 14, color: Colors.textMuted, textAlign: "center", marginBottom: 20 },
  section: { marginTop: 24, borderTopWidth: 1, borderColor: Colors.border, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: Colors.primaryLight, marginBottom: 12 },
  refCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  refTitle: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  refTitleLink: { fontSize: 14, fontWeight: "600", color: Colors.primaryLight, marginBottom: 4, textDecorationLine: "underline" },
  refAuthors: { fontSize: 13, color: Colors.textMuted, opacity: 0.8, marginBottom: 2 },
  refSource: { fontSize: 12, color: Colors.textMuted, opacity: 0.6, fontStyle: "italic" },
});
