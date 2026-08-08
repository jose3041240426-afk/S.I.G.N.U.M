import React, { useRef, useState } from "react";
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/AppNavigator";

const MENU_ENTRIES: { label: string; screen: keyof RootStackParamList }[] = [
  { label: "Registrar palabras", screen: "Main" },
  { label: "Estadísticas", screen: "Stats" },
  { label: "Perfil", screen: "Profile" },
  { label: "Ajustes", screen: "Settings" },
  { label: "Acerca de", screen: "About" },
];

type Props<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
};

export default function AppMenu<T extends keyof RootStackParamList>({ navigation }: Props<T>) {
  const [visible, setVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const open = () => {
    setVisible(true);
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const close = (cb?: () => void) => {
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
      cb?.();
    });
  };

  const goTo = (screen: keyof RootStackParamList) => {
    const state = navigation.getState();
    const current = state?.routes?.[state.index]?.name;
    close(() => {
      if (current !== screen) navigation.navigate(screen);
    });
  };

  return (
    <>
      <TouchableOpacity onPress={open} style={styles.btn}>
        <Text style={styles.btnText}>☰</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={() => close()}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, { opacity: anim }]}>
            <TouchableOpacity style={styles.backdropTouch} onPress={() => close()} />
          </Animated.View>
          <Animated.View
            style={[
              styles.panel,
              { transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-300, 0] }) }] },
            ]}
          >
            <Text style={styles.title}>Opciones</Text>
            {MENU_ENTRIES.map((e) => (
              <TouchableOpacity key={e.screen} onPress={() => goTo(e.screen)} style={styles.item}>
                <Text style={styles.itemText}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 8 },
  btnText: { fontSize: 22, color: Colors.text },
  overlay: { flex: 1 },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
  backdropTouch: { flex: 1 },
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: Colors.surfaceSolid,
    padding: 24,
    paddingTop: 80,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 20 },
  item: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  itemText: { color: Colors.textMuted, fontSize: 15, fontWeight: "600" },
});
