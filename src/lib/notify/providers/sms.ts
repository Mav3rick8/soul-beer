// ЗАГЛУШКА SMS. Для подключения (например, SMSC.ru):
// 1. Зарегистрировать буквенное имя отправителя (обычно несколько дней).
// 2. Заполнить SMSC_LOGIN, SMSC_PASSWORD, SMSC_SENDER, выставить SMS_ENABLED=true.
// 3. Реализовать send(): номер в формате 7XXXXXXXXXX, текст в кодировке UTF-8.
export const smsProvider = {
  async send(_to: string, _text: string): Promise<void> {
    throw new Error("SMS: провайдер не реализован");
  },
};
