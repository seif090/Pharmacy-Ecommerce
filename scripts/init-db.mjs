import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dbPath = path.resolve('prisma/dev.db')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new DatabaseSync(dbPath)
db.exec(`
  PRAGMA foreign_keys = ON;

  DROP TABLE IF EXISTS "Prescription";
  DROP TABLE IF EXISTS "OrderItem";
  DROP TABLE IF EXISTS "PharmacyOrder";
  DROP TABLE IF EXISTS "CustomerOrder";
  DROP TABLE IF EXISTS "Session";
  DROP TABLE IF EXISTS "PharmacyUser";
  DROP TABLE IF EXISTS "Product";
  DROP TABLE IF EXISTS "Pharmacy";
  DROP TABLE IF EXISTS "Category";

  CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
  );
  CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
  CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

  CREATE TABLE "Pharmacy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "commissionRate" REAL NOT NULL DEFAULT 0.08,
    "rating" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
  );
  CREATE UNIQUE INDEX "Pharmacy_slug_key" ON "Pharmacy"("slug");
  CREATE UNIQUE INDEX "Pharmacy_licenseNumber_key" ON "Pharmacy"("licenseNumber");

  CREATE TABLE "PharmacyUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pharmacyId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PHARMACY',
    "active" INTEGER NOT NULL DEFAULT 1,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    CONSTRAINT "PharmacyUser_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE
  );
  CREATE UNIQUE INDEX "PharmacyUser_email_key" ON "PharmacyUser"("email");

  CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" BIGINT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PharmacyUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );
  CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

  CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pharmacyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "scientificName" TEXT,
    "manufacturer" TEXT,
    "description" TEXT NOT NULL,
    "dosage" TEXT,
    "form" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" TEXT NOT NULL,
    "discountPrice" TEXT,
    "imageUrl" TEXT,
    "requiresPrescription" INTEGER NOT NULL DEFAULT 0,
    "featured" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "active" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT,
    "categoryId" TEXT,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    CONSTRAINT "Product_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE
  );
  CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

  CREATE TABLE "CustomerOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "deliveryLatitude" REAL,
    "deliveryLongitude" REAL,
    "postalCode" TEXT NOT NULL,
    "subtotal" TEXT NOT NULL,
    "shipping" TEXT NOT NULL,
    "total" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
  );
  CREATE UNIQUE INDEX "CustomerOrder_orderNumber_key" ON "CustomerOrder"("orderNumber");

  CREATE TABLE "PharmacyOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerOrderId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subtotal" TEXT NOT NULL,
    "shipping" TEXT NOT NULL,
    "total" TEXT NOT NULL,
    "commissionAmount" TEXT NOT NULL,
    "estimatedSlaMins" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    CONSTRAINT "PharmacyOrder_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "CustomerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PharmacyOrder_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pharmacyOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" TEXT NOT NULL,
    "lineTotal" TEXT NOT NULL,
    CONSTRAINT "OrderItem_pharmacyOrderId_fkey" FOREIGN KEY ("pharmacyOrderId") REFERENCES "PharmacyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );

  CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerOrderId" TEXT NOT NULL,
    "pharmacyOrderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "notes" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" BIGINT,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    CONSTRAINT "Prescription_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "CustomerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prescription_pharmacyOrderId_fkey" FOREIGN KEY ("pharmacyOrderId") REFERENCES "PharmacyOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Prescription_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "PharmacyUser"("id") ON DELETE SET NULL ON UPDATE CASCADE
  );
  CREATE UNIQUE INDEX "Prescription_pharmacyOrderId_key" ON "Prescription"("pharmacyOrderId");
`)

db.close()
