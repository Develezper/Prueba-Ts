import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]);

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(320, "Email is too long.")
  .email("Email is invalid.")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(72, "Password must not exceed 72 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/\d/, "Password must include a number.");

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema.default("EMPLOYEE"),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(1, "Password is required.")
      .max(72, "Password must not exceed 72 characters."),
  })
  .strict();

export type LoginInput = z.input<typeof loginSchema>;
export type LoginData = z.output<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterData = z.output<typeof registerSchema>;
export type RoleInput = z.output<typeof roleSchema>;
