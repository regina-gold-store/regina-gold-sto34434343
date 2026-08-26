<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://regina-gold-store.github.io');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$token = getenv('8950862577:AAGZMBt0ZTQW_Y6sVIqdhls7_kUpl4ylcs8');
$chatIds = array_filter(array_map('trim', explode(',', getenv('8381279697') ?: '')));
if (!$token || !$chatIds) { http_response_code(500); echo json_encode(['error' => 'Server Telegram secrets are not configured.']); exit; }
$order = json_decode(file_get_contents('php://input'), true);
if (!is_array($order) || empty($order['name']) || empty($order['phone']) || empty($order['items'])) { http_response_code(422); echo json_encode(['error' => 'Invalid order.']); exit; }

function esc($text): string { return htmlspecialchars((string)$text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function egp($amount): string { return number_format((float)$amount, 0, '.', ',') . ' ج.م'; }
$lines = [
  '<b>طلب شراء جديد - دار ريجينا جولد</b>', '━━━━━━━━━━━━━━━━━━',
  '<b>رقم الطلب:</b> <code>'.esc($order['orderNumber'] ?? 'REG-NEW').'</code>',
  '<b>التاريخ والوقت:</b> '.esc($order['orderedAt'] ?? ''), '',
  '<b>بيانات العميل:</b>', '• <b>الاسم:</b> '.esc($order['name']),
  '• <b>الهاتف الأساسي:</b> <code>'.esc($order['phone']).'</code>',
  '• <b>هاتف إضافي:</b> '.esc($order['secondaryPhone'] ?? '-'),
  '• <b>المحافظة:</b> '.esc($order['governorate'] ?? '-'),
  '• <b>المدينة / المنطقة:</b> '.esc($order['area'] ?? '-'),
  '• <b>العنوان:</b> '.esc($order['address'] ?? '-'),
  '• <b>الملاحظات:</b> '.esc($order['notes'] ?? '-'), '', '<b>المقتنيات المطلوبة:</b>'
];
$total = 0;
foreach ($order['items'] as $index => $item) {
  $qty = max(1, (int)($item['qty'] ?? 1)); $price = (float)($item['salePrice'] ?: $item['price'] ?: 0); $total += $price * $qty;
  $lines[] = '<b>'.($index + 1).'. '.esc($item['name'] ?? 'قطعة ذهب').'</b>';
  $lines[] = '• العيار: '.esc($item['carat'] ?? '-') . ' | الوزن: '.esc($item['weight'] ?? '-') . ' جم';
  $lines[] = '• الكمية: '.$qty.' × '.egp($price).' | كود الصنف: <code>'.esc($item['id'] ?? '-').'</code>';
}
$lines[] = ''; $lines[] = '━━━━━━━━━━━━━━━━━━'; $lines[] = '<b>الإجمالي:</b> <b>'.egp($total).'</b>'; $lines[] = '• <b>الدفع:</b> '.esc($order['payment'] ?? '-');
$text = implode("\n", $lines);
foreach ($chatIds as $chatId) {
  $ch = curl_init("https://api.telegram.org/bot{$token}/sendMessage");
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => ['chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12]);
  $result = curl_exec($ch); curl_close($ch);
  if (!$result) { http_response_code(502); echo json_encode(['error' => 'Telegram delivery failed.']); exit; }
}
echo json_encode(['ok' => true]);
