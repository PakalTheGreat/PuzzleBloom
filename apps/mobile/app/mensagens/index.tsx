import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { listMyConversations } from "@cwg/api";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { CONFIG_MISSING_MESSAGE_PT, getSupabase } from "@/lib/supabase";

type Conv = {
  id: string;
  latest: { body: string } | null;
  members: Array<{ users?: { full_name?: string; email?: string } | null }>;
};

export default function MensagensListScreen() {
  const router = useRouter();
  const { configured, user } = useAuth();
  const [rows, setRows] = useState<Conv[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !user) return;
    const client = getSupabase();
    if (!client) return;
    void listMyConversations(client, user.id).then(({ data, error: err }) => {
      if (err) setError(err.message);
      else setRows((data as Conv[]) ?? []);
    });
  }, [configured, user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mensagens</Text>
      {!configured ? <Text style={styles.warn}>{CONFIG_MISSING_MESSAGE_PT}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={styles.meta}>Nenhuma conversa.</Text>}
        renderItem={({ item }) => {
          const other =
            item.members[0]?.users?.full_name ||
            item.members[0]?.users?.email ||
            item.id.slice(0, 8);
          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/mensagens/${item.id}`)}
            >
              <Text style={styles.cardTitle}>{other}</Text>
              <Text style={styles.meta}>{item.latest?.body || "Sem mensagens"}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand, marginBottom: 12 },
  warn: { color: "#92400E", marginBottom: 8, fontSize: 13 },
  error: { color: "#B91C1C" },
  meta: { color: Colors.light.muted, fontSize: 13 },
  card: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E8EBF0" },
  cardTitle: { fontWeight: "700" },
});
