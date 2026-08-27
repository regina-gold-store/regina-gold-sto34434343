window.REGIA_CONFIG = Object.assign({}, window.REGIA_CONFIG, {
  storeName: 'Regina Gold',
  phone: '01070530886',
  address: 'مصر الجديدة - شارع التسعين - القاهرة',
  mapLink: 'https://maps.google.com/?q=%D9%85%D8%B5%D8%B1+%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9+%D8%B4%D8%A7%D8%B1%D8%B9+%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86+%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86',
  mapEmbed: 'https://www.google.com/maps?q=%D9%85%D8%B5%D8%B1%20%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9%20%D8%B4%D8%A7%D8%B1%D8%B9%20%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86%20%D8%A7%D9%84%D8%AA%D8%B3%D8%B9%D9%8A%D9%86&output=embed',
  botName: 'Regina Gold Bot',
  telegramBotToken: '8950862577:AAGZMBt0ZTQW_Y6sVIqdhls7_kUpl4ylcs8',
  telegramChatIds: ['5688540108', '8381279697'],
  orderEndpoint: ''
});

document.addEventListener('submit', event => {
  if (event.target?.id === 'orderForm' && !(window.REGIA_CONFIG?.telegramBotToken || '').trim()) {
    event.preventDefault();
    event.stopImmediatePropagation();
    alert('نظام الطلب الإلكتروني قيد الإعداد. يرجى المحاولة لاحقا.');
  }
}, true);
