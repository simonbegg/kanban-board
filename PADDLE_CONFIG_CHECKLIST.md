# Paddle Configuration Checklist

The code integration for Paddle (checkout, webhooks, providers) is **COMPLETE**.
The current "Paddle not loaded" error is due to missing environment variables.

## 1. Get Your Keys from Paddle Dashboard

1. Log in to [Paddle Sandbox](https://sandbox-vendors.paddle.com/).
2. Go to **Developer Tools > Authentication**.
3. Generate/Copy your **Client-side Token** (starts with `test_` in sandbox).
4. Go to **Catalog > Products**.
5. Create or find the "ThreeLanes Pro" product.
6. Copy the **Price ID** (starts with `pri_`).

## 2. Update `.env.local`

Open your `.env.local` file and ensure these lines are present and populated:

```bash
# Paddle Configuration
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PRICE_ID="pri_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Webhook Secret (From Developer Tools > Notifications)
PADDLE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 3. Restart Dev Server

After updating `.env.local`, you **MUST** restart the server for changes to take effect:

1. Stop the server (`Ctrl+C`)
2. Run `pnpm dev`
3. Visit [http://localhost:3000/pricing](http://localhost:3000/pricing)
4. Open Browser Console (F12)
5. Look for: `Paddle initialized in sandbox mode`

## 4. Troubleshooting

- **"Paddle not loaded"**: Means the script failed or initialization was skipped. Check console for "Paddle Client Token is missing" warning.
- **"Paddle price ID not configured"**: Means `NEXT_PUBLIC_PADDLE_PRICE_ID` is missing.
- **CORS/Network Errors**: Ensure your ad blocker isn't blocking `cdn.paddle.com`.
