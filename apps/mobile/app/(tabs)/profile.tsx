import { Pressable, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import Colors from "@/constants/Colors";

export default function ProfileTab() {
  const { activeRole, toggleRole } = useActiveRole();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.body}>
        Papel ativo:{" "}
        <Text style={styles.strong}>
          {activeRole === "grower" ? "Cultivador" : "Especialista"}
        </Text>
      </Text>
      <Pressable onPress={toggleRole} style={styles.button}>
        <Text style={styles.buttonText}>
          Alternar para {activeRole === "grower" ? "Especialista" : "Cultivador"}
        </Text>
      </Pressable>
      <Text style={styles.hint}>
        Persistência em SecureStore / users.active_role virá com auth (Phase 1).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  title: { fontSize: 22, fontWeight: "700", color: Colors.light.brand, marginBottom: 8 },
  body: { fontSize: 16, color: Colors.light.text, marginBottom: 16 },
  strong: { fontWeight: "700" },
  button: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  hint: { marginTop: 16, fontSize: 13, color: Colors.light.muted, maxWidth: 360 },
});
