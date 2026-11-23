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

export const emailSchema = z.string().trim().email("E-mail inválido");
export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().trim().min(2, "Informe seu nome").max(120),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha"),
});

export const passwordRecoverySchema = z.object({
  email: emailSchema,
});

export const roleIntentSchema = z.enum(["find", "offer", "both"]);

export const onboardingLegalSchema = z.object({
  confirmed_18_plus: z.literal(true, {
    errorMap: () => ({ message: "É necessário confirmar 18+" }),
  }),
  accepted_terms: z.literal(true, {
    errorMap: () => ({ message: "Aceite os Termos de Uso" }),
  }),
  accepted_privacy: z.literal(true, {
    errorMap: () => ({ message: "Aceite a Política de Privacidade" }),
  }),
});

export const onboardingRolesSchema = z.object({
  intent: roleIntentSchema,
});

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
  photo_url: z.string().url().optional().nullable().or(z.literal("")),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  region: z.string().trim().max(80).optional().nullable(),
  offers_remote: z.boolean().default(true),
  offers_in_person: z.boolean().default(false),
  years_experience: z.number().int().min(0).max(60).optional().nullable(),
  specialty_ids: z.array(z.string().uuid()).optional(),
});

export const verificationSubmitSchema = z.object({
  role_context: activeRoleSchema,
  legal_category: z.string().trim().min(2).max(120).optional().nullable(),
  specialty_id: z.string().uuid().optional().nullable(),
  doc_type: z.string().trim().min(2).max(80),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type PasswordRecoveryInput = z.infer<typeof passwordRecoverySchema>;
export type RoleIntent = z.infer<typeof roleIntentSchema>;
export type OnboardingLegalInput = z.infer<typeof onboardingLegalSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
export type GrowerProfileInput = z.infer<typeof growerProfileSchema>;
export type SpecialistProfileInput = z.infer<typeof specialistProfileSchema>;
export type VerificationSubmitInput = z.infer<typeof verificationSubmitSchema>;
