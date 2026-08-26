# Secure Telegram order endpoint

Upload `order.php` to your paid PHP hosting at `api/order.php`. Configure these environment variables in the hosting dashboard, never in GitHub Pages files:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_IDS` — comma-separated chat IDs

Then set `orderEndpoint` in `assets/js/config.js` to the public HTTPS URL of that `order.php` file, e.g. `https://your-domain.com/api/order.php`.
