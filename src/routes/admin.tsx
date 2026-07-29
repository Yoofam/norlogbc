import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Lock, LogOut, Trash2, Plus, X, RefreshCw } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { formatNaira } from "@/lib/constants";
import { SiteSettingsPanel } from "@/components/admin/SiteSettingsPanel";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useStore, type Product } from "@/lib/store";
import type { SiteSettings } from "@/lib/schemas";
import {
  adminDashboard,
  adminLogin,
  adminLogout,
  adminStatus,
  deleteProduct,
  removeBooking,
  removeQuote,
  saveProduct,
  setBookingStatus,
  setQuoteStatus,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Norlog Building Concept" },
      { name: "description", content: "Internal control room for Norlog Building Concept." },
      { property: "og:title", content: "Admin — Norlog Building Concept" },
      { property: "og:description", content: "Internal control room." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Admin,
});

type Dashboard = NonNullable<Awaited<ReturnType<typeof adminDashboard>>>;

function Admin() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"quotes" | "bookings" | "products" | "site">("quotes");
  const [data, setData] = useState<Dashboard | null>(null);

  const status = useServerFn(adminStatus);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const dashboard = useServerFn(adminDashboard);
  const { refresh: refreshSite } = useStore();

  const load = useCallback(async () => {
    try {
      const res = await dashboard();
      if (!res) {
        setUnlocked(false);
        setData(null);
        return;
      }
      setData(res);
    } catch {
      setUnlocked(false);
    }
  }, [dashboard]);

  useEffect(() => {
    void (async () => {
      const s = await status();
      setUnlocked(s.admin);
      if (s.admin) await load();
    })();
  }, [status, load]);

  const tryUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await login({ data: { pin } });
    setBusy(false);
    setPin("");
    if (!res.ok) {
      toast.error(res.error ?? "Incorrect PIN");
      return;
    }
    setUnlocked(true);
    await load();
    toast.success("Welcome back.");
  };

  const lock = async () => {
    await logout();
    setUnlocked(false);
    setData(null);
  };

  if (unlocked === null) {
    return (
      <SiteLayout>
        <section className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 py-16 text-muted-foreground">
          Checking access…
        </section>
      </SiteLayout>
    );
  }

  if (!unlocked) {
    return (
      <SiteLayout>
        <section className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 py-16">
          <form onSubmit={tryUnlock} className="w-full border-2 border-foreground bg-card p-6">
            <div className="mb-4 grid h-14 w-14 place-items-center border-2 border-foreground bg-accent">
              <Lock className="h-7 w-7 text-accent-foreground" />
            </div>
            <h1 className="font-display text-2xl font-black uppercase tracking-wider">Admin Access</h1>
            <p className="mt-1 text-xs text-muted-foreground">Enter the 4-digit PIN.</p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              autoFocus
              className="mt-4 w-full border-2 border-foreground bg-background px-3 py-4 text-center font-display text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="••••"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full border-2 border-foreground bg-foreground px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              {busy ? "Checking…" : "Unlock"}
            </button>
          </form>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="border-b-2 border-foreground bg-foreground text-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8">
          <div>
            <div className="font-display text-xs font-bold uppercase tracking-[0.3em] text-accent">Admin</div>
            <h1 className="mt-1 font-display text-3xl font-black md:text-4xl">Control Room</h1>
            <p className="mt-1 text-xs text-background/60">Changes here are saved to the cloud and show on every device.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="inline-flex items-center gap-2 border-2 border-background px-4 py-2 font-display text-xs font-bold uppercase tracking-wider hover:bg-background hover:text-foreground">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={() => void lock()} className="inline-flex items-center gap-2 border-2 border-background px-4 py-2 font-display text-xs font-bold uppercase tracking-wider hover:bg-background hover:text-foreground">
              <LogOut className="h-4 w-4" /> Lock
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap gap-2">
          {(["quotes", "bookings", "products", "site"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-2 border-foreground px-4 py-2 font-display text-xs font-bold uppercase tracking-wider ${
                tab === t ? "bg-accent text-accent-foreground" : "bg-background hover:bg-foreground hover:text-background"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {!data ? (
            <EmptyState label="Loading…" />
          ) : (
            <>
              {tab === "quotes" && <QuotesPanel quotes={data.quotes} reload={load} />}
              {tab === "bookings" && <BookingsPanel bookings={data.bookings} reload={load} />}
              {tab === "products" && (
                <ProductsPanel
                  products={data.products as Product[]}
                  reload={async () => {
                    await load();
                    await refreshSite();
                  }}
                />
              )}
              {tab === "site" && (
                <SiteSettingsPanel
                  settings={data.settings as SiteSettings}
                  onSaved={async () => {
                    await load();
                    await refreshSite();
                  }}
                />
              )}
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function QuotesPanel({ quotes, reload }: { quotes: Dashboard["quotes"]; reload: () => Promise<void> }) {
  const setStatus = useServerFn(setQuoteStatus);
  const drop = useServerFn(removeQuote);
  if (quotes.length === 0) return <EmptyState label="No quote requests yet." />;
  return (
    <ul className="grid gap-4">
      {quotes.map((q) => {
        const total = q.items.reduce((a, c) => a + c.price * c.quantity, 0);
        return (
          <li key={q.id} className="border-2 border-foreground bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-lg font-bold uppercase tracking-wider">{q.name}</div>
                <div className="text-xs text-muted-foreground">{q.phone} · {q.email}</div>
                <div className="mt-1 text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={q.status}
                  onChange={async (e) => { await setStatus({ data: { id: q.id, status: e.target.value } }); await reload(); }}
                  className="border-2 border-foreground bg-background px-2 py-1 font-display text-xs font-bold uppercase tracking-wider"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={async () => { await drop({ data: { id: q.id } }); await reload(); }}
                  className="grid h-8 w-8 place-items-center border-2 border-foreground text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {q.notes && <p className="mt-3 border-l-4 border-accent bg-muted p-3 text-sm">{q.notes}</p>}
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {q.items.map((it, i) => (
                <li key={`${it.productId}-${i}`} className="flex items-center justify-between py-2 text-sm">
                  <div>{it.name} <span className="text-muted-foreground">× {it.quantity} ({it.unit})</span></div>
                  <div className="font-display font-bold">{formatNaira(it.price * it.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end font-display text-lg font-black">Total: {formatNaira(total)}</div>
          </li>
        );
      })}
    </ul>
  );
}

function BookingsPanel({ bookings, reload }: { bookings: Dashboard["bookings"]; reload: () => Promise<void> }) {
  const setStatus = useServerFn(setBookingStatus);
  const drop = useServerFn(removeBooking);
  if (bookings.length === 0) return <EmptyState label="No service bookings yet." />;
  return (
    <ul className="grid gap-4">
      {bookings.map((b) => (
        <li key={b.id} className="border-2 border-foreground bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg font-bold uppercase tracking-wider">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.phone} · {b.email}</div>
              <div className="mt-1 text-xs text-muted-foreground">Booked {new Date(b.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={b.status}
                onChange={async (e) => { await setStatus({ data: { id: b.id, status: e.target.value } }); await reload(); }}
                className="border-2 border-foreground bg-background px-2 py-1 font-display text-xs font-bold uppercase tracking-wider"
              >
                <option value="new">New</option>
                <option value="scheduled">Scheduled</option>
                <option value="done">Done</option>
              </select>
              <button
                onClick={async () => { await drop({ data: { id: b.id } }); await reload(); }}
                className="grid h-8 w-8 place-items-center border-2 border-foreground text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-1 text-sm">
            <div><span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Service:</span> {b.serviceType}</div>
            <div><span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Date:</span> {b.preferredDate}</div>
            <div><span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Location:</span> {b.location}</div>
            {b.details && <p className="mt-1 border-l-4 border-accent bg-muted p-3 text-sm">{b.details}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ProductsPanel({ products, reload }: { products: Product[]; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const save = useServerFn(saveProduct);
  const drop = useServerFn(deleteProduct);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 border-2 border-foreground bg-accent px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-accent-foreground"
        >
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>
      <div className="overflow-x-auto border-2 border-foreground">
        <table className="w-full text-sm">
          <thead className="bg-foreground text-background">
            <tr className="text-left font-display text-xs uppercase tracking-wider">
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Unit</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-10 w-14 border border-foreground object-cover" />
                  ) : (
                    <div className="grid h-10 w-14 place-items-center border border-dashed border-foreground text-[10px] text-muted-foreground">none</div>
                  )}
                </td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{formatNaira(p.price)}</td>
                <td className="p-3 text-muted-foreground">{p.unit}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(p)} className="border-2 border-foreground px-2 py-1 font-display text-[10px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background">
                      Edit
                    </button>
                    <button
                      onClick={async () => { await drop({ data: { id: p.id } }); await reload(); toast.success("Product removed"); }}
                      className="grid h-7 w-7 place-items-center border-2 border-foreground text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <ProductEditor
          initial={editing ?? undefined}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={async (p) => {
            try {
              await save({ data: editing ? { ...p, id: editing.id } : p });
              await reload();
              setEditing(null);
              setCreating(false);
              toast.success("Saved");
            } catch {
              toast.error("Could not save — the image may be too large.");
            }
          }}
        />
      )}
    </div>
  );
}

function ProductEditor({
  initial,
  onSave,
  onClose,
}: {
  initial?: Product;
  onSave: (p: { name: string; category: string; price: number; unit: string; description: string; image: string }) => void | Promise<void>;
  onClose: () => void;
}) {
  const [v, setV] = useState({
    name: initial?.name ?? "",
    category: initial?.category ?? "",
    price: initial?.price ?? 0,
    unit: initial?.unit ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? "",
  });
  const [saving, setSaving] = useState(false);
  const inputCls = "w-full border-2 border-foreground bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent";
  const labelCls = "font-display text-xs font-bold uppercase tracking-wider";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/70 p-4">
      <div className="w-full max-w-lg border-2 border-foreground bg-background p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-black uppercase tracking-wider">
            {initial ? "Edit product" : "New product"}
          </h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center border-2 border-foreground hover:bg-foreground hover:text-background">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1"><span className={labelCls}>Name</span>
            <input className={inputCls} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></label>
          <label className="grid gap-1"><span className={labelCls}>Category</span>
            <input className={inputCls} value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1"><span className={labelCls}>Price (₦)</span>
              <input type="number" className={inputCls} value={v.price} onChange={(e) => setV({ ...v, price: Number(e.target.value) })} /></label>
            <label className="grid gap-1"><span className={labelCls}>Unit</span>
              <input className={inputCls} value={v.unit} onChange={(e) => setV({ ...v, unit: e.target.value })} placeholder="per bag / per day" /></label>
          </div>
          <ImageUploadField
            label="Product image"
            value={v.image}
            onChange={(image) => setV({ ...v, image })}
          />
          <label className="grid gap-1"><span className={labelCls}>Description</span>
            <textarea rows={3} className={inputCls} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="border-2 border-foreground px-4 py-2 font-display text-xs font-bold uppercase tracking-wider">Cancel</button>
          <button
            disabled={saving}
            onClick={async () => {
              if (!v.name || !v.category || !v.unit || v.price < 0) {
                toast.error("Fill in name, category, unit and a non-negative price.");
                return;
              }
              setSaving(true);
              await onSave(v);
              setSaving(false);
            }}
            className="border-2 border-foreground bg-accent px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-accent-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed border-foreground p-12 text-center text-muted-foreground">
      {label}
    </div>
  );
}
