import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { getCurrentUser } from "@/services/auth.service";
import { Colors } from "@/theme/colors";

import LandingScreen from "@/screens/LandingScreen";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import MainScreen from "@/screens/MainScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import StatsScreen from "@/screens/StatsScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import AboutScreen from "@/screens/AboutScreen";
import ReferencesScreen from "@/screens/ReferencesScreen";
import EvaluationScreen from "@/screens/EvaluationScreen";

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Profile: undefined;
  Stats: undefined;
  Settings: undefined;
  About: undefined;
  References: undefined;
  Evaluation: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      setInitialRoute(user ? "Main" : "Landing");
    }).catch(() => {
      setInitialRoute("Landing");
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: Colors.primary,
          background: Colors.background,
          card: Colors.surfaceSolid,
          text: Colors.text,
          border: Colors.border,
          notification: Colors.primary,
        },
      }}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="References" component={ReferencesScreen} />
        <Stack.Screen name="Evaluation" component={EvaluationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
