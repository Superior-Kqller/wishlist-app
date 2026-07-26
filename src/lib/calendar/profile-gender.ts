import { z } from "zod";

export const profileGenderSchema = z.enum(["MALE", "FEMALE"]);

export type ProfileGender = z.infer<typeof profileGenderSchema>;
