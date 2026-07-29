// Server-only helpers for the Norlog site. Never imported from the browser.
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type SiteSettings = {
  companyName: string;
  shortName: string;
  subName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  notificationEmail: string;
  logoUrl: string;
  siteName: string;
  headerBg: string;
  headerFg: string;
  headerAccent: string;
  siteBg: string;
  siteFg: string;
  siteAccent: string;
  heroBadge: string;
  heroIntro: string;
  aboutHeadline: string;
  aboutBody: string;
  footerBlurb: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  companyName: "NORLOG BUILDING CONCEPT",
  shortName: "NORLOG",
  subName: "Building Concept",
  tagline: "Building Stronger Foundations.",
  phone: "+234 803 000 0000",
  whatsapp: "+234 803 000 0000",
  email: "info@norlogbuilding.com",
  address: "Plot 14, Industrial Layout, Abuja, Nigeria",
  notificationEmail: "owner@norlogbuilding.com",
  logoUrl: "",
  siteName: "NORLOG",
  headerBg: "#15171b",
  headerFg: "#f6f6f4",
  headerAccent: "#f5851f",
  siteBg: "#fafaf7",
  siteFg: "#1a1c20",
  siteAccent: "#f5851f",
  heroBadge: "Est. Nigeria · Trusted by Contractors",
  heroIntro:
    "Building materials, heavy equipment sales and rentals, and full-service construction — delivered on time, priced right, and built to last.",
  aboutHeadline: "Built On Trust. Backed By Concrete.",
  aboutBody:
    "Norlog Building Concept is a Nigerian construction company serving contractors, developers and homeowners with reliable building materials, heavy equipment, and skilled construction crews. We keep projects moving — from the first ground break to the final finish.",
  footerBlurb:
    "Delivering trusted building materials, heavy equipment, and construction services across Nigeria.",
};

type AdminSession = { admin?: boolean; at?: number };

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function sessionConfig() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return {
    password,
    name: "norlog-admin",
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      secure: true,
        // The admin portal is often used inside Lovable's preview iframe.
        // Cross-site iframes only send cookies marked SameSite=None; without
        // this, login succeeds but the next admin server call cannot see the
        // session and reports "Unauthorized".
        sameSite: "none" as const,
      path: "/",
    },
  };
}

export async function adminSession() {
  return useSession<AdminSession>(sessionConfig());
}

export async function isAdmin(): Promise<boolean> {
  const session = await adminSession();
  return session.data.admin === true;
}

/** Throws when the caller has not unlocked the admin portal. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

export function pinMatches(input: string): boolean {
  const expected = process.env.ADMIN_PIN;
  if (!expected) throw new Error("ADMIN_PIN is not configured");
  const a = createHash("sha256").update(String(input), "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function grantAdmin() {
  const session = await adminSession();
  await session.update({ admin: true, at: Date.now() });
}

export async function revokeAdmin() {
  const session = await adminSession();
  await session.clear();
}

/** Very small in-memory throttle for PIN attempts (per worker instance). */
const attempts = new Map<string, { count: number; until: number }>();

export function throttle(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (rec && rec.until > now && rec.count >= 8) return false;
  if (!rec || rec.until <= now) attempts.set(key, { count: 1, until: now + 60_000 });
  else rec.count += 1;
  return true;
}

export function clearThrottle(key: string) {
  attempts.delete(key);
}

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  image: string;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  image: string;
  sortOrder: number;
};

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    unit: row.unit,
    description: row.description ?? "",
    image: row.image ?? "",
    sortOrder: row.sort_order ?? 0,
  };
}

export async function loadSettings(): Promise<SiteSettings> {
  const db = await admin();
  const { data } = await db.from("site_settings").select("data").eq("id", 1).maybeSingle();
  return { ...DEFAULT_SETTINGS, ...((data?.data as Partial<SiteSettings>) ?? {}) };
}

export async function loadProducts(): Promise<Product[]> {
  const db = await admin();
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ProductRow[]).map(toProduct);
}

/** Strips fields the public site has no business knowing about. */
export function publicSettings(s: SiteSettings) {
  const { notificationEmail: _hidden, ...rest } = s;
  return rest;
}

/**
 * Emails a submission to the address configured in Admin → Site, via FormSubmit
 * (host-agnostic relay, no API key). Runs on the server so the notification
 * address is never exposed to visitors.
 */
export async function notifyAdminEmail(
  toEmail: string,
  subject: string,
  fields: Record<string, string>,
): Promise<boolean> {
  const email = toEmail.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return false;
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ _subject: subject, _template: "table", ...fields }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const naira = (n: number) => "₦" + Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 });
