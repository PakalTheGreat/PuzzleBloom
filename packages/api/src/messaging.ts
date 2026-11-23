import type { CwgSupabase } from "./clients";

export async function listMyConversations(client: CwgSupabase, userId: string) {
  const { data: memberships, error } = await client
    .from("conversation_members")
    .select("conversation_id, conversations(id, updated_at)")
    .eq("user_id", userId);
  if (error) return { data: null, error };

  const ids = (memberships ?? []).map((m) => m.conversation_id as string);
  if (ids.length === 0) return { data: [], error: null };

  // Last message preview per conversation
  const { data: messages, error: msgErr } = await client
    .from("messages")
    .select("id, conversation_id, body, sent_at, sender_id")
    .in("conversation_id", ids)
    .order("sent_at", { ascending: false });

  if (msgErr) return { data: null, error: msgErr };

  const latestByConv = new Map<string, (typeof messages)[number]>();
  for (const m of messages ?? []) {
    if (!latestByConv.has(m.conversation_id as string)) {
      latestByConv.set(m.conversation_id as string, m);
    }
  }

  const { data: members } = await client
    .from("conversation_members")
    .select("conversation_id, user_id, users(full_name, email)")
    .in("conversation_id", ids);

  const result = ids.map((id) => {
    const others = (members ?? []).filter(
      (m) => m.conversation_id === id && m.user_id !== userId,
    );
    return {
      id,
      latest: latestByConv.get(id) ?? null,
      members: others,
    };
  });

  result.sort((a, b) => {
    const ta = a.latest?.sent_at ? Date.parse(a.latest.sent_at as string) : 0;
    const tb = b.latest?.sent_at ? Date.parse(b.latest.sent_at as string) : 0;
    return tb - ta;
  });

  return { data: result, error: null };
}

export async function listMessages(client: CwgSupabase, conversationId: string) {
  return client
    .from("messages")
    .select("id, body, sent_at, sender_id, read_at")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true });
}

export async function sendMessage(
  client: CwgSupabase,
  input: { conversation_id: string; sender_id: string; body: string },
) {
  const { data, error } = await client
    .from("messages")
    .insert(input)
    .select("*")
    .single();
  if (!error) {
    await client
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", input.conversation_id);
  }
  return { data, error };
}

/** Create or reuse a 1:1 conversation between two users. */
export async function getOrCreateDirectConversation(
  client: CwgSupabase,
  userA: string,
  userB: string,
) {
  const { data: myMemberships } = await client
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userA);

  const myIds = (myMemberships ?? []).map((m) => m.conversation_id as string);
  if (myIds.length > 0) {
    const { data: shared } = await client
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userB)
      .in("conversation_id", myIds)
      .limit(1)
      .maybeSingle();
    if (shared?.conversation_id) {
      return { data: { id: shared.conversation_id as string }, error: null };
    }
  }

  const { data: conv, error: convErr } = await client
    .from("conversations")
    .insert({})
    .select("*")
    .single();
  if (convErr || !conv) return { data: null, error: convErr };

  const { error: memErr } = await client.from("conversation_members").insert([
    { conversation_id: conv.id, user_id: userA },
    { conversation_id: conv.id, user_id: userB },
  ]);
  if (memErr) return { data: null, error: memErr };
  return { data: { id: conv.id as string }, error: null };
}
