import type { ActiveRole } from "@cwg/types";

import type { CwgSupabase } from "./clients";

const BUCKET = "verification-docs";

export async function createVerificationRequest(
  client: CwgSupabase,
  input: {
    userId: string;
    role_context: ActiveRole;
    legal_category?: string | null;
    specialty_id?: string | null;
  },
) {
  return client
    .from("verification_requests")
    .insert({
      user_id: input.userId,
      role_context: input.role_context,
      legal_category: input.legal_category ?? null,
      specialty_id: input.specialty_id ?? null,
      status: "pending_review",
      submitted_at: new Date().toISOString(),
    })
    .select("*")
    .single();
}

export async function uploadVerificationDocument(
  client: CwgSupabase,
  input: {
    userId: string;
    requestId: string;
    docType: string;
    file: Blob | ArrayBuffer | File;
    fileName: string;
    contentType: string;
  },
) {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${input.userId}/${input.requestId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await client.storage.from(BUCKET).upload(path, input.file, {
    contentType: input.contentType,
    upsert: false,
  });

  if (uploadError) return { data: null, error: uploadError, path: null };

  const { data, error } = await client
    .from("verification_documents")
    .insert({
      request_id: input.requestId,
      storage_path: path,
      doc_type: input.docType,
    })
    .select("*")
    .single();

  return { data, error, path };
}

export async function listMyVerificationRequests(client: CwgSupabase, userId: string) {
  return client
    .from("verification_requests")
    .select("*, verification_documents(*)")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });
}
