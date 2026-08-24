/*
  Add a secure order relay URL after deploying one, for example a Cloudflare Worker.
  That relay must keep TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in server-side secrets.
  Never add these secrets to this public repository.
*/
window.REGIA_CONFIG = { orderEndpoint: '' };
