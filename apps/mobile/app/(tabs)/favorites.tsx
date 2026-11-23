import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { listFavorites, toggleFavorite } from "@cwg/api";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { CONFIG_MISSING_MESSAGE_PT, getSupabase } from "@/lib/supabase";

type Fav = {
  id: string;
  specialist_profiles?: {
    id: string;
    slug: string;
    headline: string | null;
    users?: { full_name?: string } | null;
  } | null;
};

type Appt = { id: string; status: string; starts_at: string };

export default function FavoritesOrAgendaTab() {
  const { activeRole } = useActiveRole();
  const { configured, user, me } = useAuth();
  const isGrower = activeRole === "grower";
  const [favs, setFavs] = useState<Fav[]>([]);
  const [agenda, setAgenda] = useState<Appt[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!configured || !user) return;
    const client = getSupabase();
    if (!client) return;
    if (isGrower) {
      const { data, error: err } = await listFavorites(client, user.id);
      if (err) setError(err.message);
      else setFavs((data as Fav[]) ?? []);
      return;
    }
    const specialist = me?.specialist as { id?: string } | null;
    if (!specialist?.id) return;
    const { data, error: err } = await client
      .from("appointments")
      .select("id, status, starts_at")
      .eq("specialist_profile_id", specialist.id)
      .order("starts_at", { ascending: true })
      .limit(40);
    if (err) setError(err.message);
    else setAgenda((data as Appt[]) ?? []);
  }, [configured, user, isGrower, me?.specialist]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isGrower ? "Favoritos" : "Agenda"}</Text>
      {!configured ? <Text style={styles.warn}>{CONFIG_MISSING_MESSAGE_PT}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isGrower ? (
        <FlatList
          data={favs}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={<Text style={styles.body}>Sem favoritos ainda.</Text>}
          renderItem={({ item }) => {
            const sp = item.specialist_profiles;
            return (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  {sp?.users?.full_name || sp?.slug || "—"}
                </Text>
                <Text style={styles.meta}>{sp?.headline}</Text>
                {sp?.id && user ? (
                  <Pressable
                    onPress={async () => {
                      const client = getSupabase();
                      if (!client) return;
                      await toggleFavorite(client, user.id, sp.id, false);
                      await reload();
                    }}
                  >
                    <Text style={styles.link}>Remover</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={agenda}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={<Text style={styles.body}>Agenda vazia.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.status}</Text>
              <Text style={styles.meta}>
                {new Date(item.starts_at).toLocaleString("pt-BR")}
              </Text>
            </View>
          )}
        />
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
  card: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E8EBF0" },
  cardTitle: { fontWeight: "700", color: Colors.light.text },
  meta: { color: Colors.light.muted, marginTop: 4, fontSize: 13 },
  link: { marginTop: 6, color: Colors.light.tint, fontWeight: "600" },
});
