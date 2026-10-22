# SignalPro — Cloudflare Pages starter

Responsive React/Vite trading-analysis dashboard with Cloudflare Pages Functions for real OHLC data and AI analysis.

## APIs
- `GET /api/health` — confirms the Pages Function is running.
- `GET /api/market?symbol=BTCUSD&interval=1h` — Binance Spot OHLC candles for BTCUSD/ETHUSD/SOLUSD; Twelve Data for XAUUSD, EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, NZDUSD.
- `POST /api/analyze` — Google Gemini 2.5 Flash analysis of at least 20 OHLC candles.

## Cloudflare Pages secrets
In Cloudflare Dashboard → Workers & Pages → your Pages project → Settings → Variables and Secrets, add secrets (not plain frontend variables):
- `TWELVEDATA_API_KEY` — create a key at https://twelvedata.com/ (check plan coverage/quotas for forex and gold).
- `GEMINI_API_KEY` — create a key at https://aistudio.google.com/app/apikey (availability, quotas and billing may vary).

Redeploy after adding/changing secrets. Never paste API keys into source code, GitHub commits, or public chat.

## Deploy
- Build command: `npm run build`
- Build output directory: `dist`
- Framework preset: Vite
- Root directory: `/`

Push the repository to GitHub and connect it to Cloudflare Pages. `functions/` must remain at the project root so Cloudflare Pages deploys the server-side endpoints.

## Important limitations
This is an integration-ready starter, not a verified trading system. The market endpoint has not been live-tested without the user's provider keys and deployed environment. Free provider tiers may limit requests, symbols, history, or real-time delivery. Binance crypto spot candles are not necessarily the same price feed as a broker's BTCUSD CFD. Gold/forex candles depend on Twelve Data coverage for the chosen plan. AI analysis is not a guaranteed signal; test in demo and independently verify all prices before trading. No order execution is implemented.
