import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { updateSpecialistProfile } from "@cwg/api";
import { specialistProfileSchema } from "@cwg/validation";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

export default function SpecialistEditScreen() {
  const { me, configured, demoMode, refreshMe } = useAuth();
  const specialist = me?.specialist as {
    id: string;
    slug: string;
    headline?: string;
    bio?: string;
    city?: string;
    state?: string;
    region?: string;
    offers_remote?: boolean;
    offers_in_person?: boolean;
    years_experience?: number | null;
  } | null;

  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [region, setRegion] = useState("");
  const [remote, setRemote] = useState(true);
  const [inPerson, setInPerson] = useState(false);
  const [years, setYears] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!specialist) return;
    setSlug(specialist.slug ?? "");
    setHeadline(specialist.headline ?? "");
    setBio(specialist.bio ?? "");
    setCity(specialist.city ?? "");
    setStateUf(specialist.state ?? "");
    setRegion(specialist.region ?? "");
    setRemote(specialist.offers_remote ?? true);
    setInPerson(specialist.offers_in_person ?? false);
    setYears(
      specialist.years_experience != null
        ? String(specialist.years_experience)
        : "",
    );
  }, [specialist]);

  async function onSave() {
    setError(null);
    setInfo(null);
    if (!specialist) {
      setError("Ative o papel especialista no onboarding.");
      return;
    }
    const parsed = specialistProfileSchema.safeParse({
      slug,
      headline: headline || null,
      bio: bio || null,
      city: city || null,
      state: stateUf || null,
      region: region || null,
      offers_remote: remote,
      offers_in_person: inPerson,
      years_experience: years ? Number(years) : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    if (demoMode) {
      setInfo("Perfil atualizado (demo).");
      return;
    }
    if (!configured) {
      setError("Cliente indisponível");
      return;
    }
    const client = getSupabase();
    if (!client) {
      setError("Cliente indisponível");
      return;
    }
    setLoading(true);
    const { error: saveError } = await updateSpecialistProfile(
      client,
      specialist.id,
      parsed.data,
    );
    setLoading(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setInfo("Perfil salvo.");
    await refreshMe();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar perfil público</Text>
      <TextInput style={styles.input} placeholder="slug" value={slug} onChangeText={setSlug} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Headline" value={headline} onChangeText={setHeadline} />
      <TextInput style={[styles.input, styles.area]} placeholder="Bio" value={bio} onChangeText={setBio} multiline />
      <TextInput style={styles.input} placeholder="Cidade" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="UF" value={stateUf} onChangeText={setStateUf} maxLength={2} autoCapitalize="characters" />
      <TextInput style={styles.input} placeholder="Região" value={region} onChangeText={setRegion} />
      <TextInput style={styles.input} placeholder="Anos de experiência" value={years} onChangeText={setYears} keyboardType="number-pad" />
      <View style={styles.row}>
        <Text>Remoto</Text>
        <Switch value={remote} onValueChange={setRemote} />
      </View>
      <View style={styles.row}>
        <Text>Presencial</Text>
        <Switch value={inPerson} onValueChange={setInPerson} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <Pressable style={styles.button} onPress={onSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  area: { minHeight: 100, textAlignVertical: "top" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  error: { color: "#B91C1C", marginBottom: 8 },
  info: { color: Colors.light.tint, marginBottom: 8 },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
