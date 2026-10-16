// ЗАГЛУШКА MAX. Для подключения:
// 1. Создать бота через @MasterBot, пройти модерацию.
// 2. Токен положить в MAX_BOT_TOKEN, выставить MAX_ENABLED=true.
// 3. Реализовать send() по актуальной документации MAX (botapi.max.ru):
//    отправка по user_id сотрудника, который запустил бота.
export const maxProvider = {
  async send(_to: string, _text: string): Promise<void> {
    throw new Error("MAX: провайдер не реализован");
  },
};
