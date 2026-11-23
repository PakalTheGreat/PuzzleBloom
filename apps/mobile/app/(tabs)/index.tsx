import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { exploreSpecialists } from "@cwg/api";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { CONFIG_MISSING_MESSAGE_PT, getSupabase } from "@/lib/supabase";

type Row = {
  id: string;
  slug: string;
  headline?: string | null;
  city?: string | null;
  state?: string | null;
  verification_status?: string;
  users?: { full_name?: string } | null;
};

export default function HomeTab() {
  const { activeRole } = useActiveRole();
  const { configured } = useAuth();
  const isGrower = activeRole === "grower";
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGrower || !configured) return;
    const client = getSupabase();
    if (!client) return;
    void exploreSpecialists(client).then(({ data, error: err }) => {
      if (err) setError(err.message);
      else setRows((data as Row[] | null) ?? []);
    });
  }, [isGrower, configured]);

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>CWG</Text>
      <Text style={styles.title}>
        {isGrower ? "Explorar especialistas" : "Dashboard do especialista"}
      </Text>
      {!configured ? (
        <Text style={styles.warn}>{CONFIG_MISSING_MESSAGE_PT}</Text>
      ) : null}
      {isGrower ? (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.body}>
                Nenhum especialista ainda. Com Supabase + seed, a lista aparece
                aqui.
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>
                  {item.users?.full_name || item.slug}
                </Text>
                <Text style={styles.cardMeta}>
                  {[item.headline, item.city, item.state]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                <Text style={styles.badge}>{item.verification_status}</Text>
              </Pressable>
            )}
          />
        </>
      ) : (
        <Text style={styles.body}>
          Resumo Phase 1+: edite o perfil público, envie verificação e (Phase 2+)
          gerencie solicitações e agenda.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  kicker: { color: Colors.light.muted, fontSize: 13, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.brand,
    marginBottom: 12,
  },
  warn: { color: "#92400E", marginBottom: 12, fontSize: 13 },
  error: { color: "#B91C1C", marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 24, color: Colors.light.text, maxWidth: 420 },
  card: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EBF0",
  },
  cardTitle: { fontWeight: "700", color: Colors.light.text },
  cardMeta: { color: Colors.light.muted, marginTop: 4 },
  badge: {
    marginTop: 4,
    fontSize: 11,
    textTransform: "uppercase",
    color: Colors.light.muted,
  },
});
