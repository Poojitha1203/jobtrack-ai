
interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: { error: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('Could not load Razorpay Checkout. Check your internet connection or ad blocker.'));
    };
    document.body.appendChild(script);
  });
  return loading;
}

export class CheckoutClosedError extends Error {
  constructor() {
    super('Checkout was closed before the payment finished.');
    this.name = 'CheckoutClosedError';
  }
}

interface CheckoutOptions {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  prefill: { name?: string; email?: string };
  /** A failed attempt; the checkout stays open so the user can retry or close it. */
  onAttemptFailed: (reason: string) => void;
}

export async function openRazorpayCheckout(options: CheckoutOptions): Promise<RazorpaySuccess> {
  await loadScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Razorpay Checkout is unavailable.');

  return new Promise<RazorpaySuccess>((resolve, reject) => {
    const checkout = new Razorpay({
      key: options.keyId,
      order_id: options.orderId,
      amount: options.amount,
      currency: options.currency,
      name: 'JobTrack AI',
      description: options.description,
      prefill: options.prefill,
      theme: { color: '#4f46e5' },
      handler: (response: RazorpaySuccess) => resolve(response),
      modal: { ondismiss: () => reject(new CheckoutClosedError()) },
    });
    checkout.on('payment.failed', (response) => options.onAttemptFailed(response.error.description ?? 'Payment failed'));
    checkout.open();
  });
}
