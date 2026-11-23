import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { signInWithEmail } from "@cwg/api";
import { DEMO_PERSONAS, type DemoPersona } from "@cwg/demo";
import { signInSchema } from "@cwg/validation";

import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { LegalAuthGate } from "@/components/LegalAuthGate";
import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import {
  readCultivationAuth,
  toDemoLegalAcceptance,
} from "@/lib/legal-auth";
import { getSupabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const {
    demoMode,
    signInDemoPersona,
    signInDemoCredentials,
    attachLegalToDemo,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function stampLegal() {
    const legal = await readCultivationAuth();
    if (legal) await attachLegalToDemo(toDemoLegalAcceptance(legal));
  }

  async function enterPersona(persona: DemoPersona) {
    setLoading(true);
    setError(null);
    await signInDemoPersona(persona);
    await stampLegal();
    setLoading(false);
    router.replace("/(tabs)");
  }

  async function onSubmit() {
    setError(null);
    if (demoMode) {
      setLoading(true);
      const result = await signInDemoCredentials(email, password);
      if (result.error) {
        setLoading(false);
        setError(result.error);
        return;
      }
      await stampLegal();
      setLoading(false);
      router.replace("/(tabs)");
      return;
    }
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    const client = getSupabase();
    if (!client) {
      setError("Cliente indisponível");
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

  const personaKeys = (Object.keys(DEMO_PERSONAS) as DemoPersona[]).filter(
    (k) => k !== "google",
  );

  return (
    <LegalAuthGate>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Entrar</Text>
        {demoMode ? (
          <Text style={styles.hint}>
            Modo demonstração — escolha um perfil, Google demo ou contas demo.
          </Text>
        ) : null}

        <GoogleAuthButton />

        {demoMode ? (
          <View style={styles.personas}>
            {personaKeys.map((key) => (
              <Pressable
                key={key}
                style={styles.persona}
                disabled={loading}
                onPress={() => void enterPersona(key)}
              >
                <Text style={styles.personaTitle}>{DEMO_PERSONAS[key].label}</Text>
                <Text style={styles.personaEmail}>{DEMO_PERSONAS[key].email}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={demoMode ? "ana@demo.cwg" : "E-mail"}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder={demoMode ? "demo1234" : "Senha"}
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={() => void onSubmit()} disabled={loading}>
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
      </ScrollView>
    </LegalAuthGate>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: Colors.light.background, flexGrow: 1 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.brand,
    marginBottom: 8,
  },
  hint: { color: Colors.light.muted, marginBottom: 16, fontSize: 13, lineHeight: 18 },
  personas: { gap: 8, marginBottom: 16, marginTop: 8 },
  persona: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  personaTitle: { fontWeight: "700", color: Colors.light.text },
  personaEmail: { color: Colors.light.muted, marginTop: 2, fontSize: 13 },
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
