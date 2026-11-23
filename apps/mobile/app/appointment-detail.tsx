import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  confirmAppointmentSide,
  nextAppointmentActions,
  updateAppointmentStatus,
} from "@cwg/api";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeRole } = useActiveRole();
  const { user } = useAuth();
  const [appt, setAppt] = useState<Record<string, unknown> | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!id) return;
    const client = getSupabase();
    if (!client) return;
    const { data, error: err } = await client
      .from("appointments")
      .select("*, service_confirmations(*)")
      .eq("id", id)
      .maybeSingle();
    if (err) setError(err.message);
    else setAppt(data as Record<string, unknown>);
  }

  useEffect(() => {
    void reload();
  }, [id]);

  if (!appt) {
    return (
      <View style={styles.container}>
        <Text>{error || "Carregando…"}</Text>
      </View>
    );
  }

  const status = String(appt.status);
  const actions = nextAppointmentActions(
    status,
    activeRole === "specialist" ? "specialist" : "grower",
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{status}</Text>
      <Text style={styles.meta}>
        {new Date(String(appt.starts_at)).toLocaleString("pt-BR")}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      {actions.map((next) => (
        <Pressable
          key={next}
          style={styles.button}
          onPress={async () => {
            const client = getSupabase();
            if (!client) return;
            const { error: err } = await updateAppointmentStatus(
              client,
              String(appt.id),
              next,
            );
            if (err) setError(err.message);
            else setInfo(`→ ${next}`);
            await reload();
          }}
        >
          <Text style={styles.buttonText}>{next}</Text>
        </Pressable>
      ))}
      {status === "completed" && user ? (
        <Pressable
          style={styles.button}
          onPress={async () => {
            const client = getSupabase();
            if (!client) return;
            const { error: err, reviewEligible } = await confirmAppointmentSide(
              client,
              String(appt.id),
              activeRole === "specialist" ? "specialist" : "grower",
            );
            if (err) setError(err.message);
            else
              setInfo(
                reviewEligible
                  ? "Confirmação mútua OK — review liberada"
                  : "Confirmação registrada",
              );
            await reload();
          }}
        >
          <Text style={styles.buttonText}>Confirmar serviço</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand },
  meta: { marginTop: 8, color: Colors.light.muted },
  error: { color: "#B91C1C", marginTop: 8 },
  info: { color: Colors.light.tint, marginTop: 8 },
  button: {
    marginTop: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
