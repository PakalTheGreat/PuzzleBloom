import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import Colors from "@/constants/Colors";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CWG</Text>
      <Text style={styles.body}>
        Connect With Growers — shell mobile Phase 1. Sem estética recreativa;
        tema profissional verde profundo / grafite.
      </Text>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.brand,
    marginBottom: 12,
  },
  body: { fontSize: 16, lineHeight: 24, color: Colors.light.text },
});
