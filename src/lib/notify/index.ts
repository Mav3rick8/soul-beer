import { prisma } from "@/lib/prisma";
import { maxProvider } from "./providers/max";
import { smsProvider } from "./providers/sms";

export type Channel = "MAX" | "SMS";

const providers = {
  MAX: maxProvider,
  SMS: smsProvider,
} satisfies Record<Channel, { send(to: string, text: string): Promise<void> }>;

/**
 * Отправка с журналом. Пока канал выключен (MAX_ENABLED / SMS_ENABLED != "true"),
 * сообщение не уходит, статус записывается как "stub".
 * Текст сообщения в журнал не пишем: в нём могут быть коды подтверждения.
 */
export async function notify(channel: Channel, to: string, text: string, kind: string): Promise<string> {
  let status = "stub";
  let error: string | undefined;

  if (process.env[`${channel}_ENABLED`] === "true") {
    try {
      await providers[channel].send(to, text);
      status = "sent";
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.info(`[stub ${channel}] ${kind} -> ${to}: ${text}`);
  }

  await prisma.notification.create({ data: { channel, kind, recipient: to, status, error } });
  return status;
}

/** user_id сотрудников, которым должны приходить уведомления в MAX. */
export async function staffMaxIds(): Promise<string[]> {
  const rows = await prisma.staff.findMany({
    where: { active: true, maxUserId: { not: null } },
    select: { maxUserId: true },
  });
  return rows.map((r) => r.maxUserId).filter((v): v is string => !!v);
}
