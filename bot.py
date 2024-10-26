import telebot
from telebot.types import WebAppInfo

BOT_TOKEN = "7653825023:AAGdNRmILzxIkqBm64u78QSUw1pumyFBBXs"
WEB_APP_URL = "https://your-github-username.github.io/your-repo-name/"

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton(text="Открыть игру", web_app=WebAppInfo(url=WEB_APP_URL)))
    bot.reply_to(message, "Привет! Нажми на кнопку ниже, чтобы начать игру:", reply_markup=markup)

bot.polling()
