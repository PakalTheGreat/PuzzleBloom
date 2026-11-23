import { SymbolView } from "expo-symbols";
import { Link, Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text } from "react-native";

import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useActiveRole } from "@/context/RoleContext";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

type TabDef = {
  name: string;
  title: string;
  ios: string;
  android: string;
};

const GROWER_TABS: TabDef[] = [
  { name: "index", title: "Explorar", ios: "magnifyingglass", android: "search" },
  { name: "favorites", title: "Favoritos", ios: "heart", android: "favorite" },
  { name: "appointments", title: "Agenda", ios: "calendar", android: "event" },
  { name: "messages", title: "Mensagens", ios: "bubble.left", android: "chat" },
  { name: "profile", title: "Perfil", ios: "person", android: "person" },
];

const SPECIALIST_TABS: TabDef[] = [
  { name: "index", title: "Dashboard", ios: "square.grid.2x2", android: "dashboard" },
  { name: "favorites", title: "Agenda", ios: "calendar", android: "event" },
  { name: "appointments", title: "CRM", ios: "person.2", android: "group" },
  { name: "messages", title: "Solicitações", ios: "tray", android: "inbox" },
  { name: "profile", title: "Perfil", ios: "person", android: "person" },
];

const GUEST_TABS: TabDef[] = [
  { name: "index", title: "Explorar", ios: "magnifyingglass", android: "search" },
  { name: "profile", title: "Perfil", ios: "person", android: "person" },
];

export default function TabLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeRole, toggleRole, canToggle } = useActiveRole();
  const tint = Colors.light.tint;

  const tabs = !user
    ? GUEST_TABS
    : activeRole === "grower"
      ? GROWER_TABS
      : SPECIALIST_TABS;

  useEffect(() => {
    // Hide unused tab screens when guest — Expo Router still registers all files.
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: useClientOnlyValue(false, true),
        headerStyle: { backgroundColor: Colors.light.background },
        headerTitleStyle: { color: Colors.light.brand, fontWeight: "700" },
      }}
    >
      {(["index", "favorites", "appointments", "messages", "profile"] as const).map(
        (name) => {
          const tab = tabs.find((t) => t.name === name);
          const hidden = !tab;
          return (
            <Tabs.Screen
              key={`${user ? activeRole : "guest"}-${name}`}
              name={name}
              listeners={
                hidden
                  ? {
                      tabPress: (e) => {
                        e.preventDefault();
                        if (!loading && !user) router.push("/(auth)/entrar");
                      },
                    }
                  : undefined
              }
              options={{
                href: hidden ? null : undefined,
                title: tab?.title ?? name,
                tabBarIcon: ({ color }) =>
                  tab ? (
                    <SymbolView
                      name={{
                        ios: tab.ios as never,
                        android: tab.android as never,
                        web: tab.android as never,
                      }}
                      tintColor={color}
                      size={26}
                    />
                  ) : null,
                headerRight: () =>
                  user && canToggle ? (
                    <Pressable
                      onPress={toggleRole}
                      style={{
                        marginRight: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Alternar papel grower/specialist"
                    >
                      {({ pressed }) => (
                        <Text
                          style={{
                            color: Colors.light.tint,
                            fontWeight: "600",
                            opacity: pressed ? 0.5 : 1,
                            fontSize: 13,
                          }}
                        >
                          {activeRole === "grower"
                            ? "→ Especialista"
                            : "→ Cultivador"}
                        </Text>
                      )}
                    </Pressable>
                  ) : null,
                headerLeft: () =>
                  name === "index" ? (
                    <Link href="/modal" asChild>
                      <Pressable style={{ marginLeft: 12 }}>
                        {({ pressed }) => (
                          <Text
                            style={{
                              color: Colors.light.brand,
                              fontWeight: "700",
                              opacity: pressed ? 0.6 : 1,
                            }}
                          >
                            CWG
                          </Text>
                        )}
                      </Pressable>
                    </Link>
                  ) : undefined,
              }}
            />
          );
        },
      )}
    </Tabs>
  );
}
