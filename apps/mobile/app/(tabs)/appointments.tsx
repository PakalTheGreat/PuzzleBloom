import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { listAppointmentsForUser, listCrmClients } from "@cwg/api";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { CONFIG_MISSING_MESSAGE_PT, getSupabase } from "@/lib/supabase";

type Appt = { id: string; status: string; starts_at: string; mode: string };
type Client = { id: string; display_name: string; status: string };

export default function AppointmentsTab() {
  const router = useRouter();
  const { activeRole } = useActiveRole();
  const { configured, user, me } = useAuth();
  const isGrower = activeRole === "grower";
  const [appts, setAppts] = useState<Appt[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !user) return;
    const client = getSupabase();
    if (!client) return;
    void (async () => {
      if (isGrower) {
        const { data, error: err } = await listAppointmentsForUser(client, user.id, null);
        if (err) setError(err.message);
        else setAppts((data as Appt[]) ?? []);
        return;
      }
      const specialist = me?.specialist as { id?: string } | null;
      if (!specialist?.id) return;
      const { data, error: err } = await listCrmClients(client, specialist.id);
      if (err) setError(err.message);
      else setClients((data as Client[]) ?? []);
    })();
  }, [configured, user, isGrower, me?.specialist]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isGrower ? "Agendamentos" : "Clientes (CRM)"}</Text>
      {!configured ? <Text style={styles.warn}>{CONFIG_MISSING_MESSAGE_PT}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isGrower ? (
        <>
          <Link href="/solicitacoes" style={styles.link}>
            Minhas solicitações
          </Link>
          <FlatList
            data={appts}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={
              <Text style={styles.body}>Lista vazia até haver dados no Supabase.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/appointment-detail?id=${item.id}`)}
              >
                <Text style={styles.cardTitle}>{item.status}</Text>
                <Text style={styles.meta}>
                  {item.mode} · {new Date(item.starts_at).toLocaleString("pt-BR")}
                </Text>
              </Pressable>
            )}
          />
        </>
      ) : (
        <>
          <Link href="/crm" style={styles.link}>
            Abrir CRM completo
          </Link>
          <Link href="/calendario" style={styles.link}>
            Calendário
          </Link>
          <Link href="/solicitacoes" style={styles.link}>
            Solicitações
          </Link>
          <FlatList
            data={clients}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={<Text style={styles.body}>Sem clientes.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/crm/${item.id}`)}
              >
                <Text style={styles.cardTitle}>{item.display_name}</Text>
                <Text style={styles.meta}>{item.status}</Text>
              </Pressable>
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
  warn: { color: "#92400E", marginBottom: 8, fontSize: 13 },
  error: { color: "#B91C1C", marginBottom: 8 },
  body: { color: Colors.light.muted },
  link: { color: Colors.light.tint, fontWeight: "600", marginBottom: 8 },
  card: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E8EBF0" },
  cardTitle: { fontWeight: "700", color: Colors.light.text },
  meta: { color: Colors.light.muted, marginTop: 4, fontSize: 13 },
});
