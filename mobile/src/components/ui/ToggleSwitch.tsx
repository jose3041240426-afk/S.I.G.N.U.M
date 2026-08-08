import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function ToggleSwitch({ value, onValueChange }: ToggleSwitchProps) {
  const translateX = useRef(new Animated.Value(value ? 30 : -30)).current;
  const bgColor = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 30 : -30,
      duration: 300,
      useNativeDriver: true,
    }).start();
    Animated.timing(bgColor, {
      toValue: value ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [value, translateX, bgColor]);

  const sliderBg = bgColor.interpolate({
    inputRange: [0, 1],
    outputRange: ["lightgray", "#2196F3"],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
    >
      <Animated.View style={[styles.slider, { backgroundColor: sliderBg }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slider: {
    width: 60,
    height: 30,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  knob: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
});
