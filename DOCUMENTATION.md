# Spray Foam Command Center - Complete Documentation

> **Version:** 5.0 (v4)
> **Last Updated:** January 2026

---

# PART 1: USER INSTRUCTION MANUAL

## 1. Introduction
Welcome to the Spray Foam Command Center, your all-in-one platform for managing the entire lifecycle of a spray foam insulation business. This system is designed to streamline operations from the very first quote to the final invoice, ensuring accuracy, efficiency, and profitability.

## 2. Getting Started & Access Control

### 2.1 Login Concept
The application simplifies access into two main operational views.
*   **Administrator Mode:** Designed for owners and office managers. Grants full control over pricing, financial reports, customer databases, and inventory adjustments.
*   **Field Crew Mode:** Designed for foremen and installers. A streamlined, simplified interface that focuses strictly on job execution features (address, site photos, material logging) while hiding sensitive profit/margin data.

### 2.2 Navigation
The interface is divided into key modules accessible via the top/side navigation bar:
*   **Calculator:** The starting point for all new work. Create detailed estimates.
*   **Jobs (Dashboard):** A Kanban-style or list view of every active job and its stage.
*   **Customers:** Your digital address book and CRM.
*   **Inventory:** Warehouse and Equipment management.
*   **Settings:** Configuration for company info, pricing formulas, and yield rates.

---

## 3. The Calculator: Creating an Estimate
This is the heart of the system. Follow these steps to generate an accurate quote:

### Step 1: Mode Selection
Choose the calculation method that matches your project:
*   **Building:** Best for whole-home projects. Calculates shell (walls) and roof deck together.
*   **Walls Only:** For retrofit jobs or specific wall-insulation projects.
*   **Flat Area:** For crawl spaces, concrete lifting, or generic square footage coverage.
*   **Custom:** Direct entry mode if you already know the exact Board Footage (BdFt) required.

### Step 2: Dimensions & Geometry
Enter the physical measurements of the structure.
*   **Length & Width:** Footprint dimensions.
*   **Wall Height:** Average stud height.
*   **Roof Pitch:** Select the slope (e.g., 6/12). *Tip: This critically affects roof area calculations.*
*   **Gables:** Toggle "Include Gables" to automatically account for the triangular wall areas at the roof ends.

### Step 3: Foam Configuration
Define what you are installing. Use the toggles to switch between products.
*   **Type:** Select "Open Cell" or "Closed Cell".
*   **Thickness:** Enter target insulation depth (e.g., 3.5 inches for walls, 5.5 for roof).
*   **Waste %:** We recommend leaving this at 10-15% to account for trimming and overspray.

### Step 4: Pricing Strategy
Review the *Financial Snapshot* at the bottom of the screen.
*   **Level Pricing:** Applies a standard markup to your raw costs.
*   **SqFt Pricing:** Allows you to bid a specific dollar amount per square foot (e.g., $1.25/sqft).
*   **Adjustments:** Add specific line items for "Trip Charge", "Scaffolding" or other extra expenses.

### Step 5: Save & Assign
Click **"Save Estimate"**. You will be prompted to link this estimate to an existing Customer or create a new Customer Profile.

---

## 4. Job Workflow Management
Moving a deal from a "Quote" to a "Done Job".

### Phase 1: Scheduling (Work Order)
1.  Go to the **Jobs** tab.
2.  Find your `Draft` estimate.
3.  Change status to **Work Order**.
4.  **Assign Date:** Pick the installation date. This now appears on the crew schedule.
5.  **Generate PDF:** Click "Print Work Order" to create a simplified PDF for the crew (no prices shown).

### Phase 2: Execution (The Crew View)
When a crew member opens the specific job on their tablet:
1.  **Check In:** Change status to `In Progress`.
2.  **Review Site:** View address, gate codes, and "Site Condition" photos uploaded during the estimate.
3.  **Log Materials:** During the job, the foreman enters the *actual* number of sets used in the "Actuals" section.
4.  **Completion:**
    *   Upload photos of the finished work.
    *   Enter final notes (e.g., "Left over 1/2 drum returned to shop").
    *   Change status to `Completed`.

### Phase 3: Billing & Closeout
Back in the office:
1.  Review the Crew's notes and actual material usage.
2.  Change status to `Invoiced`.
3.  **Generate Invoice:** The system creates a final PDF with the total due.
4.  Once payment is received, mark as `Paid` to close the financial loop.

