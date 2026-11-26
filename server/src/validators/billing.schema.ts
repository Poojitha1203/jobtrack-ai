import { z } from 'zod';

const orderId = z.string().regex(/^order_[A-Za-z0-9]+$/, 'Invalid order id');

export const verifyPaymentSchema = z
  .object({
    razorpayOrderId: orderId,
    razorpayPaymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/, 'Invalid payment id'),
    razorpaySignature: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid signature'),
  })
  .strict();

export const paymentFailedSchema = z.object({ razorpayOrderId: orderId }).strict();

export const cancelSchema = z.object({ cancel: z.boolean() }).strict();

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
