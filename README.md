# Draco Delivery Note Management System (BUNNY CORP)
Cloudflare Sync Test

A lightweight, blazing-fast, mobile-first **Delivery Note Management System** for **Draco (Bunny Corp Limited)**, designed to be deployed instantly on **Cloudflare Pages** and **Cloudflare R2 Storage**.

This terminal allows sales representatives to generate official Thai delivery notes in **less than 30 seconds (maximum 3 taps)**, auto-incrementing serial arrays (`BCYY/XXX`) and embedding authorized signatures and company stamps on vector paper vouchers dynamically.

---

## 🎨 THE DESIGN PHILOSOPHY
* **Draco Visual Identity**: Styled purely in rich blacks, deep charcoal, gold, and bone white accents (`Black`, `Gold`, `White`).
* **Micro-Optimzed Mobile Flow**: Standardized touch-targets exceeding 44px, minimal typing, and autocompletion fields.
* **Double-Pronged PDF Engine**:
  1. **pdf-lib Client Engine**: Generates real binary PDF payloads, saves them to Cloudflare R2, and retrieves static URLs for permanent cloud archiving.
  2. **Browser Print Engine**: Utilizes `@media print` CSS overrides to open a 100% exact replica of Draco’s printed layout with gorgeous native Thai characters, instantly printable to thermal, laser, or system-PDF.

---

## 🏗️ FOLDER HIERARCHY

```text
├── /assets/                       # Project local/production visual assets
├── /functions/                    # Cloudflare Pages Functions (Serverless Backend)
│   └── /api/
│       └── upload-pdf.ts          # Serverless Worker: Handles R2 file writes & stream services
├── /src/
│   ├── /components/               # High-fidelity UI Components
│   │   ├── CreateNote.tsx         # Fast 30-second Delivery Note builder
│   │   ├── Dashboard.tsx          # Real-time metrics dashboard
│   │   ├── HistoryList.tsx        # Searchable archives & social sharing portal
│   │   ├── PrintPreview.tsx       # Pixel-perfect HTML A4 printed mock
│   │   └── Settings.tsx           # Admin portal for Excel import/export
│   ├── /utils/                    # Native JavaScript helper libraries
│   │   ├── assets.ts              # SVG elements for Logo, Stamp, and Autographed ink
│   │   ├── bahttext.ts            # Thai currency spelling converter
│   │   ├── db.ts                  # Local Storage state tables and serial generators
│   │   ├── excel.ts               # XLSX parser & workbook serializer
│   │   └── r2Storage.ts           # R2 S3-uploader controller
│   ├── App.tsx                    # Main portal andsuccess checkout router
│   ├── index.css                  # Tailwind imports and `@media print` stylesheets
│   ├── main.tsx                   # React virtual DOM entry-point
│   └── types.ts                   # Unified TypeScript definitions
├── index.html                     # Raw SPA entry wrapper
├── package.json                   # Dependency definitions and compile scripts
├── tsconfig.json                  # TypeScript compiler settings
├── vite.config.ts                 # Dev build asset configurations
└── wrangler.toml                  # Cloudflare Pages deployment binding specifications
```

---

## 📊 EXCEL DATABASE SCHEMAS

The system uses standard Excel format sheets as databases. When importing, columns are automatically mapped based on headers:

### 1. `customers.xlsx`
| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| **CustomerID** | String | Unique identifier | `CUST-001` or `CUST001` |
| **CustomerName** | String | Bill-to trade name | `ร้านขายยาศาลายา 2` |
| **Address** | String | Multi-line shipment address | `เลขที่ 224/1 ต.ลำตาเสา อ.วังน้อย พระนครศรีอยุธยา` |
| **Phone** | String | Contact number | `063-465-3542` |

### 2. `products.xlsx`
| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| **ProductID** | String | Unique catalog SKU | `PROD-MX4` or `PROD001` |
| **ProductName** | String | Sales label item name | `Draco MX 4 cap.` |
| **Unit** | String | Unit of measure packaging | `กล่อง` or `ซอง` or `ขวด` |
| **UnitPrice** | Decimal | Price per unit item | `290.00` |

### 3. `delivery-notes.xlsx` (Generated on Export)
Contains complete historical data worksheets with flattened records including: `DocumentNumber`, `Date`, `CustomerID`, `CustomerName`, `Address`, `Phone`, `ItemNo`, `ProductID`, `ProductName`, `Quantity`, `UnitPrice`, `Amount`, `TotalAmount`, `Discount`, and `NetAmount`.

---

## ⚡ QUICK START (LOCAL ENVIRONMENT)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Regional Dev Server
This boots up the fast Hot-Module-Replacement Vite server at port `3000`:
```bash
npm run dev
```

### 3. Build & Compile for Production
```bash
npm run build
```

---

## ☁️ CLOUDFLARE PAGES & R2 DEPLOYMENT SETUP

You can deploy the finished application to Cloudflare's serverless edge networks for free in **under 2 minutes** using the following steps:

### 1. Create a Cloudflare R2 Storage Bucket
Log in to your Cloudflare Dashboard, go to **R2 Storage**, and click **Create bucket**:
* **Name of Bucket**: `draco-delivery-notes-pdfs`

### 2. Bind the Bucket in `wrangler.toml`
Verify that `wrangler.toml` contains matching bucket bindings:
```toml
[[r2_buckets]]
binding = "DRACO_PDF_BUCKET"
bucket_name = "draco-delivery-notes-pdfs"
```

### 3. Deploy via Wrangler CLI
Ensure you have logged in to your Cloudflare account (`npx wrangler login`). Run:
```bash
# Compile client assets and boot production transfer
npm run build
npx wrangler pages deploy dist --project-name=draco-delivery-notes
```

### 4. Configure Production Environment Variables
Once deployed, navigate to **Pages Project Settings** -> **Environment Variables** in the Cloudflare Dashboard and add:
* `APP_URL`: The URL generated by Cloudflare Pages (e.g., `https://draco-delivery.pages.dev`).
* `MOCK_R2_STORAGE`: Set to `false` to enable active R2 uploads immediately on Cloudflare Pages workers.

---

## 🐰 COMPLETED BUSINESS MODULES DELIVERED
1. **Auto-Increment Invoice numbers**: Correct format `BC26/001` automatically resetting sequences when changing years.
2. **Thai currency Bahttext spellings**: Replaces formulaic `#VALUE!` spreadsheets bugs with native linguistic rendering.
3. **Instant Interactive UI Tabs**: Quick creators, live summary dashboard, searchable list archives, and Excel uploads.
4. **Stamp and Autograph overlaps**: Beautiful double border company seal and cursive representative signatures superimposed elegantly.
5. **Drag-and-Drop spreadsheets imports**: Flexible file selection conforming to touch screen inputs.
6. **Social shares shortcuts**: Dynamic Web Share triggers with direct backups for LINE, WhatsApp, Telegram, and Gmail.
