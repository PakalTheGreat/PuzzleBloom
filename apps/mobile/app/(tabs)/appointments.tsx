import { useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { CONFIG_MISSING_MESSAGE_PT, getSupabase } from "@/lib/supabase";

type Row = {
  id: string;
  status: string;
  starts_at: string;
  mode: string;
};

export default function AppointmentsTab() {
  const { activeRole } = useActiveRole();
  const { configured, user, me } = useAuth();
  const isGrower = activeRole === "grower";
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !user) return;
    const client = getSupabase();
    if (!client) return;
    void (async () => {
      if (isGrower) {
        const { data, error: err } = await client
          .from("appointments")
          .select("id, status, starts_at, mode")
          .eq("grower_user_id", user.id)
          .order("starts_at", { ascending: true })
          .limit(40);
        if (err) setError(err.message);
        else setRows((data as Row[]) ?? []);
        return;
      }
      const specialist = me?.specialist as { id?: string } | null;
      if (!specialist?.id) {
        setRows([]);
        return;
      }
      const { data, error: err } = await client
        .from("crm_clients")
        .select("id, display_name, status")
        .eq("specialist_profile_id", specialist.id)
        .order("updated_at", { ascending: false })
        .limit(40);
      if (err) setError(err.message);
      else
        setRows(
          ((data as Array<{ id: string; display_name: string; status: string }>) ?? []).map(
            (c) => ({
              id: c.id,
              status: c.status,
              starts_at: "",
              mode: c.display_name,
            }),
          ),
        );
    })();
  }, [configured, user, isGrower, me?.specialist]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isGrower ? "Agendamentos" : "Clientes (CRM)"}</Text>
      {!configured ? <Text style={styles.warn}>{CONFIG_MISSING_MESSAGE_PT}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={
          <Text style={styles.body}>Lista vazia até haver dados no Supabase.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isGrower ? item.status : item.mode}
            </Text>
            <Text style={styles.meta}>
              {isGrower
                ? `${item.mode} · ${item.starts_at ? new Date(item.starts_at).toLocaleString("pt-BR") : ""}`
                : item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand, marginBottom: 12 },
  warn: { color: "#92400E", marginBottom: 8, fontSize: 13 },
  error: { color: "#B91C1C", marginBottom: 8 },
  body: { color: Colors.light.muted },
  card: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E8EBF0" },
  cardTitle: { fontWeight: "700", color: Colors.light.text },
  meta: { color: Colors.light.muted, marginTop: 4, fontSize: 13 },
});
