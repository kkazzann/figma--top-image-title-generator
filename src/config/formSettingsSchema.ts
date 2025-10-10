import { z } from "zod";

export const formSettingsSchema = z.object({
  spreadsheetTab: z.string().min(1, "Tab name required"),
  dataRange: z.string().min(1, "Range required"),
  primaryFontSize: z.string().optional().default(""),
  primaryLineHeight: z.string().optional().default(""),
  primaryFontWeight: z.string().optional().default("Regular"),
  secondaryFontSize: z.string().optional().default(""),
  secondaryLineHeight: z.string().optional().default(""),
  secondaryFontWeight: z.string().optional().default("Regular"),
  backgroundColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color"),
  textColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color"),
  highlightKeywords: z.string().optional().default(""),
  keywordFontSize: z.string().optional().default(""),
  keywordLineHeight: z.string().optional().default(""),
  keywordFontWeight: z.string().optional().default("Regular"),
});

export type FormSettingsValidated = z.infer<typeof formSettingsSchema>;
