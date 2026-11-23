import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  WEEKDAY_LABELS_PT,
  addDays,
  listAppointmentsInRange,
  listAvailabilityRules,
  startOfDay,
  upsertAvailabilityRule,
} from "@cwg/api";
import { DEMO_APPOINTMENTS, DEMO_AVAILABILITY_RULES } from "@cwg/demo";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

type Appt = { id: string; status: string; starts_at: string; mode: string };
type Rule = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
};

export default function CalendarioScreen() {
  const router = useRouter();
  const { activeRole } = useActiveRole();
  const { demoMode, user, me } = useAuth();
  const specialist = me?.specialist as { id?: string } | null;
  const [appts, setAppts] = useState<Appt[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/entrar");
      return;
    }
    if (activeRole !== "specialist") router.replace("/(tabs)");
  }, [user, activeRole, router]);

  const reload = useCallback(async () => {
    const spId = specialist?.id ?? (demoMode ? "sp-ana" : null);
    if (!spId) return;
    if (demoMode) {
      setAppts(
        DEMO_APPOINTMENTS.filter((a) => a.specialist_profile_id === spId).map(
          (a) => ({
            id: a.id,
            status: a.status,
            starts_at: a.starts_at,
            mode: a.mode,
          }),
        ),
      );
      setRules([...DEMO_AVAILABILITY_RULES]);
      return;
    }
    const client = getSupabase();
    if (!client) return;
    const from = startOfDay(new Date());
    const to = addDays(from, 14);
    const [a, r] = await Promise.all([
      listAppointmentsInRange(client, spId, from.toISOString(), to.toISOString()),
      listAvailabilityRules(client, spId),
    ]);
    if (a.error) setError(a.error.message);
    else setAppts((a.data as Appt[]) ?? []);
    if (r.error) setError(r.error.message);
    else setRules((r.data as Rule[]) ?? []);
  }, [demoMode, specialist?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendário / Agenda</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.section}>Próximos 14 dias</Text>
      <FlatList
        data={appts}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={styles.meta}>Sem eventos.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.status}</Text>
            <Text style={styles.meta}>
              {new Date(item.starts_at).toLocaleString("pt-BR")} · {item.mode}
            </Text>
          </View>
        )}
      />
      <Text style={styles.section}>Disponibilidade</Text>
      <TextInput
        style={styles.input}
        placeholder="Weekday 0-6"
        value={weekday}
        onChangeText={setWeekday}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Início HH:MM"
        value={start}
        onChangeText={setStart}
      />
      <TextInput
        style={styles.input}
        placeholder="Fim HH:MM"
        value={end}
        onChangeText={setEnd}
      />
      <Pressable
        style={styles.button}
        onPress={async () => {
          if (demoMode) {
            setRules((prev) => [
              ...prev,
              {
                id: `rule-${Date.now()}`,
                weekday: Number(weekday),
                start_time: start,
                end_time: end,
              },
            ]);
            return;
          }
          const client = getSupabase();
          if (!client || !specialist?.id) return;
          const { error: err } = await upsertAvailabilityRule(client, {
            specialist_profile_id: specialist.id,
            weekday: Number(weekday),
            start_time: start,
            end_time: end,
            mode: "remote",
          });
          if (err) setError(err.message);
          await reload();
        }}
      >
        <Text style={styles.buttonText}>Adicionar regra</Text>
      </Pressable>
      {rules.map((r) => (
        <Text key={r.id} style={styles.meta}>
          {WEEKDAY_LABELS_PT[r.weekday]} {r.start_time}–{r.end_time}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand, marginBottom: 12 },
  section: { marginTop: 16, marginBottom: 8, fontWeight: "700" },
  error: { color: "#B91C1C" },
  meta: { color: Colors.light.muted, fontSize: 13, marginBottom: 4 },
  card: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E8EBF0" },
  cardTitle: { fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
