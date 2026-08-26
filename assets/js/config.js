/* Set this to your paid hosting URL after uploading server/order.php there. */
window.REGIA_CONFIG = { orderEndpoint: '' };

/* Avoid any WhatsApp fallback when the secure order endpoint has not been configured. */
document.addEventListener('submit', event => {
  if (event.target?.id === 'orderForm' && !window.REGIA_CONFIG.orderEndpoint) {
    event.preventDefault();
    event.stopImmediatePropagation();
    alert('نظام الطلب الإلكتروني قيد الإعداد. يرجى المحاولة لاحقاً.');
  }
}, true);
