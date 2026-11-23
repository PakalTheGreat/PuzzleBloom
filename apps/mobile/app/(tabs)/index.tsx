import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View as RNView,
} from "react-native";
import * as Location from "expo-location";
import { exploreSpecialists } from "@cwg/api";
import { DEMO_STATS, exploreDemoSpecialists } from "@cwg/demo";
import { formatDistanceKm } from "@cwg/shared";

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
  offers_in_person?: boolean | null;
  offers_remote?: boolean | null;
  users?: { full_name?: string } | null;
  distance_km?: number | null;
};

export default function HomeTab() {
  const { activeRole } = useActiveRole();
  const { demoMode, user } = useAuth();
  const isGrower = activeRole === "grower";
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [mode, setMode] = useState<"all" | "in_person" | "remote">("all");
  const [geoHint, setGeoHint] = useState(
    "Priorizamos presencial. Toque para ordenar por proximidade (área de serviço aproximada).",
  );

  function loadDemo(origin?: { lat: number; lng: number } | null) {
    setRows(
      exploreDemoSpecialists({
        estado: estado || undefined,
        cidade: cidade || undefined,
        mode,
        origin: origin ?? null,
      }) as unknown as Row[],
    );
  }

  useEffect(() => {
    if (!isGrower) return;
    if (demoMode) {
      loadDemo(null);
      return;
    }
    const client = getSupabase();
    if (!client) return;
    void exploreSpecialists(client, {
      state: estado || undefined,
      city: cidade || undefined,
      mode,
    }).then(({ data, error: err }) => {
      if (err) setError(err.message);
      else setRows((data as Row[] | null) ?? []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGrower, demoMode, modoKey(mode), estado, cidade]);

  async function requestNearby() {
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setGeoHint("Localização negada — use cidade/UF abaixo.");
      if (demoMode) loadDemo(null);
      return;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const origin = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    setGeoHint("Ordenado por distância · presencial primeiro.");
    if (demoMode) {
      loadDemo(origin);
      return;
    }
    const client = getSupabase();
    if (!client) return;
    const { data, error: err } = await exploreSpecialists(client, {
      state: estado || undefined,
      city: cidade || undefined,
      mode,
    });
    if (err) {
      setError(err.message);
      return;
    }
    const { sortByDistance } = await import("@cwg/shared");
    setRows(
      sortByDistance((data as Row[]) ?? [], origin, {
        preferInPerson: true,
      }) as Row[],
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>CWG</Text>
      <Text style={styles.title}>
        {isGrower ? "Especialistas perto de você" : "Dashboard do especialista"}
      </Text>
      {isGrower ? (
        <>
          <Text style={styles.hint}>{geoHint}</Text>
          <Pressable style={styles.geoBtn} onPress={() => void requestNearby()}>
            <Text style={styles.geoBtnText}>Especialistas perto de mim</Text>
          </Pressable>
          <RNView style={styles.filters}>
            <TextInput
              style={styles.input}
              placeholder="Cidade"
              value={cidade}
              onChangeText={setCidade}
            />
            <TextInput
              style={[styles.input, styles.uf]}
              placeholder="UF"
              autoCapitalize="characters"
              maxLength={2}
              value={estado}
              onChangeText={setEstado}
            />
          </RNView>
          <RNView style={styles.modes}>
            {(
              [
                ["all", "Todos"],
                ["in_person", "Presencial"],
                ["remote", "Remoto"],
              ] as const
            ).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                style={[styles.modeChip, mode === value && styles.modeActive]}
              >
                <Text
                  style={[
                    styles.modeText,
                    mode === value && styles.modeTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </RNView>
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
                <Text style={styles.badge}>
                  {[
                    item.offers_in_person ? "Presencial" : null,
                    item.offers_remote ? "Remoto" : null,
                    item.distance_km != null
                      ? formatDistanceKm(item.distance_km)
                      : null,
                    item.verification_status,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
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

function modoKey(mode: string) {
  return mode;
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
    marginBottom: 8,
  },
  hint: { color: Colors.light.muted, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  geoBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  geoBtnText: { color: "#fff", fontWeight: "700" },
  filters: { flexDirection: "row", gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  uf: { flex: 0, width: 64 },
  modes: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeChip: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modeActive: {
    backgroundColor: Colors.light.brand,
    borderColor: Colors.light.brand,
  },
  modeText: { fontSize: 12, color: Colors.light.text, fontWeight: "600" },
  modeTextActive: { color: "#fff" },
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
