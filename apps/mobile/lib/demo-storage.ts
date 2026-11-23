import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  decodeDemoSession,
  encodeDemoSession,
  type DemoSession,
} from "@cwg/demo";

const KEY = "cwg.demo_session";

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadDemoSession(): Promise<DemoSession | null> {
  const raw = await getItem(KEY);
  return decodeDemoSession(raw);
}

export async function saveDemoSession(session: DemoSession): Promise<void> {
  await setItem(KEY, encodeDemoSession(session));
}

export async function clearDemoSession(): Promise<void> {
  await removeItem(KEY);
}
