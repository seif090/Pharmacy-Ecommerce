import { z } from 'zod'

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
})

export const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  phone: z.string().min(5),
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(2),
  paymentMethod: z.enum(['cash-on-delivery', 'card']),
  items: z.array(cartItemSchema).min(1),
})

export const productSchema = z.object({
  name: z.string().min(2),
  scientificName: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().min(10),
  dosage: z.string().optional(),
  form: z.string().optional(),
  stock: z.number().int().nonnegative(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  categorySlug: z.string().min(2),
  pharmacyId: z.string().optional(),
  imageUrl: z.string().optional(),
  requiresPrescription: z.boolean().default(false),
  featured: z.boolean().default(false),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  active: z.boolean().default(true),
  tags: z.string().optional(),
})
