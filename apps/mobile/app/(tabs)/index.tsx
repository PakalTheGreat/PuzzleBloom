import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { exploreSpecialists } from "@cwg/api";
import { DEMO_STATS, exploreDemoSpecialists } from "@cwg/demo";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { getSupabase } from "@/lib/supabase";

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
  const { demoMode, user } = useAuth();
  const isGrower = activeRole === "grower";
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGrower) return;
    if (demoMode) {
      setRows(exploreDemoSpecialists() as unknown as Row[]);
      return;
    }
    const client = getSupabase();
    if (!client) return;
    void exploreSpecialists(client).then(({ data, error: err }) => {
      if (err) setError(err.message);
      else setRows((data as Row[] | null) ?? []);
    });
  }, [isGrower, demoMode]);

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>CWG</Text>
      <Text style={styles.title}>
        {isGrower ? "Explorar especialistas" : "Dashboard do especialista"}
      </Text>
      {isGrower ? (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.body}>Nenhum especialista encontrado.</Text>
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
        <View>
          {!user ? (
            <Link href="/(auth)/entrar" style={styles.link}>
              Entrar como especialista
            </Link>
          ) : (
            <>
              <Text style={styles.stat}>
                Agendamentos no mês: {DEMO_STATS.appointmentsMonth}
              </Text>
              <Text style={styles.stat}>
                Confirmação: {Math.round(DEMO_STATS.confirmedRate * 100)}%
              </Text>
              <Text style={styles.stat}>
                Clientes ativos: {DEMO_STATS.activeClients}
              </Text>
              <Link href="/calendario" style={styles.link}>
                Abrir calendário
              </Link>
              <Link href="/crm" style={styles.link}>
                Abrir CRM
              </Link>
              <Link href="/solicitacoes" style={styles.link}>
                Solicitações recebidas
              </Link>
            </>
          )}
        </View>
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
  stat: { fontSize: 16, color: Colors.light.text, marginBottom: 8 },
  link: {
    marginTop: 12,
    color: Colors.light.tint,
    fontWeight: "600",
    fontSize: 16,
  },
});
