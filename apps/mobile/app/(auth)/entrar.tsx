import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { signInWithEmail } from "@cwg/api";
import { signInSchema } from "@cwg/validation";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { CONFIG_MISSING_MESSAGE_PT, getMobileEnv, getSupabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const configured = getMobileEnv().configured;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!configured) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    const client = getSupabase();
    if (!client) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    setLoading(true);
    const { error: authError } = await signInWithEmail(client, parsed.data);
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar</Text>
      {!configured ? (
        <Text style={styles.warn}>{CONFIG_MISSING_MESSAGE_PT}</Text>
      ) : null}
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </Pressable>
      <Link href="/(auth)/cadastrar" style={styles.link}>
        Criar conta
      </Link>
      <Link href="/(auth)/recuperar" style={styles.link}>
        Esqueci a senha
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.brand,
    marginBottom: 16,
  },
  warn: { color: "#92400E", marginBottom: 12, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  error: { color: "#B91C1C", marginBottom: 8 },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  link: { marginTop: 16, color: Colors.light.tint, fontWeight: "600" },
});
