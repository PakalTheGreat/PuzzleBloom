import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { listMessages, sendMessage } from "@cwg/api";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

type Msg = { id: string; body: string; sent_at: string; sender_id: string };

export default function MensagemThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [rows, setRows] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    const client = getSupabase();
    if (!client) return;
    const { data, error: err } = await listMessages(client, id);
    if (err) setError(err.message);
    else setRows((data as Msg[]) ?? []);
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        style={{ flex: 1 }}
        data={rows}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={{ color: mine ? "#fff" : Colors.light.text }}>{item.body}</Text>
            </View>
          );
        }}
      />
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Mensagem"
        />
        <Pressable
          style={styles.button}
          onPress={async () => {
            if (!user || !id || !body.trim()) return;
            const client = getSupabase();
            if (!client) return;
            const { error: err } = await sendMessage(client, {
              conversation_id: id,
              sender_id: user.id,
              body: body.trim(),
            });
            if (err) setError(err.message);
            else {
              setBody("");
              await reload();
            }
          }}
        >
          <Text style={styles.buttonText}>Enviar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: Colors.light.background },
  error: { color: "#B91C1C", marginBottom: 8 },
  bubble: {
    maxWidth: "85%",
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
  },
  mine: { alignSelf: "flex-end", backgroundColor: Colors.light.tint },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8EBF0",
  },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
