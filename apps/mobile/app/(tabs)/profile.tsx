import { Link } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { useActiveRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";

export default function ProfileTab() {
  const { activeRole, toggleRole, canToggle } = useActiveRole();
  const { demoMode, user, me, signOutLocal } = useAuth();
  const isSpecialist =
    activeRole === "specialist" || Boolean(me?.roles?.includes("specialist"));
  const isAdmin = Boolean(me?.roles?.includes("admin"));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      {demoMode ? (
        <Text style={styles.meta}>Sessão de demonstração</Text>
      ) : null}
      <Text style={styles.body}>
        {user ? user.email : "Não autenticado"}
      </Text>
      <Text style={styles.body}>
        Papel ativo:{" "}
        <Text style={styles.strong}>
          {activeRole === "grower" ? "Cultivador" : "Especialista"}
        </Text>
      </Text>
      <Text style={styles.meta}>
        Papéis: {me?.roles?.join(", ") || "—"} · Onboarding:{" "}
        {me?.onboardingComplete ? "ok" : "pendente"}
      </Text>

      {canToggle ? (
        <Pressable onPress={toggleRole} style={styles.button}>
          <Text style={styles.buttonText}>
            Alternar para{" "}
            {activeRole === "grower" ? "Especialista" : "Cultivador"}
          </Text>
        </Pressable>
      ) : null}

      {!user ? (
        <Link href="/(auth)/entrar" style={styles.link}>
          Entrar
        </Link>
      ) : (
        <>
          {!me?.onboardingComplete ? (
            <Link href="/onboarding" style={styles.link}>
              Concluir onboarding
            </Link>
          ) : null}
          {isSpecialist ? (
            <>
              <Link href="/specialist-edit" style={styles.link}>
                Editar perfil especialista
              </Link>
              <Link href="/verification" style={styles.link}>
                Enviar verificação
              </Link>
              <Link href="/calendario" style={styles.link}>
                Calendário
              </Link>
              <Link href="/crm" style={styles.link}>
                CRM
              </Link>
              <Link href="/solicitacoes" style={styles.link}>
                Solicitações recebidas
              </Link>
            </>
          ) : null}
          {activeRole === "grower" ? (
            <>
              <Link href="/(tabs)/favorites" style={styles.link}>
                Favoritos
              </Link>
              <Link href="/(tabs)/appointments" style={styles.link}>
                Agendamentos
              </Link>
            </>
          ) : null}
          <Link href="/mensagens" style={styles.link}>
            Mensagens
          </Link>
          {isAdmin ? (
            <Text style={styles.meta}>Conta admin (demo)</Text>
          ) : null}
          <Pressable onPress={() => void signOutLocal()} style={styles.secondary}>
            <Text style={styles.secondaryText}>Sair</Text>
          </Pressable>
        </>
      )}
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
  body: { fontSize: 16, color: Colors.light.text, marginBottom: 8 },
  meta: { fontSize: 13, color: Colors.light.muted, marginBottom: 16 },
  strong: { fontWeight: "700" },
  button: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  link: {
    marginTop: 12,
    color: Colors.light.tint,
    fontWeight: "600",
    fontSize: 16,
  },
  secondary: { marginTop: 24 },
  secondaryText: { color: Colors.light.muted, fontWeight: "600" },
});
