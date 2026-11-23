import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import Colors from "@/constants/Colors";

export default function HomeTab() {
  const { activeRole } = useActiveRole();
  const isGrower = activeRole === "grower";

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>CWG · Phase 1 shell</Text>
      <Text style={styles.title}>
        {isGrower ? "Explorar especialistas" : "Dashboard do especialista"}
      </Text>
      <Text style={styles.body}>
        {isGrower
          ? "Stub: cards de especialistas, filtros e detalhe virão com Supabase + explore."
          : "Stub: resumo de solicitações, agenda e CRM limitado (Free)."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  kicker: {
    color: Colors.light.muted,
    fontSize: 13,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.brand,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
    maxWidth: 420,
  },
});
