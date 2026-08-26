import { loadStripe } from '@stripe/stripe-js';

export const STRIPE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
export const STRIPE_ENABLED = Boolean(STRIPE_KEY);
export const stripePromise = STRIPE_ENABLED ? loadStripe(STRIPE_KEY) : null;
