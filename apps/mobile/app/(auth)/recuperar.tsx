import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { requestPasswordRecovery } from "@cwg/api";
import { passwordRecoverySchema } from "@cwg/validation";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { CONFIG_MISSING_MESSAGE_PT, getMobileEnv, getSupabase } from "@/lib/supabase";

export default function RecoverScreen() {
  const configured = getMobileEnv().configured;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setInfo(null);
    if (!configured) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    const parsed = passwordRecoverySchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "E-mail inválido");
      return;
    }
    const client = getSupabase();
    if (!client) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    setLoading(true);
    const { error: authError } = await requestPasswordRecovery(
      client,
      parsed.data.email,
    );
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setInfo("Se o e-mail existir, enviamos o link de recuperação.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar senha</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enviar link</Text>
        )}
      </Pressable>
      <Link href="/(auth)/entrar" style={styles.link}>
        Voltar
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
  input: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  error: { color: "#B91C1C", marginBottom: 8 },
  info: { color: Colors.light.tint, marginBottom: 8 },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  link: { marginTop: 16, color: Colors.light.tint, fontWeight: "600" },
});
