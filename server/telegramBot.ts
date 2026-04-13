import type { IStorage } from "./storage";

const SETTINGS_BOT_TOKEN = "telegram_bot_token";
const SETTINGS_CHAT_ID = "telegram_notification_chat_id";

async function getBotSettings(storage: IStorage): Promise<{ token: string; chatId: string } | null> {
  const token = await storage.getSetting(SETTINGS_BOT_TOKEN);
  const chatId = await storage.getSetting(SETTINGS_CHAT_ID);
  if (!token || !chatId) return null;
  return { token, chatId };
}

export async function sendTelegramNotification(storage: IStorage, message: string): Promise<void> {
  try {
    const settings = await getBotSettings(storage);
    if (!settings) return;

    const url = `https://api.telegram.org/bot${settings.token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: settings.chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`[Telegram] 알림 전송 실패 (${res.status}): ${body}`);
    }
  } catch (err) {
    console.warn("[Telegram] 알림 전송 중 오류:", err);
  }
}

function getKSTTimeString(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace("T", " ").substring(0, 16);
}

function truncate(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.substring(0, max) + "..." : str;
}

export async function notifyNewInquiry(
  storage: IStorage,
  opts: { username: string; title: string; content: string }
): Promise<void> {
  const msg =
    `📩 <b>[새 1:1 문의]</b>\n` +
    `👤 사용자: ${opts.username}\n` +
    `📌 제목: ${truncate(opts.title, 50)}\n` +
    `💬 내용: ${truncate(opts.content, 100)}\n` +
    `🕐 시각: ${getKSTTimeString()}`;
  sendTelegramNotification(storage, msg).catch(() => {});
}

export async function notifyDepositRequest(
  storage: IStorage,
  opts: { username: string; amount: string; bankName?: string | null; accountHolder?: string | null; accountNumber?: string | null }
): Promise<void> {
  const amountNum = parseFloat(opts.amount);
  const formattedAmount = isNaN(amountNum) ? opts.amount : amountNum.toLocaleString("ko-KR") + "원";
  const bankInfo = [opts.bankName, opts.accountHolder].filter(Boolean).join(" | ");
  const acct = opts.accountNumber ? `\n🏦 계좌: ${opts.accountNumber}` : "";

  const msg =
    `💰 <b>[입금신청]</b>\n` +
    `👤 사용자: ${opts.username}\n` +
    `💵 금액: ${formattedAmount}\n` +
    (bankInfo ? `🏛 은행: ${bankInfo}` : "") +
    acct +
    `\n🕐 시각: ${getKSTTimeString()}`;
  sendTelegramNotification(storage, msg).catch(() => {});
}

export async function notifyLargeBet(
  storage: IStorage,
  opts: { username: string; symbol: string; duration: number; direction: string; amount: number }
): Promise<void> {
  const formattedAmount = opts.amount.toLocaleString("ko-KR") + "원";
  const dirLabel = opts.direction === "long" ? "매수 ↑" : "매도 ↓";
  const durationLabel = "5분";

  const msg =
    `🎯 <b>[고액베팅 알림]</b>\n` +
    `👤 사용자: ${opts.username}\n` +
    `📊 종목: ${opts.symbol} (${durationLabel})\n` +
    `📈 방향: ${dirLabel}\n` +
    `💵 금액: ${formattedAmount}\n` +
    `🕐 시각: ${getKSTTimeString()}`;
  sendTelegramNotification(storage, msg).catch(() => {});
}
