import { createServerFn } from "@tanstack/react-start";
import {
  admin,
  clearThrottle,
  grantAdmin,
  isAdmin,
  notifyAdminEmail,
  pinMatches,
  requireAdmin,
  revokeAdmin,
  throttle,
  toProduct,
  type ProductRow,
  DEFAULT_SETTINGS,
} from "./site.server";
import { productSchema, settingsSchema } from "./schemas";

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => ({
  admin: await isAdmin(),
}));

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: { pin: string }) => ({ pin: String(data?.pin ?? "").slice(0, 12) }))
  .handler(async ({ data }) => {
    if (!throttle("pin")) return { ok: false as const, error: "Too many attempts. Wait a minute." };
    if (!pinMatches(data.pin)) return { ok: false as const, error: "Incorrect PIN" };
    clearThrottle("pin");
    await grantAdmin();
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  await revokeAdmin();
  return { ok: true as const };
});

/** Everything the admin portal needs, including private fields. */
export const adminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  // Returns null instead of throwing so a locked/expired session renders the
  // PIN screen rather than surfacing an unhandled "Unauthorized" runtime error.
  if (!(await isAdmin())) return null;

  try {
    const db = await admin();
    const [settings, products, quotes, bookings] = await Promise.all([
      loadSettings(),
      loadProducts(),
      db.from("quote_requests").select("*").order("created_at", { ascending: false }),
      db.from("service_bookings").select("*").order("created_at", { ascending: false }),
    ]);
    return {
      settings,
      products,
      quotes: (quotes.data ?? []).map((q) => ({
        id: q.id as string,
        createdAt: q.created_at as string,
        name: q.customer_name as string,
        phone: q.customer_phone as string,
        email: q.customer_email as string,
        notes: (q.notes as string) ?? "",
        items: (q.items ?? []) as { productId: string; name: string; price: number; unit: string; quantity: number }[],
        status: q.status as string,
      })),
      bookings: (bookings.data ?? []).map((b) => ({
        id: b.id as string,
        createdAt: b.created_at as string,
        name: b.name as string,
        phone: b.phone as string,
        email: b.email as string,
        serviceType: b.service_type as string,
        preferredDate: b.preferred_date as string,
        location: b.location as string,
        details: (b.details as string) ?? "",
        status: b.status as string,
      })),
    };
  } catch (error) {
    console.warn("Falling back to local admin dashboard data", error);
    return {
      settings: DEFAULT_SETTINGS,
      products: [],
      quotes: [],
      bookings: [],
    };
  }
});

export const saveSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    const { error } = await db
      .from("site_settings")
      .upsert({ id: 1, data, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true as const };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .validator((data: unknown) => productSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    const payload = {
      name: data.name,
      category: data.category,
      price: data.price,
      unit: data.unit,
      description: data.description,
      image: data.image,
    };
    if (data.id) {
      const { error } = await db.from("products").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await db.from("products").insert(payload);
      if (error) throw error;
    }
    return { products: await loadProducts() };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    const { error } = await db.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { products: await loadProducts() };
  });

export const setQuoteStatus = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: string }) => ({
    id: String(data.id),
    status: ["new", "contacted", "closed"].includes(data.status) ? data.status : "new",
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    await db.from("quote_requests").update({ status: data.status }).eq("id", data.id);
    return { ok: true as const };
  });

export const removeQuote = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    await db.from("quote_requests").delete().eq("id", data.id);
    return { ok: true as const };
  });

export const setBookingStatus = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: string }) => ({
    id: String(data.id),
    status: ["new", "scheduled", "done"].includes(data.status) ? data.status : "new",
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    await db.from("service_bookings").update({ status: data.status }).eq("id", data.id);
    return { ok: true as const };
  });

export const removeBooking = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data }) => {
    const db = await admin();
    await db.from("service_bookings").delete().eq("id", data.id);
    return { ok: true as const };
  });

export const sendTestEmail = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  const settings = await loadSettings();
  const ok = await notifyAdminEmail(settings.notificationEmail, "Norlog test notification", {
    Message: "This is a test from the Norlog admin portal. Form submissions will arrive here.",
  });
  return { ok };
});

export type AdminProduct = ReturnType<typeof toProduct>;
export type AdminProductRow = ProductRow;
