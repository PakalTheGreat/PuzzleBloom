import { Linking, Pressable, StyleSheet } from "react-native";
import { DEFAULT_PLAY_STORE_URL } from "@cwg/shared";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";

export function getPlayStoreUrl() {
  return (
    process.env.EXPO_PUBLIC_PLAY_STORE_URL?.trim() || DEFAULT_PLAY_STORE_URL
  );
}

export function PlayStoreButton() {
  const href = getPlayStoreUrl();
  return (
    <Pressable
      style={styles.button}
      onPress={() => void Linking.openURL(href)}
    >
      <Text style={styles.text}>Baixar na Google Play</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
    backgroundColor: Colors.light.brand,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  text: { color: "#fff", fontWeight: "700" },
});
