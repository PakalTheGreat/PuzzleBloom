import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import Colors from "@/constants/Colors";

export default function FourthTab() {
  const { activeRole } = useActiveRole();
  const title = activeRole === "grower" ? "Mensagens" : "Solicitações";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>Shell Phase 1 — messaging / requests nas fases 2–3.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand, marginBottom: 8 },
  body: { fontSize: 15, color: Colors.light.muted },
});
