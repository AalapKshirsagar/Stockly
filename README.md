# Stockly: Inventory Tracker for Small Shops
 
A lightweight inventory management web app for independent retailers. Scan a product, stock decrements automatically, and low-stock items trigger reorder alerts. Built as a focused alternative to bloated POS systems.
 
## Deployment
 
* **Frontend**: Vercel
* **Backend**: Supabase (Postgres, Auth, Edge Functions)

 
## Features
 
* **Barcode Scanning**: Camera-based scanning via `html5-qrcode` with manual entry fallback for iOS Safari permission edge cases.
* **Automatic Stock Decrement**: Each scan creates a sale record and atomically reduces stock count via Postgres transaction.
* **Low-Stock Detection**: Configurable per-product `min_stock` threshold. Items below threshold surface on the dashboard ranked by deficit severity.
* **Email Alerts**: Supabase Edge Function dispatches reorder reminders when items cross the threshold.
* **Row-Level Security**: All tables enforce RLS so each shop only ever sees its own products, sales, and profile.
* **Sales History**: Timestamped log of every scan for basic auditing and turnover analysis.
## Project Structure
 
* **`src/components/`**: React UI components (Tailwind styled).
* **`src/lib/supabase.ts`**: Supabase client and typed query helpers.
* **`src/pages/`**: Route-level components (Dashboard, Scan, Products, Sales).
* **`supabase/schema.sql`**: Tables, indexes, and RLS policies.
* **`supabase/functions/low-stock-alert/`**: Edge Function for reorder emails.
## Prerequisites
 
* **Node.js v18+**
* **Supabase account** (free tier is enough)
* **Vercel account** (for deployment, optional)
## Installation
 
1. **Clone the repository**:
```
git clone https://github.com/[your-username]/stockly.git
cd stockly
```
 
2. **Install dependencies**:
```
npm install
```
 
3. **Configure environment**:
* Copy `.env.example` to `.env.local`.
* Add your Supabase URL and anon key.
4. **Apply schema**:
* Open the Supabase SQL editor and run `supabase/schema.sql`.
## Usage Workflow
 
