import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { LEGAL_COPY } from "@cwg/shared";
import { activateRolesFromIntent, recordLegalAndAge } from "@cwg/api";
import type { RoleIntent } from "@cwg/validation";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { CONFIG_MISSING_MESSAGE_PT, getSupabase } from "@/lib/supabase";

const INTENTS: { id: RoleIntent; title: string }[] = [
  { id: "find", title: "Encontrar especialistas" },
  { id: "offer", title: "Oferecer serviços" },
  { id: "both", title: "Ambos" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, configured, refreshMe } = useAuth();
  const [step, setStep] = useState<"legal" | "roles">("legal");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [intent, setIntent] = useState<RoleIntent>("find");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function finishLegal() {
    setError(null);
    if (!age || !terms || !privacy) {
      setError("Confirme idade e aceite Termos e Privacidade.");
      return;
    }
    if (!configured || !user) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    const client = getSupabase();
    if (!client) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    setLoading(true);
    const result = await recordLegalAndAge(client, user.id);
    setLoading(false);
    if (result.age.error || result.terms.error || result.privacy.error) {
      setError("Falha ao registrar aceites.");
      return;
    }
    setStep("roles");
  }

  async function finishRoles() {
    setError(null);
    if (!configured || !user) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    const client = getSupabase();
    if (!client) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    setLoading(true);
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ?? null;
    const { error: roleError } = await activateRolesFromIntent(
      client,
      user.id,
      intent,
      fullName,
    );
    setLoading(false);
    if (roleError) {
      setError(roleError.message);
      return;
    }
    await refreshMe();
    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding</Text>
      {step === "legal" ? (
        <>
          <Text style={styles.body}>{LEGAL_COPY.ageBody}</Text>
          <Pressable onPress={() => setAge((v) => !v)} style={styles.check}>
            <Text>{age ? "☑" : "☐"} Tenho 18+</Text>
          </Pressable>
          <Pressable onPress={() => setTerms((v) => !v)} style={styles.check}>
            <Text>{terms ? "☑" : "☐"} Aceito Termos</Text>
          </Pressable>
          <Pressable onPress={() => setPrivacy((v) => !v)} style={styles.check}>
            <Text>{privacy ? "☑" : "☐"} Aceito Privacidade</Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.button} onPress={finishLegal} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continuar</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          {INTENTS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setIntent(item.id)}
              style={[
                styles.intent,
                intent === item.id && styles.intentActive,
              ]}
            >
              <Text style={styles.intentText}>{item.title}</Text>
            </Pressable>
          ))}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.button} onPress={finishRoles} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Concluir</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.light.brand,
    marginBottom: 16,
  },
  body: { fontSize: 15, color: Colors.light.muted, marginBottom: 12 },
  check: { paddingVertical: 10 },
  intent: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  intentActive: { borderColor: Colors.light.tint, backgroundColor: "#E8F5EF" },
  intentText: { fontWeight: "600", color: Colors.light.text },
  error: { color: "#B91C1C", marginVertical: 8 },
  button: {
    marginTop: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
