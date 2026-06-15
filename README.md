# FEMS — Fire Extinguisher Management System

A full-stack web application for managing fire extinguisher inventory, inspections, maintenance, orders, and compliance across multiple client sites and locations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components) |
| Styling | Tailwind CSS 4 |
| Backend | PHP (no framework — custom MVC) |
| Database | MySQL / MariaDB |
| DB Access | PDO |
| Auth | PHP sessions + localStorage |

---

## Project Structure

```
FEMS/
├── Core/                   # Base Router, Controller, Model classes
├── config/
│   └── database.php        # MySQL connection settings
├── controllers/            # Request handlers (Auth, User, Client, Extinguisher, Order, Inspection, Service, Dashboard, Report, Ai)
├── models/                 # Data models (User, Client, Extinguisher, Order, Inspection, Maintenance, Permission)
├── routes/
│   └── api.php             # All API route definitions
├── middleware/             # Auth middleware
├── database/
│   ├── schema.sql          # Full database schema (run this first)
│   ├── migrate_v2.php      # V2 migration script
│   └── create_reports_table.php
├── helpers/                # Utility functions
├── index.php               # API entry point (handles CORS)
├── .htaccess               # Apache URL rewrite rules
├── migrate.php             # Base migration script
└── front/                  # Angular frontend
    ├── src/
    │   ├── app/
    │   │   ├── pages/      # 40+ page components
    │   │   ├── app.routes.ts
    │   │   └── auth.service.ts
    │   ├── layout/
    │   │   ├── admin/      # Admin shell layout
    │   │   ├── super-admin/
    │   │   ├── sidebar/
    │   │   └── topbar/
    │   └── main.ts
    ├── proxy.conf.json     # Dev proxy: /api → localhost:8000
    ├── package.json
    └── angular.json
```

---

## Prerequisites

- **PHP** 7.4+
- **MySQL** 5.7+ or MariaDB 10+
- **Node.js** 18+ and **npm** 10+
- **Angular CLI** 21 (`npm install -g @angular/cli`)
- Apache (optional for production) — PHP's built-in server works for development

---

## Database Setup

1. Open a MySQL shell and create the database:

```sql
CREATE DATABASE fems_db;
USE fems_db;
```

2. Import the schema:

```bash
mysql -u root -p fems_db < database/schema.sql
```

3. Run migration scripts:

```bash
php migrate.php
php database/migrate_v2.php
php database/create_reports_table.php
```

**Tables created:**
`roles`, `users`, `clients`, `locations`, `fire_extinguishers`, `orders`, `inspections`, `maintenance_records`, `extinguisher_movements`, `notifications`, `audit_logs`, `permissions`, `stock_movements`

---

## Backend Setup

### Configure the database connection

Edit [config/database.php](config/database.php) with your MySQL credentials:

```php
// Default values (development):
host     = 127.0.0.1
database = fems_db
username = root
password = (empty)
```

### Start the PHP development server

From the project root (`FEMS/`):

```bash
php -S 127.0.0.1:8000
```

The API is now available at `http://localhost:8000/api/...`

> **Apache alternative:** Point a virtual host document root at `FEMS/`. The `.htaccess` file handles URL rewriting to `index.php`.

---

## Frontend Setup

```bash
cd front
npm install
npm start          # runs ng serve on http://localhost:4200
```

The dev proxy ([front/proxy.conf.json](front/proxy.conf.json)) automatically forwards `/api/*` requests from port 4200 to the PHP server on port 8000 — no CORS issues in development.

### Build for production

```bash
cd front
ng build           # output goes to front/dist/
```

---

## Running Both Together (Development)

Open two terminals:

**Terminal 1 — PHP backend:**
```bash
cd "c:\New folder\all\projects\FEMS"
php -S 127.0.0.1:8000
```

**Terminal 2 — Angular frontend:**
```bash
cd "c:\New folder\all\projects\FEMS\front"
npm start
```

Then open `http://localhost:4200` in your browser.

---

## User Roles

| Role | Access |
|---|---|
| **Super Admin** | Full system access: manage admins, all clients, audit logs, system-wide reports |
| **Admin** | Manage inventory, inspections, orders, clients, compliance, locations |
| **Company User (Client)** | View own extinguishers, request services, shop, generate compliance reports |

