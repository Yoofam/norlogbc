// Public, non-secret display values only. Secrets (admin PIN, notification
// email) live in server-side env vars / the database — never in this bundle.
export const COMPANY = {
  name: "NORLOG BUILDING CONCEPT",
  tagline: "Building Stronger Foundations.",
  phone: "+234 803 000 0000",
  whatsapp: "+234 803 000 0000",
  email: "info@norlogbuilding.com",
  address: "Plot 14, Industrial Layout, Abuja, Nigeria",
};

export const formatNaira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
