import { z } from "zod";

export const quoteInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255),
  notes: z.string().trim().max(1000).default(""),
  items: z
    .array(
      z.object({
        productId: z.string().max(100),
        name: z.string().trim().min(1).max(200),
        price: z.number().nonnegative().max(1_000_000_000),
        unit: z.string().trim().max(100),
        quantity: z.number().int().positive().max(100000),
      }),
    )
    .min(1)
    .max(100),
});

export const bookingInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255),
  serviceType: z.string().trim().min(1).max(120),
  preferredDate: z.string().trim().min(1).max(40),
  location: z.string().trim().min(2).max(200),
  details: z.string().trim().max(1000).default(""),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a #rrggbb colour");
const dataUrl = z
  .string()
  .max(3_000_000)
  .refine((v) => v === "" || v.startsWith("data:image/") || v.startsWith("https://"), "Invalid image");

export const settingsSchema = z.object({
  companyName: z.string().trim().max(120),
  shortName: z.string().trim().max(60),
  subName: z.string().trim().max(60),
  tagline: z.string().trim().max(160),
  phone: z.string().trim().max(40),
  whatsapp: z.string().trim().max(40),
  email: z.string().trim().max(255),
  address: z.string().trim().max(255),
  notificationEmail: z.string().trim().email().max(255),
  logoUrl: dataUrl,
  siteName: z.string().trim().max(40),
  headerBg: hex,
  headerFg: hex,
  headerAccent: hex,
  siteBg: hex,
  siteFg: hex,
  siteAccent: hex,
  heroBadge: z.string().trim().max(160),
  heroIntro: z.string().trim().max(600),
  aboutHeadline: z.string().trim().max(160),
  aboutBody: z.string().trim().max(1500),
  footerBlurb: z.string().trim().max(600),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  price: z.number().nonnegative().max(1_000_000_000),
  unit: z.string().trim().min(1).max(80),
  description: z.string().trim().max(1000).default(""),
  image: dataUrl.default(""),
});

export type QuoteInput = z.infer<typeof quoteInputSchema>;
export type BookingInput = z.infer<typeof bookingInputSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type SiteSettings = z.infer<typeof settingsSchema>;
