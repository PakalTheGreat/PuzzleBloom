import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { listMyConversations, listServiceRequestsForSpecialist } from "@cwg/api";
import { DEMO_CONVERSATIONS, DEMO_REQUESTS } from "@cwg/demo";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { getSupabase } from "@/lib/supabase";

type Conv = {
  id: string;
  latest: { body: string } | null;
  members: Array<{ users?: { full_name?: string } | null }>;
};
type Req = { id: string; status: string; message: string | null };

export default function MessagesOrRequestsTab() {
  const router = useRouter();
  const { activeRole } = useActiveRole();
  const { demoMode, user, me } = useAuth();
  const isGrower = activeRole === "grower";
  const [convs, setConvs] = useState<Conv[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/entrar");
      return;
    }
    if (demoMode) {
      if (isGrower) setConvs([...DEMO_CONVERSATIONS] as Conv[]);
      else {
        const spId = (me?.specialist as { id?: string } | null)?.id ?? "sp-ana";
        setReqs(
          DEMO_REQUESTS.filter((r) => r.specialist_profile_id === spId).map(
            (r) => ({
              id: r.id,
              status: r.status,
              message: r.message,
            }),
          ),
        );
      }
      return;
    }
    const client = getSupabase();
    if (!client) return;
    void (async () => {
      if (isGrower) {
        const { data, error: err } = await listMyConversations(client, user.id);
        if (err) setError(err.message);
        else setConvs((data as Conv[]) ?? []);
        return;
      }
      const specialist = me?.specialist as { id?: string } | null;
      if (!specialist?.id) return;
      const { data, error: err } = await listServiceRequestsForSpecialist(
        client,
        specialist.id,
      );
      if (err) setError(err.message);
      else setReqs((data as Req[]) ?? []);
    })();
  }, [demoMode, user, isGrower, me?.specialist, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isGrower ? "Mensagens" : "Solicitações"}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isGrower ? (
        <>
          <Link href="/mensagens" style={styles.link}>
            Abrir caixa de entrada
          </Link>
          <FlatList
            data={convs}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={<Text style={styles.body}>Sem mensagens.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/mensagens/${item.id}`)}
              >
                <Text style={styles.cardTitle}>
                  {item.members[0]?.users?.full_name || item.id.slice(0, 8)}
                </Text>
                <Text style={styles.meta}>{item.latest?.body || "—"}</Text>
              </Pressable>
            )}
          />
        </>
      ) : (
        <>
          <Link href="/solicitacoes" style={styles.link}>
            Gerenciar solicitações
          </Link>
          <FlatList
            data={reqs}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={<Text style={styles.body}>Sem solicitações.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.status}</Text>
                <Text style={styles.meta}>{item.message || "—"}</Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand, marginBottom: 12 },
  error: { color: "#B91C1C", marginBottom: 8 },
  body: { color: Colors.light.muted },
  link: { color: Colors.light.tint, fontWeight: "600", marginBottom: 8 },
  card: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E8EBF0" },
  cardTitle: { fontWeight: "700", color: Colors.light.text },
  meta: { color: Colors.light.muted, marginTop: 4, fontSize: 13 },
});
