CREATE TABLE public.site_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL,
  notes text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'new'
);
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  service_type text NOT NULL,
  preferred_date text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new'
);
GRANT ALL ON public.service_bookings TO service_role;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.site_settings (id, data) VALUES (1, '{
  "companyName": "NORLOG BUILDING CONCEPT",
  "shortName": "NORLOG",
  "subName": "Building Concept",
  "tagline": "Building Stronger Foundations.",
  "phone": "+234 803 000 0000",
  "whatsapp": "+234 803 000 0000",
  "email": "info@norlogbuilding.com",
  "address": "Plot 14, Industrial Layout, Abuja, Nigeria",
  "notificationEmail": "owner@norlogbuilding.com",
  "logoUrl": "",
  "siteName": "NORLOG",
  "headerBg": "#15171b",
  "headerFg": "#f6f6f4",
  "headerAccent": "#f5851f",
  "siteBg": "#fafaf7",
  "siteFg": "#1a1c20",
  "siteAccent": "#f5851f",
  "heroBadge": "Est. Nigeria \u00b7 Trusted by Contractors",
  "heroIntro": "Building materials, heavy equipment sales and rentals, and full-service construction \u2014 delivered on time, priced right, and built to last.",
  "aboutHeadline": "Built On Trust. Backed By Concrete.",
  "aboutBody": "Norlog Building Concept is a Nigerian construction company serving contractors, developers and homeowners with reliable building materials, heavy equipment, and skilled construction crews. We keep projects moving \u2014 from the first ground break to the final finish.",
  "footerBlurb": "Delivering trusted building materials, heavy equipment, and construction services across Nigeria."
}'::jsonb);

INSERT INTO public.products (name, category, price, unit, description, sort_order) VALUES
  ('Dangote Cement', 'Cement', 9500, 'per bag (50kg)', 'Grade 42.5, factory sealed.', 1),
  ('BUA Cement', 'Cement', 9200, 'per bag (50kg)', '', 2),
  ('6-inch Solid Block', 'Blocks', 550, 'per block', '', 3),
  ('9-inch Hollow Block', 'Blocks', 650, 'per block', '', 4),
  ('Iron Rod 12mm', 'Reinforcement', 8500, 'per length', '', 5),
  ('Iron Rod 16mm', 'Reinforcement', 14200, 'per length', '', 6),
  ('Binding Wire', 'Reinforcement', 1800, 'per kg', '', 7),
  ('Sharp Sand', 'Aggregates', 85000, 'per trip (20 ton)', '', 8),
  ('Granite 3/4', 'Aggregates', 240000, 'per trip (30 ton)', '', 9),
  ('Ceramic Floor Tile 60x60', 'Tiles', 6800, 'per carton', '', 10),
  ('Excavator (CAT 320)', 'Equipment Rental', 180000, 'per day', '', 11),
  ('Concrete Mixer', 'Equipment Rental', 25000, 'per day', '', 12),
  ('Tipper Truck', 'Equipment Rental', 90000, 'per day', '', 13),
  ('Roofing Sheet (Long Span)', 'Roofing', 5400, 'per meter', '', 14);