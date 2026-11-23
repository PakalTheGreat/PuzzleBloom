import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  acceptRequestWithAppointment,
  listServiceRequestsForGrower,
  listServiceRequestsForSpecialist,
  updateServiceRequestStatus,
} from "@cwg/api";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import { CONFIG_MISSING_MESSAGE_PT, getSupabase } from "@/lib/supabase";

type Req = {
  id: string;
  status: string;
  mode: string;
  message: string | null;
  grower_user_id: string;
  specialist_profile_id: string;
  users?: { full_name?: string } | null;
  specialist_profiles?: { slug?: string; users?: { full_name?: string } } | null;
};

export default function SolicitacoesScreen() {
  const { activeRole } = useActiveRole();
  const { configured, user, me } = useAuth();
  const isSpecialist = activeRole === "specialist";
  const [rows, setRows] = useState<Req[]>([]);
  const [slot, setSlot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!configured || !user) return;
    const client = getSupabase();
    if (!client) return;
    if (isSpecialist) {
      const sp = me?.specialist as { id?: string } | null;
      if (!sp?.id) {
        setError("Ative perfil especialista.");
        return;
      }
      const { data, error: err } = await listServiceRequestsForSpecialist(
        client,
        sp.id,
      );
      if (err) setError(err.message);
      else {
        setError(null);
        setRows((data as Req[]) ?? []);
      }
    } else {
      const { data, error: err } = await listServiceRequestsForGrower(
        client,
        user.id,
      );
      if (err) setError(err.message);
      else {
        setError(null);
        setRows((data as Req[]) ?? []);
      }
    }
  }, [configured, user, isSpecialist, me?.specialist]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isSpecialist ? "Solicitações recebidas" : "Solicitações enviadas"}
      </Text>
      {!configured ? <Text style={styles.warn}>{CONFIG_MISSING_MESSAGE_PT}</Text> : null}
      {isSpecialist ? (
        <TextInput
          style={styles.input}
          placeholder="ISO início ao aceitar (ex. 2026-03-25T14:00:00)"
          value={slot}
          onChangeText={setSlot}
          autoCapitalize="none"
        />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={styles.meta}>Nenhuma solicitação.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isSpecialist
                ? item.users?.full_name || item.grower_user_id.slice(0, 8)
                : item.specialist_profiles?.users?.full_name ||
                  item.specialist_profiles?.slug}{" "}
              · {item.status}
            </Text>
            <Text style={styles.meta}>
              {item.mode} · {item.message || "—"}
            </Text>
            {isSpecialist && item.status === "pending" ? (
              <View style={styles.row}>
                <Pressable
                  style={styles.button}
                  onPress={async () => {
                    const client = getSupabase();
                    if (!client || !slot) {
                      setError("Informe o horário ISO.");
                      return;
                    }
                    const start = new Date(slot);
                    const end = new Date(start.getTime() + 3600000);
                    const { error: err } = await acceptRequestWithAppointment(client, {
                      requestId: item.id,
                      grower_user_id: item.grower_user_id,
                      specialist_profile_id: item.specialist_profile_id,
                      mode: item.mode as "remote" | "in_person",
                      starts_at: start.toISOString(),
                      ends_at: end.toISOString(),
                      location_summary:
                        item.mode === "remote" ? "Remoto" : "A combinar",
                    });
                    if (err) setError(err.message);
                    else setInfo("Aceito — agendamento criado.");
                    await reload();
                  }}
                >
                  <Text style={styles.buttonText}>Aceitar</Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={async () => {
                    const client = getSupabase();
                    if (!client) return;
                    await updateServiceRequestStatus(client, item.id, "rejected");
                    await reload();
                  }}
                >
                  <Text style={styles.secondaryText}>Rejeitar</Text>
                </Pressable>
              </View>
            ) : null}
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
  input: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  error: { color: "#B91C1C", marginBottom: 8 },
  info: { color: Colors.light.tint, marginBottom: 8 },
  meta: { color: Colors.light.muted, fontSize: 13 },
  card: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E8EBF0" },
  cardTitle: { fontWeight: "700", color: Colors.light.text },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  secondary: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryText: { fontWeight: "600", fontSize: 13 },
});
