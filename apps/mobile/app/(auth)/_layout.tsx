import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="entrar" options={{ title: "Entrar" }} />
      <Stack.Screen name="cadastrar" options={{ title: "Cadastrar" }} />
      <Stack.Screen name="recuperar" options={{ title: "Recuperar senha" }} />
    </Stack>
  );
}
