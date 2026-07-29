import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getSiteData } from "@/lib/site.functions";

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

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
};

/** Branding / copy shown on the public site (never includes private fields). */
export type PublicSettings = {
  companyName: string;
  shortName: string;
  subName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
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

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  companyName: "NORLOG BUILDING CONCEPT",
  shortName: "NORLOG",
  subName: "Building Concept",
  tagline: "Building Stronger Foundations.",
  phone: "+234 803 000 0000",
  whatsapp: "+234 803 000 0000",
  email: "info@norlogbuilding.com",
  address: "Plot 14, Industrial Layout, Abuja, Nigeria",
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

const CART_KEY = "norlog.cart";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

type Ctx = {
  hydrated: boolean;
  settings: PublicSettings;
  products: Product[];
  refresh: () => Promise<void>;

  cart: CartItem[];
  addToCart: (p: Product, quantity?: number) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await getSiteData();
      setSettings({ ...DEFAULT_PUBLIC_SETTINGS, ...(data.settings as Partial<PublicSettings>) });
      setProducts(data.products as Product[]);
    } catch (err) {
      console.error("[store] failed to load site data", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    setCart(readCart());
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* ignore quota errors */
    }
  }, [cart, hydrated]);

  const value: Ctx = {
    hydrated,
    settings,
    products,
    refresh,
    cart,
    addToCart: (p, quantity = 1) =>
      setCart((prev) => {
        const found = prev.find((c) => c.productId === p.id);
        if (found) {
          return prev.map((c) =>
            c.productId === p.id ? { ...c, quantity: c.quantity + quantity } : c,
          );
        }
        return [...prev, { productId: p.id, name: p.name, price: p.price, unit: p.unit, quantity }];
      }),
    updateCartQty: (productId, quantity) =>
      setCart((prev) =>
        prev
          .map((c) => (c.productId === productId ? { ...c, quantity } : c))
          .filter((c) => c.quantity > 0),
      ),
    removeFromCart: (productId) => setCart((prev) => prev.filter((c) => c.productId !== productId)),
    clearCart: () => setCart([]),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
