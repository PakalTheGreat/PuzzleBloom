import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { AuthProvider } from "@/context/AuthContext";
import { RoleProvider } from "@/context/RoleContext";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  anchor: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RoleProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: "Onboarding" }} />
          <Stack.Screen
            name="specialist-edit"
            options={{ title: "Perfil especialista" }}
          />
          <Stack.Screen name="verification" options={{ title: "Verificação" }} />
          <Stack.Screen
            name="appointment-detail"
            options={{ title: "Agendamento" }}
          />
          <Stack.Screen name="solicitacoes" options={{ title: "Solicitações" }} />
          <Stack.Screen name="calendario" options={{ title: "Calendário" }} />
          <Stack.Screen name="crm/index" options={{ title: "CRM" }} />
          <Stack.Screen name="crm/[id]" options={{ title: "Cliente" }} />
          <Stack.Screen name="mensagens/index" options={{ title: "Mensagens" }} />
          <Stack.Screen name="mensagens/[id]" options={{ title: "Conversa" }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "CWG" }}
          />
        </Stack>
      </RoleProvider>
    </AuthProvider>
  );
}
