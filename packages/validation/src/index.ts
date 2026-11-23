import { z } from "zod";

export const activeRoleSchema = z.enum(["grower", "specialist"]);
export const appRoleSchema = z.enum(["grower", "specialist", "admin"]);

export const verificationStatusSchema = z.enum([
  "unverified",
  "pending_review",
  "verified",
  "rejected",
  "suspended",
  "expired",
]);

export const userProfileUpdateSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(8).max(20).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  locale: z.string().default("pt-BR").optional(),
  timezone: z.string().default("America/Sao_Paulo").optional(),
  active_role: activeRoleSchema.optional().nullable(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export const growerProfileSchema = z.object({
  display_name: z.string().trim().min(2).max(120).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  region: z.string().trim().max(80).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
});

export const specialistProfileSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug inválido")
    .min(3)
    .max(60),
  headline: z.string().trim().max(160).optional().nullable(),
  bio: z.string().trim().max(4000).optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  region: z.string().trim().max(80).optional().nullable(),
  offers_remote: z.boolean().default(true),
  offers_in_person: z.boolean().default(false),
  years_experience: z.number().int().min(0).max(60).optional().nullable(),
});

export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
export type GrowerProfileInput = z.infer<typeof growerProfileSchema>;
export type SpecialistProfileInput = z.infer<typeof specialistProfileSchema>;
