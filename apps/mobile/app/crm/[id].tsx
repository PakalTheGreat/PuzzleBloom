import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  addCrmNote,
  addCrmServiceRecord,
  completeCrmTask,
  createCrmTask,
  getCrmClient,
  listCrmNotes,
  listCrmServiceHistory,
  listCrmTasks,
  updateCrmClient,
} from "@cwg/api";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { getSupabase } from "@/lib/supabase";

export default function CrmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState<Array<Record<string, unknown>>>([]);
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [note, setNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    const sb = getSupabase();
    if (!sb) return;
    const { data: c, error: cErr } = await getCrmClient(sb, id);
    if (cErr || !c) {
      setError(cErr?.message ?? "Não encontrado");
      return;
    }
    setClient(c as Record<string, unknown>);
    const spId = c.specialist_profile_id as string;
    const [n, t, h] = await Promise.all([
      listCrmNotes(sb, id),
      listCrmTasks(sb, spId, id),
      listCrmServiceHistory(sb, id),
    ]);
    setNotes((n.data as Array<Record<string, unknown>>) ?? []);
    setTasks((t.data as Array<Record<string, unknown>>) ?? []);
    setHistory((h.data as Array<Record<string, unknown>>) ?? []);
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!client) {
    return (
      <View style={styles.container}>
        <Text>{error || "Carregando…"}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{String(client.display_name)}</Text>
      <Text style={styles.meta}>{String(client.status)}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.row}>
        {(["lead", "active", "inactive", "archived"] as const).map((s) => (
          <Pressable
            key={s}
            style={styles.chip}
            onPress={async () => {
              const sb = getSupabase();
              if (!sb || !id) return;
              await updateCrmClient(sb, id, { status: s });
              await reload();
            }}
          >
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Notas</Text>
      <TextInput
        style={styles.input}
        placeholder="Nova nota"
        value={note}
        onChangeText={setNote}
      />
      <Pressable
        style={styles.button}
        onPress={async () => {
          const sb = getSupabase();
          if (!sb || !id || !note.trim()) return;
          await addCrmNote(sb, id, note.trim());
          setNote("");
          await reload();
        }}
      >
        <Text style={styles.buttonText}>Salvar nota</Text>
      </Pressable>
      {notes.map((n) => (
        <Text key={String(n.id)} style={styles.item}>
          {String(n.body)}
        </Text>
      ))}

      <Text style={styles.section}>Tarefas</Text>
      <TextInput
        style={styles.input}
        placeholder="Nova tarefa"
        value={taskTitle}
        onChangeText={setTaskTitle}
      />
      <Pressable
        style={styles.button}
        onPress={async () => {
          const sb = getSupabase();
          if (!sb || !taskTitle.trim()) return;
          await createCrmTask(sb, {
            specialist_profile_id: client.specialist_profile_id as string,
            crm_client_id: id,
            title: taskTitle.trim(),
          });
          setTaskTitle("");
          await reload();
        }}
      >
        <Text style={styles.buttonText}>Criar tarefa</Text>
      </Pressable>
      {tasks.map((t) => (
        <Pressable
          key={String(t.id)}
          style={styles.itemRow}
          onPress={async () => {
            if (t.done_at) return;
            const sb = getSupabase();
            if (!sb) return;
            await completeCrmTask(sb, String(t.id));
            await reload();
          }}
        >
          <Text style={t.done_at ? styles.done : styles.item}>{String(t.title)}</Text>
        </Pressable>
      ))}

      <Text style={styles.section}>Histórico</Text>
      <TextInput
        style={styles.input}
        placeholder="Resumo do serviço"
        value={summary}
        onChangeText={setSummary}
      />
      <Pressable
        style={styles.button}
        onPress={async () => {
          const sb = getSupabase();
          if (!sb || !id || !summary.trim()) return;
          await addCrmServiceRecord(sb, {
            crm_client_id: id,
            summary: summary.trim(),
            occurred_on: new Date().toISOString().slice(0, 10),
          });
          setSummary("");
          await reload();
        }}
      >
        <Text style={styles.buttonText}>Registrar</Text>
      </Pressable>
      {history.map((h) => (
        <Text key={String(h.id)} style={styles.item}>
          {String(h.summary)}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand },
  meta: { color: Colors.light.muted, marginBottom: 12 },
  error: { color: "#B91C1C", marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  chip: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  section: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "700",
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  item: { paddingVertical: 6, color: Colors.light.text },
  itemRow: { paddingVertical: 6 },
  done: { textDecorationLine: "line-through", color: Colors.light.muted },
});
