import { createServerFn } from "@tanstack/react-start";
import {
  loadProducts,
  loadSettings,
  publicSettings,
  admin,
  notifyAdminEmail,
  naira,
} from "./site.server";
import { quoteInputSchema, bookingInputSchema } from "./schemas";

/** Public site content: branding + catalogue. No private fields. */
export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const [settings, products] = await Promise.all([loadSettings(), loadProducts()]);
  return { settings: publicSettings(settings), products };
});

export const submitQuoteRequest = createServerFn({ method: "POST" })
  .validator((data: unknown) => quoteInputSchema.parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("quote_requests")
      .insert({
        customer_name: data.name,
        customer_phone: data.phone,
        customer_email: data.email,
        notes: data.notes,
        items: data.items,
      })
      .select("id")
      .single();
    if (error) throw error;

    const settings = await loadSettings();
    const subtotal = data.items.reduce((a, c) => a + c.price * c.quantity, 0);
    await notifyAdminEmail(settings.notificationEmail, `New quote request ${row.id}`, {
      Reference: row.id,
      Name: data.name,
      Phone: data.phone,
      Email: data.email,
      Notes: data.notes || "-",
      Items: data.items
        .map((c) => `${c.name} x ${c.quantity} (${c.unit}) - ${naira(c.price * c.quantity)}`)
        .join("\n"),
      Subtotal: naira(subtotal),
    });
    return { id: row.id as string };
  });

export const submitBookingRequest = createServerFn({ method: "POST" })
  .validator((data: unknown) => bookingInputSchema.parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("service_bookings")
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        service_type: data.serviceType,
        preferred_date: data.preferredDate,
        location: data.location,
        details: data.details,
      })
      .select("id")
      .single();
    if (error) throw error;

    const settings = await loadSettings();
    await notifyAdminEmail(settings.notificationEmail, `New service booking ${row.id}`, {
      Reference: row.id,
      Name: data.name,
      Phone: data.phone,
      Email: data.email,
      Service: data.serviceType,
      "Preferred date": data.preferredDate,
      Location: data.location,
      Details: data.details || "-",
    });
    return { id: row.id as string };
  });
