import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function makeRouteKey({ scientificName, name }) {
  return String(scientificName ?? name).trim().toLowerCase()
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

async function main() {
  const categories = [
    { name: 'Pain Relief', slug: 'pain-relief' },
    { name: 'Vitamins', slug: 'vitamins' },
    { name: 'Cold & Flu', slug: 'cold-flu' },
    { name: 'Personal Care', slug: 'personal-care' },
    { name: 'First Aid', slug: 'first-aid' },
    { name: 'Devices', slug: 'devices' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    })
  }

  const pharmacies = [
    {
      name: 'Alex Central Pharmacy',
      slug: 'alex-central-pharmacy',
      licenseNumber: 'LIC-ALEX-001',
      address: '12 Saad Zaghloul St',
      city: 'Alexandria',
      latitude: 31.2001,
      longitude: 29.9187,
      commissionRate: 0.08,
      rating: 4.7,
      status: 'ACTIVE',
    },
    {
      name: 'Nile Care Pharmacy',
      slug: 'nile-care-pharmacy',
      licenseNumber: 'LIC-CAI-002',
      address: '8 Tahrir Sq',
      city: 'Cairo',
      latitude: 30.0444,
      longitude: 31.2357,
      commissionRate: 0.09,
      rating: 4.5,
      status: 'ACTIVE',
    },
    {
      name: 'Delta Health Pharmacy',
      slug: 'delta-health-pharmacy',
      licenseNumber: 'LIC-MAN-003',
      address: '44 Corniche',
      city: 'Mansoura',
      latitude: 31.0409,
      longitude: 31.3785,
      commissionRate: 0.085,
      rating: 4.4,
      status: 'ACTIVE',
    },
  ]

  for (const pharmacy of pharmacies) {
    await prisma.pharmacy.upsert({
      where: { slug: pharmacy.slug },
      update: pharmacy,
      create: pharmacy,
    })
  }

  const pharmacyLookup = Object.fromEntries(
    (await prisma.pharmacy.findMany()).map((item) => [item.slug, item.id]),
  )

  const categoryLookup = Object.fromEntries(
    (await prisma.category.findMany()).map((item) => [item.slug, item.id]),
  )

  const users = [
    {
      name: 'Platform Admin',
      email: 'admin@medora.local',
      passwordHash: hashPassword('Admin@12345'),
      role: 'ADMIN',
      pharmacyId: null,
    },
    {
      name: 'Alex Manager',
      email: 'alex@medora.local',
      passwordHash: hashPassword('Pharmacy@123'),
      role: 'PHARMACY',
      pharmacyId: pharmacyLookup['alex-central-pharmacy'],
    },
    {
      name: 'Nile Manager',
      email: 'nile@medora.local',
      passwordHash: hashPassword('Pharmacy@123'),
      role: 'PHARMACY',
      pharmacyId: pharmacyLookup['nile-care-pharmacy'],
    },
  ]

  for (const user of users) {
    await prisma.pharmacyUser.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    })
  }

  const products = [
    {
      pharmacySlug: 'alex-central-pharmacy',
      name: 'Paracetamol 500mg',
      slug: 'paracetamol-500mg-alex',
      scientificName: 'Acetaminophen',
      manufacturer: 'Medico Labs',
      description: 'Fast relief for fever and mild pain.',
      dosage: '500mg',
      form: 'Tablets',
      stock: 120,
      price: 42,
      discountPrice: 36,
      featured: true,
      tags: 'pain,fever,headache',
      categorySlug: 'pain-relief',
      requiresPrescription: false,
    },
    {
      pharmacySlug: 'nile-care-pharmacy',
      name: 'Paracetamol 500mg',
      slug: 'paracetamol-500mg-nile',
      scientificName: 'Acetaminophen',
      manufacturer: 'Medico Labs',
      description: 'Fast relief for fever and mild pain.',
      dosage: '500mg',
      form: 'Tablets',
      stock: 90,
      price: 41,
      discountPrice: 35,
      featured: true,
      tags: 'pain,fever,headache',
      categorySlug: 'pain-relief',
      requiresPrescription: false,
    },
    {
      pharmacySlug: 'alex-central-pharmacy',
      name: 'Vitamin C 1000mg',
      slug: 'vitamin-c-1000mg-alex',
      scientificName: 'Ascorbic Acid',
      manufacturer: 'HealthCore',
      description: 'Daily immune support with a high-potency formula.',
      dosage: '1000mg',
      form: 'Effervescent tablets',
      stock: 78,
      price: 95,
      featured: true,
      tags: 'vitamins,immunity',
      categorySlug: 'vitamins',
      requiresPrescription: false,
    },
    {
      pharmacySlug: 'delta-health-pharmacy',
      name: 'Nasal Decongestant Spray',
      slug: 'nasal-decongestant-spray-delta',
      scientificName: 'Oxymetazoline',
      manufacturer: 'Delta Pharma',
      description: 'Relieves blocked nose and sinus pressure.',
      form: 'Spray',
      stock: 54,
      price: 68,
      tags: 'cold,flu,nasal',
      categorySlug: 'cold-flu',
      requiresPrescription: false,
    },
    {
      pharmacySlug: 'alex-central-pharmacy',
      name: 'Hydrocortisone Cream',
      slug: 'hydrocortisone-cream-alex',
      scientificName: 'Hydrocortisone',
      manufacturer: 'Dermacare',
      description: 'Soothes irritation, itching, and minor rashes.',
      form: 'Cream',
      stock: 40,
      price: 79,
      requiresPrescription: true,
      tags: 'skin,rash,itching',
      categorySlug: 'personal-care',
    },
    {
      pharmacySlug: 'nile-care-pharmacy',
      name: 'Antiseptic Wipes',
      slug: 'antiseptic-wipes-nile',
      scientificName: 'Benzalkonium Chloride',
      manufacturer: 'SafeMed',
      description: 'Portable sterile wipes for first response cleaning.',
      form: 'Wipes',
      stock: 160,
      price: 28,
      featured: true,
      tags: 'first-aid,cleaning',
      categorySlug: 'first-aid',
    },
    {
      pharmacySlug: 'delta-health-pharmacy',
      name: 'Digital Thermometer',
      slug: 'digital-thermometer-delta',
      scientificName: 'Electronic Sensor',
      manufacturer: 'HealthCore',
      description: 'Quick temperature checks with a clear display.',
      form: 'Device',
      stock: 33,
      price: 145,
      featured: true,
      tags: 'devices,temperature',
      categorySlug: 'devices',
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        pharmacyId: pharmacyLookup[product.pharmacySlug],
        name: product.name,
        routeKey: makeRouteKey(product),
        scientificName: product.scientificName,
        manufacturer: product.manufacturer,
        description: product.description,
        dosage: product.dosage,
        form: product.form,
        stock: product.stock,
        price: product.price,
        discountPrice: product.discountPrice ?? null,
        featured: product.featured ?? false,
        requiresPrescription: product.requiresPrescription ?? false,
        tags: product.tags,
        categoryId: categoryLookup[product.categorySlug],
      },
      create: {
        pharmacyId: pharmacyLookup[product.pharmacySlug],
        name: product.name,
        slug: product.slug,
        routeKey: makeRouteKey(product),
        scientificName: product.scientificName,
        manufacturer: product.manufacturer,
        description: product.description,
        dosage: product.dosage,
        form: product.form,
        stock: product.stock,
        price: product.price,
        discountPrice: product.discountPrice ?? null,
        featured: product.featured ?? false,
        requiresPrescription: product.requiresPrescription ?? false,
        tags: product.tags,
        categoryId: categoryLookup[product.categorySlug],
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
