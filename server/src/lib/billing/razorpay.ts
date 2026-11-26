import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from '../../utils/HttpError.js';

const API_BASE = 'https://api.razorpay.com/v1';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}


export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');

  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createRazorpayOrder(
  credentials: { keyId: string; keySecret: string },
  order: { amount: number; currency: string; receipt: string; notes: Record<string, string> },
): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString('base64');
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new HttpError(502, 'Could not reach Razorpay. Check your internet connection and try again.');
  }
  const body = (await response.json().catch(() => null)) as (RazorpayOrder & { error?: { description?: string } }) | null;
  if (!response.ok || !body?.id) {
    throw new HttpError(502, `Razorpay rejected the order: ${body?.error?.description ?? response.statusText}`);
  }
  return body;
}
