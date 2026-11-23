import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { signUpWithEmail } from "@cwg/api";
import { signUpSchema } from "@cwg/validation";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

export default function SignUpScreen() {
  const router = useRouter();
  const { demoMode, registerDemo } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setInfo(null);
    const parsed = signUpSchema.safeParse({
      email,
      password,
      full_name: fullName,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    if (demoMode) {
      setLoading(true);
      await registerDemo(parsed.data);
      setLoading(false);
      router.replace("/onboarding");
      return;
    }
    const client = getSupabase();
    if (!client) {
      setError("Cliente indisponível");
      return;
    }
    setLoading(true);
    const { data, error: authError } = await signUpWithEmail(client, parsed.data);
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (data.session) {
      router.replace("/onboarding");
      return;
    }
    setInfo("Conta criada. Confirme o e-mail e entre para continuar.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastrar</Text>
      {demoMode ? (
        <Text style={styles.hint}>
          Modo demonstração — após o cadastro você escolhe o papel no onboarding.
        </Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        value={fullName}
        onChangeText={setFullName}
      />
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
        placeholder="Senha (mín. 8)"
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <Pressable style={styles.button} onPress={() => void onSubmit()} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Criar conta</Text>
        )}
      </Pressable>
      <Link href="/(auth)/entrar" style={styles.link}>
        Já tenho conta
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
    marginBottom: 8,
  },
  hint: { color: Colors.light.muted, marginBottom: 16, fontSize: 13 },
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
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  link: { marginTop: 16, color: Colors.light.tint, fontWeight: "600" },
});
