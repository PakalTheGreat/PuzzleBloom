import { useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { CONFIG_MISSING_MESSAGE_PT, getSupabase } from "@/lib/supabase";

type Req = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
};

type Msg = {
  id: string;
  body: string;
  sent_at: string;
};

export default function MessagesOrRequestsTab() {
  const { activeRole } = useActiveRole();
  const { configured, user, me } = useAuth();
  const isGrower = activeRole === "grower";
  const [rows, setRows] = useState<Array<Req | Msg>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !user) return;
    const client = getSupabase();
    if (!client) return;
    void (async () => {
      if (isGrower) {
        const { data: memberships } = await client
          .from("conversation_members")
          .select("conversation_id")
          .eq("user_id", user.id);
        const ids = (memberships ?? []).map((m) => m.conversation_id as string);
        if (ids.length === 0) {
          setRows([]);
          return;
        }
        const { data, error: err } = await client
          .from("messages")
          .select("id, body, sent_at")
          .in("conversation_id", ids)
          .order("sent_at", { ascending: false })
          .limit(40);
        if (err) setError(err.message);
        else setRows((data as Msg[]) ?? []);
        return;
      }
      const specialist = me?.specialist as { id?: string } | null;
      if (!specialist?.id) return;
      const { data, error: err } = await client
        .from("service_requests")
        .select("id, status, message, created_at")
        .eq("specialist_profile_id", specialist.id)
        .order("created_at", { ascending: false })
        .limit(40);
      if (err) setError(err.message);
      else setRows((data as Req[]) ?? []);
    })();
  }, [configured, user, isGrower, me?.specialist]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isGrower ? "Mensagens" : "Solicitações"}</Text>
      {!configured ? <Text style={styles.warn}>{CONFIG_MISSING_MESSAGE_PT}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={
          <Text style={styles.body}>
            {isGrower ? "Sem mensagens." : "Sem solicitações."}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {"status" in item ? item.status : item.body.slice(0, 80)}
            </Text>
            <Text style={styles.meta}>
              {"created_at" in item
                ? new Date(item.created_at).toLocaleString("pt-BR")
                : new Date(item.sent_at).toLocaleString("pt-BR")}
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
