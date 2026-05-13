import { z } from "zod";

export const SHIPMENT_TYPES = [
  "Domestic",
  "International",
  "Returns",
  "Controlled",
] as const;

export type ShipmentType = (typeof SHIPMENT_TYPES)[number];

export const docSchema = z.object({
  name: z.string(),
  size: z.number(),
  mimeType: z.string(),
  extension: z.string(),
  docType: z.string(),
  fileUrl: z.string().url(),
});

export const createOrderSchema = z.object({
  orderRef: z
    .string()
    .min(1, "Order reference is required")
    .max(50, "Max 50 characters"),
  recipient: z
    .string()
    .min(1, "Recipient is required")
    .max(100, "Max 100 characters"),
  shipmentType: z.enum(SHIPMENT_TYPES, {
    required_error: "Shipment type is required",
  }),
  notes: z.string().max(500, "Max 500 characters").optional(),
  expiresAt: z
    .string()
    .optional()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      "Expiry date must be in the future"
    ),
  docs: z.array(docSchema).default([]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type DocInput = z.infer<typeof docSchema>;
