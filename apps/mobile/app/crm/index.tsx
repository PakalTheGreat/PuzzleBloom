import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { createCrmClient, listCrmClients } from "@cwg/api";
import { DEMO_CRM_CLIENTS } from "@cwg/demo";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

type Row = { id: string; display_name: string; status: string };

export default function CrmListScreen() {
  const router = useRouter();
  const { activeRole } = useActiveRole();
  const { demoMode, user, me } = useAuth();
  const specialist = me?.specialist as { id?: string } | null;
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/entrar");
      return;
    }
    if (activeRole !== "specialist") {
      router.replace("/(tabs)");
    }
  }, [user, activeRole, router]);

  const reload = useCallback(async () => {
    const spId = specialist?.id ?? (demoMode ? "sp-ana" : null);
    if (!spId) return;
    if (demoMode) {
      setRows(
        DEMO_CRM_CLIENTS.filter((c) => c.specialist_profile_id === spId).map(
          (c) => ({
            id: c.id,
            display_name: c.display_name,
            status: c.status,
          }),
        ),
      );
      return;
    }
    const client = getSupabase();
    if (!client) return;
    const { data, error: err } = await listCrmClients(client, spId);
    if (err) setError(err.message);
    else setRows((data as Row[]) ?? []);
  }, [demoMode, specialist?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CRM</Text>
      <Text style={styles.meta}>Privado do especialista.</Text>
      {!specialist?.id && !demoMode ? (
        <Text style={styles.meta}>Ative o papel especialista.</Text>
      ) : (
        <>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Novo lead"
              value={name}
              onChangeText={setName}
            />
            <Pressable
              style={styles.button}
              onPress={async () => {
                if (!name.trim()) return;
                if (demoMode) {
                  setRows((prev) => [
                    {
                      id: `crm-local-${Date.now()}`,
                      display_name: name.trim(),
                      status: "lead",
                    },
                    ...prev,
                  ]);
                  setName("");
                  return;
                }
                const client = getSupabase();
                if (!client || !specialist?.id) return;
                const { error: err } = await createCrmClient(client, {
                  specialist_profile_id: specialist.id,
                  display_name: name.trim(),
                });
                if (err) setError(err.message);
                else {
                  setName("");
                  await reload();
                }
              }}
            >
              <Text style={styles.buttonText}>+</Text>
            </Pressable>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <FlatList
            data={rows}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={<Text style={styles.meta}>Sem clientes.</Text>}
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
      <Link href="/(tabs)/appointments" style={styles.link}>
        Voltar
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand, marginBottom: 4 },
  row: { flexDirection: "row", gap: 8, marginBottom: 12, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  error: { color: "#B91C1C", marginBottom: 8 },
  meta: { color: Colors.light.muted, fontSize: 13 },
  card: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E8EBF0" },
  cardTitle: { fontWeight: "700", color: Colors.light.text },
  link: { marginTop: 16, color: Colors.light.tint, fontWeight: "600" },
});
