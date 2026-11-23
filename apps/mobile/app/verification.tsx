import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  createVerificationRequest,
  uploadVerificationDocument,
} from "@cwg/api";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useActiveRole } from "@/context/RoleContext";
import { CONFIG_MISSING_MESSAGE_PT, getSupabase } from "@/lib/supabase";

export default function VerificationScreen() {
  const { user, configured } = useAuth();
  const { activeRole } = useActiveRole();
  const [legalCategory, setLegalCategory] = useState("");
  const [docType, setDocType] = useState("documento_identidade");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setInfo(null);
    if (!configured || !user) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    const client = getSupabase();
    if (!client) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }

    const picked = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) {
      setError("Selecione um documento (PDF/imagem).");
      return;
    }
    const asset = picked.assets[0];

    setLoading(true);
    const { data: request, error: reqError } = await createVerificationRequest(
      client,
      {
        userId: user.id,
        role_context: activeRole,
        legal_category: legalCategory || null,
      },
    );
    if (reqError || !request) {
      setLoading(false);
      setError(reqError?.message ?? "Falha ao criar solicitação");
      return;
    }

    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const { error: upError } = await uploadVerificationDocument(client, {
      userId: user.id,
      requestId: request.id as string,
      docType,
      file: blob,
      fileName: asset.name ?? "documento.pdf",
      contentType: asset.mimeType ?? "application/octet-stream",
    });
    setLoading(false);
    if (upError) {
      setError(upError.message);
      return;
    }
    setInfo("Enviado para análise (pending_review). Badge público não expõe o arquivo.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificação</Text>
      <Text style={styles.body}>
        Upload privado no bucket verification-docs. Sem Supabase configurado, o
        envio fica bloqueado com mensagem clara.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Categoria legal"
        value={legalCategory}
        onChangeText={setLegalCategory}
      />
      <TextInput
        style={styles.input}
        placeholder="Tipo de documento"
        value={docType}
        onChangeText={setDocType}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Selecionar e enviar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.brand,
    marginBottom: 8,
  },
  body: { fontSize: 14, color: Colors.light.muted, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#D4D8E0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  error: { color: "#B91C1C", marginBottom: 8 },
  info: { color: Colors.light.tint, marginBottom: 8 },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
