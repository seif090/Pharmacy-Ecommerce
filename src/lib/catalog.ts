import 'server-only'

import { getPrisma } from '@/lib/db'

export async function getCategories() {
  const prisma = getPrisma()
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
}

export async function getPharmacies() {
  const prisma = getPrisma()
  return prisma.pharmacy.findMany({
    orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { products: true, pharmacyOrders: true } },
    },
  })
}

export async function getProducts(options?: {
  search?: string
  category?: string
  pharmacy?: string
  featured?: boolean
}) {
  const prisma = getPrisma()
  const search = options?.search?.trim()

  return prisma.product.findMany({
    where: {
      active: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
              { tags: { contains: search } },
              { manufacturer: { contains: search } },
              { scientificName: { contains: search } },
            ],
          }
        : {}),
      ...(options?.category ? { category: { slug: options.category } } : {}),
      ...(options?.pharmacy ? { pharmacy: { slug: options.pharmacy } } : {}),
      ...(typeof options?.featured === 'boolean' ? { featured: options.featured } : {}),
    },
    include: { category: true, pharmacy: true },
    orderBy: [{ featured: 'desc' }, { stock: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function getFeaturedProducts() {
  return getProducts({ featured: true })
}

export async function getProductBySlug(slug: string) {
  const prisma = getPrisma()
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true, pharmacy: true },
  })
}

export async function getDashboardStats() {
  const prisma = getPrisma()
  const [products, pharmacies, orders, prescriptions, revenueAgg, lowStock] = await Promise.all([
    prisma.product.count(),
    prisma.pharmacy.count(),
    prisma.customerOrder.count(),
    prisma.prescription.count(),
    prisma.customerOrder.aggregate({ _sum: { total: true } }),
    prisma.product.count({ where: { stock: { lte: 10 } } }),
  ])

  return {
    products,
    pharmacies,
    orders,
    prescriptions,
    revenue: Number(revenueAgg._sum.total ?? 0),
    lowStock,
  }
}

export async function getRecentOrders() {
  const prisma = getPrisma()
  return prisma.customerOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      pharmacyOrders: {
        include: {
          pharmacy: true,
          items: true,
          prescription: true,
        },
      },
    },
  })
}

export async function getRecentPrescriptions() {
  const prisma = getPrisma()
  return prisma.prescription.findMany({
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      customerOrder: true,
      pharmacyOrder: {
        include: { pharmacy: true },
      },
      reviewer: true,
    },
  })
}

export async function getPharmacyDashboard(pharmacyId: string) {
  const prisma = getPrisma()
  const [orders, products, prescriptions, stats] = await Promise.all([
    prisma.pharmacyOrder.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        customerOrder: true,
        items: { include: { product: true } },
        prescription: true,
      },
    }),
    prisma.product.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { category: true },
    }),
    prisma.prescription.findMany({
      where: {
        OR: [{ pharmacyOrder: { pharmacyId } }, { pharmacyOrderId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        customerOrder: true,
        pharmacyOrder: { include: { pharmacy: true } },
        reviewer: true,
      },
    }),
    prisma.pharmacyOrder.aggregate({
      where: { pharmacyId },
      _sum: { total: true, commissionAmount: true },
      _count: { id: true },
    }),
  ])

  return {
    orders,
    products,
    prescriptions,
    stats: {
      orders: stats._count.id,
      revenue: Number(stats._sum.total ?? 0),
      commission: Number(stats._sum.commissionAmount ?? 0),
    },
  }
}
