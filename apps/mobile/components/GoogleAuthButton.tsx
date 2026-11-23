import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { signInWithGoogle } from "@cwg/api";
import { DEMO_PERSONAS } from "@cwg/demo";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import {
  readCultivationAuth,
  toDemoLegalAcceptance,
} from "@/lib/legal-auth";
import { getSupabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export function GoogleAuthButton() {
  const router = useRouter();
  const { demoMode, signInDemoPersona, attachLegalToDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDemo, setConfirmDemo] = useState(false);

  async function continueDemo() {
    setLoading(true);
    setError(null);
    await signInDemoPersona("google");
    const legal = await readCultivationAuth();
    if (legal) await attachLegalToDemo(toDemoLegalAcceptance(legal));
    setLoading(false);
    router.replace("/(tabs)");
  }

  async function onPress() {
    setError(null);
    if (demoMode) {
      setConfirmDemo(true);
      return;
    }
    const client = getSupabase();
    if (!client) {
      setError("Cliente indisponível");
      return;
    }
    const site = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const redirectTo = site ? `${site}/auth/callback` : "cwg://auth/callback";
    setLoading(true);
    const { data, error: oauthError } = await signInWithGoogle(client, {
      redirectTo,
    });
    setLoading(false);
    if (oauthError) {
      setError(oauthError.message);
      return;
    }
    if (data.url) {
      await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.button} disabled={loading} onPress={() => void onPress()}>
        {loading ? (
          <ActivityIndicator color={Colors.light.brand} />
        ) : (
          <Text style={styles.buttonText}>Continuar com Google</Text>
        )}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {confirmDemo ? (
        <View style={styles.dialog}>
          <Text style={styles.dialogBody}>
            Demo: simular consentimento Google como {DEMO_PERSONAS.google.email}
          </Text>
          <Pressable style={styles.button} onPress={() => void continueDemo()}>
            <Text style={styles.buttonText}>Simular consentimento</Text>
          </Pressable>
          <Pressable onPress={() => setConfirmDemo(false)}>
            <Text style={styles.cancel}>Cancelar</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  button: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  buttonText: { fontWeight: "700", color: Colors.light.text },
  error: { color: "#B91C1C", marginTop: 8 },
  dialog: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F4F6F8",
    gap: 8,
  },
  dialogBody: { color: Colors.light.text, fontSize: 13, lineHeight: 18 },
  cancel: { color: Colors.light.muted, fontWeight: "600", marginTop: 4 },
});
