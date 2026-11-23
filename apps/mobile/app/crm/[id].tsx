import { useLocalSearchParams, useRouter } from "expo-router";
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
import { DEMO_CRM_CLIENTS, DEMO_CRM_NOTES, DEMO_CRM_TASKS } from "@cwg/demo";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

export default function CrmDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { demoMode, user } = useAuth();
  const [client, setClient] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState<Array<Record<string, unknown>>>([]);
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [note, setNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.replace("/(auth)/entrar");
  }, [user, router]);

  const reload = useCallback(async () => {
    if (!id) return;
    if (demoMode) {
      const found = DEMO_CRM_CLIENTS.find((c) => c.id === id);
      if (!found) {
        setError("Não encontrado");
        setClient(null);
        return;
      }
      setClient({ ...found });
      setNotes(
        DEMO_CRM_NOTES.filter((n) => n.client_id === id) as Array<
          Record<string, unknown>
        >,
      );
      setTasks(
        DEMO_CRM_TASKS.filter((t) => t.client_id === id) as Array<
          Record<string, unknown>
        >,
      );
      setHistory([
        {
          id: "hist-1",
          summary: "Consulta remota de SOP",
          occurred_on: "2026-11-10",
        },
      ]);
      return;
    }
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
  }, [demoMode, id]);

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
              if (demoMode) {
                setClient((prev) => (prev ? { ...prev, status: s } : prev));
                return;
              }
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
        value={note}
        onChangeText={setNote}
        placeholder="Nova nota"
      />
      <Pressable
        style={styles.button}
        onPress={async () => {
          if (!note.trim() || !id) return;
          if (demoMode) {
            setNotes((prev) => [
              {
                id: `note-${Date.now()}`,
                body: note.trim(),
                created_at: new Date().toISOString(),
              },
              ...prev,
            ]);
            setNote("");
            return;
          }
          const sb = getSupabase();
          if (!sb) return;
          await addCrmNote(sb, id, note.trim());
          setNote("");
          await reload();
        }}
      >
        <Text style={styles.buttonText}>Salvar nota</Text>
      </Pressable>
      {notes.map((n) => (
        <Text key={String(n.id)} style={styles.meta}>
          {String(n.body)}
        </Text>
      ))}

      <Text style={styles.section}>Tarefas</Text>
      <TextInput
        style={styles.input}
        value={taskTitle}
        onChangeText={setTaskTitle}
        placeholder="Nova tarefa"
      />
      <Pressable
        style={styles.button}
        onPress={async () => {
          if (!taskTitle.trim() || !client) return;
          if (demoMode) {
            setTasks((prev) => [
              ...prev,
              {
                id: `task-${Date.now()}`,
                title: taskTitle.trim(),
                status: "open",
              },
            ]);
            setTaskTitle("");
            return;
          }
          const sb = getSupabase();
          if (!sb || !id) return;
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
          onPress={async () => {
            if (t.status !== "open") return;
            if (demoMode) {
              setTasks((prev) =>
                prev.map((row) =>
                  row.id === t.id ? { ...row, status: "done" } : row,
                ),
              );
              return;
            }
            const sb = getSupabase();
            if (!sb) return;
            await completeCrmTask(sb, String(t.id));
            await reload();
          }}
        >
          <Text style={styles.meta}>
            {String(t.title)} ({String(t.status)})
          </Text>
        </Pressable>
      ))}

      <Text style={styles.section}>Histórico</Text>
      <TextInput
        style={styles.input}
        value={summary}
        onChangeText={setSummary}
        placeholder="Resumo do serviço"
      />
      <Pressable
        style={styles.button}
        onPress={async () => {
          if (!summary.trim() || !id) return;
          if (demoMode) {
            setHistory((prev) => [
              {
                id: `hist-${Date.now()}`,
                summary: summary.trim(),
                occurred_on: new Date().toISOString().slice(0, 10),
              },
              ...prev,
            ]);
            setSummary("");
            return;
          }
          const sb = getSupabase();
          if (!sb) return;
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
        <Text key={String(h.id)} style={styles.meta}>
          {String(h.summary)} · {String(h.occurred_on)}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand },
  meta: { color: Colors.light.muted, fontSize: 13, marginTop: 4 },
  error: { color: "#B91C1C", marginTop: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  section: { marginTop: 20, marginBottom: 8, fontWeight: "700" },
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
});
