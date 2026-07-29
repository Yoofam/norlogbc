# Norlog Building Concept

Norlog Building Concept is a modern business website for a construction materials and equipment supplier in Nigeria. The app combines a public storefront, a quote-building experience, service booking, and an internal admin dashboard for managing requests and catalog content.

This repository contains the full front-end and server-side app logic for the site. It was built as a real product experience for Norlog rather than a generic starter template, with the business flows shaped around quote requests, service bookings, and product management.

## What the site includes

- A polished landing page for materials, equipment, and construction services
- A searchable product catalog for cement, blocks, iron rods, aggregates, and heavy equipment
- A quote builder that lets visitors collect items and submit a consolidated request
- A service booking form for site clearing, foundation work, concrete casting, and related services
- An admin area for managing quote requests, bookings, products, and site settings

## Tech stack

- React 19 with TypeScript
- TanStack Start and TanStack Router
- Tailwind CSS for styling
- Supabase for data and storage-backed workflows
- Zod for validation and form-safe data handling
- shadcn-style UI primitives and Lucide icons

## Project structure

- src/routes — public pages such as home, services, products, quote, and admin
- src/components — reusable UI and form components
- src/lib — store, schemas, business logic, and helpers
- supabase — database migrations and config
- tests — device/persistence checks and related QA helpers

## Getting started

Make sure you have Node.js installed, then run:

```bash
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

The app should be available locally in your browser at the Vite development URL shown in the terminal.

## Build and preview

```bash
npm run build
npm run preview
```

## Admin workflow

The admin experience is available at the /admin route. It allows authorized users to:

- review and update quote requests
- manage service bookings
- create, edit, or remove products
- adjust site-wide branding and content settings

## Notes

This project uses server-side integrations and environment-backed configuration for production workflows. If you are setting it up locally, make sure your Supabase and related environment variables are configured correctly before running the app.

## Credits

This project was developed as a tailored website experience for Norlog Building Concept. It uses modern web tooling and a custom implementation rather than relying on the default starter app experience.
