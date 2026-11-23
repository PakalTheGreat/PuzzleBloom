import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LEGAL_COPY } from "@cwg/shared";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import {
  readCultivationAuth,
  writeCultivationAuth,
} from "@/lib/legal-auth";

export function LegalAuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void readCultivationAuth().then((r) => {
      setAccepted(Boolean(r));
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.meta}>Carregando…</Text>
      </View>
    );
  }

  if (accepted) return <>{children}</>;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{LEGAL_COPY.cultivationAuthTitle}</Text>
      <Text style={styles.body}>{LEGAL_COPY.cultivationAuthBody}</Text>
      <Text style={styles.meta}>{LEGAL_COPY.cultivationAuthDisclaimer}</Text>
      <Pressable onPress={() => setChecked((v) => !v)} style={styles.check}>
        <Text>
          {checked ? "☑" : "☐"} {LEGAL_COPY.cultivationAuthCheckbox}
        </Text>
      </Pressable>
      <Pressable
        disabled={!checked}
        style={[styles.button, !checked && styles.disabled]}
        onPress={() => {
          void writeCultivationAuth().then(() => setAccepted(true));
        }}
      >
        <Text style={styles.buttonText}>{LEGAL_COPY.cultivationAuthContinue}</Text>
      </Pressable>
      <Link href="/(tabs)" style={styles.link}>
        {LEGAL_COPY.cultivationAuthDecline}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.brand,
    marginBottom: 12,
  },
  body: { fontSize: 15, lineHeight: 22, color: Colors.light.text, marginBottom: 12 },
  meta: { fontSize: 13, lineHeight: 18, color: Colors.light.muted, marginBottom: 16 },
  check: { marginBottom: 16 },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  link: { marginTop: 16, color: Colors.light.muted, fontWeight: "600" },
});
