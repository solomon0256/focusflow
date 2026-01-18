import { Product } from './types';

// ==========================================
// 🛍️ SAAS PRODUCT CONFIGURATION
// Configure your pricing and plans here.
// These IDs should eventually match App Store Connect.
// ==========================================

export const SAAS_CONFIG = {
    // Feature list shown on the Paywall
    features: [
        "Sync across iPhone, iPad & Android",
        "Unlimited Focus History & Statistics",
        "Exclusive 'Focus Fox' Pet Skins",
        "Advanced White Noise Library",
        "Support Indie Development ❤️"
    ],

    // Define your pricing tiers here
    plans: [
        {
            id: 'focusflow_monthly',
            name: 'Monthly',
            price: '$2.99',
            interval: 'month',
            description: 'Billed monthly. Cancel anytime.',
        },
        {
            id: 'focusflow_yearly',
            name: 'Yearly',
            price: '$19.99',
            interval: 'year',
            description: '12 months at $1.66/mo.',
            tag: 'SAVE 45%'
        },
        {
            id: 'focusflow_lifetime',
            name: 'Lifetime',
            price: '$49.99',
            interval: 'lifetime',
            description: 'One-time payment. Own it forever.',
            tag: 'BEST VALUE'
        }
    ] as Product[]
};