New client registrations start as `pending` and must be approved by an Admin before they can log in.

---

## Core Modules

### Inventory Management
Track individual extinguishers by serial number and QR code. Each unit has a status (`filled`, `unfilled`, `under_maintenance`, `condemned`, `expired`), type, capacity, expiry date, price, and location assignment. Supports bulk import.

### Order Management
Clients browse a product catalog (shop), add to cart, and check out. Orders flow through: `pending` → `granted` (admin approves + allocates stock) → `delivered`. Admins can deny orders with a reason.

### Inspections & Compliance
Admins assign inspections to inspectors. Results record pressure level, weight, physical condition, seal status, and outcome (`passed`, `requires_refill`, `expired`, `condemned`). Generates inspection labels with QR codes. Tracks next due dates for compliance.

### Maintenance & Services
Clients or admins request refills or maintenance for specific units. Workflow: request → confirm → complete. Full service history is kept per extinguisher.

### Multi-Location Support
Each client can have multiple locations with GPS coordinates. Extinguishers are assigned to specific locations.

### Reporting & Audit
Generate and export compliance reports (ZIP). All user actions are written to `audit_logs`. Stock movements are tracked separately.

### AI Assistant
Chat interface at `/assistant` backed by `POST /api/ai/chat`.

---

## API Overview

All endpoints are prefixed with `/api/`. The backend returns JSON with appropriate HTTP status codes.

| Area | Key Endpoints |
|---|---|
| Auth | `POST /api/login`, `POST /api/logout`, `GET /api/me` |
| Dashboard | `GET /api/dashboard/stats` |
| Users | `GET/POST /api/users`, `PUT /api/users/{id}`, `PUT /api/users/{id}/approve` |
| Clients | `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/{id}` |
| Extinguishers | `GET/POST /api/extinguishers`, `POST /api/extinguishers/bulk`, `GET /api/extinguishers/stock` |
| Orders | `GET/POST /api/orders`, `PUT /api/orders/{id}/grant`, `PUT /api/orders/{id}/deliver` |
| Shop | `GET /api/shop/products` |
| Services | `POST /api/extinguishers/{id}/refill-request`, `PUT /api/extinguishers/{id}/complete-service` |
| Reports | `GET/POST /api/reports`, `GET /api/reports/export-zip` |
| AI | `POST /api/ai/chat` |

---

## Frontend Routes

### Public
| Path | Description |
|---|---|
| `/` | Sign up |
| `/signin` | Login |
| `/assistant` | AI chat |

### Client (authenticated)
| Path | Description |
|---|---|
| `/dashboard` | Client dashboard |
| `/extinguishers` | My extinguishers |
| `/service-requests` | Refill / maintenance requests |
| `/shop` | Product catalog |
| `/cart`, `/checkout` | Purchase flow |
| `/my-orders` | Order history |
| `/locations` | My locations |
| `/reports` | Compliance reports |
| `/notifications` | Alerts |

### Admin (`/admin-*`)
| Path | Description |
|---|---|
| `/admin-dashboard` | Analytics overview |
| `/admin-inventory` | Stock management |
| `/admin-orders` | Order management |
| `/admin-inspectors` | Inspector management |
| `/admin-assigned-inspections` | Inspection assignments |
| `/admin-compliance` | Compliance tracking |
| `/admin-refills` | Service requests |
| `/admin-locations` | Location management |
| `/clients` | Client accounts |

### Super Admin (`/super-admin-*`)
| Path | Description |
|---|---|
| `/super-admin-dashboard` | System overview |
| `/super-admin-admins` | Manage admin accounts |
| `/super-admin-clients` | All clients |
| `/super-admin-reports` | System reports |
| `/super-admin-logs` | Audit logs |

---

## Default Credentials

Check the database after running migrations — a default Super Admin account is seeded by the schema. Passwords are bcrypt-hashed.

---

## Known Development Configuration

- CORS is configured in [index.php](index.php) to allow `http://localhost:4200`
- No HTTPS in development; configure SSL at the web server level for production
- `config/database.php` has hardcoded credentials — externalize these before deploying
