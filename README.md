# Regina Gold

Static GitHub Pages storefront for Regina Gold. Products are deliberately empty on first publish.

## Publish

Push this folder to a GitHub repository, then enable **Settings → Pages → GitHub Actions**. The included workflow publishes every push to `main`.

## Add a product

Open `kokoadmin.html`, sign in, fill the item form, select its image, and enter a **fine-grained GitHub token** when requested. The token is used only in your browser and is never saved. It requires repository access and **Contents: Read and write** permission. The panel creates `products/<category>/<number>/product.json` and uploads the image beside it; the Pages workflow then republishes the store.

## Telegram orders (secure setup)

GitHub Pages is static, so a Telegram bot token must never be added to browser JavaScript. Configure a small secure endpoint (Cloudflare Worker, Netlify Function, or similar) that receives the order and calls Telegram, then put only its public endpoint URL in `assets/js/config.js`. See the commented configuration there. Store the bot token and chat ID as that service's secrets.

## Admin password

The dashboard ships with the requested local password. It only deters casual access because client-side passwords are visible to a determined visitor. GitHub token entry is still required for publishing.