---

## 5. Inventory & Equipment Hub
Stop losing tools and running out of chemicals.

### Warehouse (Consumables)
*   **Stock Tracking:** Monitor "Sets on Hand" for Open/Closed cell.
*   **Sundries:** Track suit kits, tape, plastic, and gun parts.
*   **Reorder Points:** Set minimum levels (e.g., "Alert me when we have < 4 sets").

### Equipment Tracker
*   **Asset Management:** Every expensive tool (Guns, Compressors, Ladders) has a unique ID.
*   **Assignment:** "Check Out" a tool to a specific Job or Crew Member.
*   **Status:** Mark items as `Maintenance` or `Lost` to remove them from active availability.

---

## 6. Settings & Calibration
*Critical for accuracy.*
*   **Yields:** Tell the system how many Board Feet you *actually* get out of a set (e.g., 16,000 BdFt for Open Cell). If your crews are efficient, increase this number to lower your estimated costs.
*   **Material Cost:** Update the price you pay per set of foam. This ensures your margin calculations are real.
*   **Company Profile:** Update your logo and address for the PDF headers.

---

# PART 2: TECHNICAL BRIEFING (DEVELOPER)

## 1. Architecture Overview
**Stack:** React 19 (Vite) + TypeScript + Google Apps Script (Backend).
**Concept:** A serverless Single Page Application (SPA) where the "Database" is a Google Sheet and the "Server" is Google Apps Script's `doGet()` and `google.script.run`.

### Core Components
*   **Frontend:** `src/` (React Context, Hooks, UI Components).
*   **Backend:** `backend/Code.js` (GAS V8 Runtime).
*   **Storage:** Google Drive (Images/PDFs) + Google Sheets (Data Records).

## 2. Key Data Models (`types.ts`)
The application is strictly typed. Understanding these interfaces is key to extending the app.

### A. `EstimateRecord`
The master object representing a job unit.
*   `id`: UUID (v4).
*   `status`: State machine (`Draft` | `Work Order` | `Invoiced` | `Paid`).
*   `inputs`: Stores the raw geometric parameters (LxWxH) allowing the calculator to "rehydrate" the state when loading a saved job.
*   `results`: Locked values calculated at the time of save (prevents historical price drift if global rates change later).
*   `actuals`: The post-mortem data. Separation of "What we thought would happen" (`results`) vs "What happened" (`actuals`).

### B. `CalculatorState`
Global state object managed via React Context (`CalculatorContext.tsx`).
*   Holds the *current* working session of the calculator.
*   `yields` & `costs`: Pulled from `Settings` context on load.

### C. `UserSession`
Controls RBAC (Role Based Access Control).
*   `role`: 'admin' | 'crew'.
*   `spreadsheetId`: The distinct DataSource ID for the active tenant.

## 3. Backend Integration Pattern
Communication occurs via the global `google.script.run` object injected by the GAS runtime iframe.

**Pattern:**
1.  **Frontend:** `api.ts` wraps `google.script.run` in Promises.
2.  **Serialization:** JS Objects are passed as JSON strings to GAS.
3.  **Backend:** `backend/Code.js` parses JSON, executes sheet operations (CRUD), and returns JSON response.

**Key Backend Functions:**
*   `saveEstimate(data)`: Upserts a row in the "Estimates" sheet.
*   `uploadImage(data)`: Base64 -> Blob -> DriveFile -> Returns URL.
*   `getInventory()`: Reads "Inventory" sheet range -> Returns `InventoryItem[]`.

## 4. PDF Generation Strategy
*   **Library:** `jspdf` & `jspdf-autotable`.
*   **Execution:** 100% Client-side. The PDF is generated in the browser memory using the `EstimateRecord` data and opened in a new tab/blob URL.
*   **Assets:** Company Logo is stored as Base64 string in `CompanyProfile` to allow embedding in PDF without CORS issues.

## 5. Future Extensibility
*   **Offline Support:** The `vite-plugin-pwa` configuration allows for future service-worker caching, enabling crews to view work orders in low-signal areas (future sync required).
*   **Multi-tenancy:** The architecture supports swapping the `spreadsheetId`, allowing the same frontend codebase to serve multiple different companies by just pointing to a different backend Sheet.
