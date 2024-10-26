import telebot
from telebot.types import WebAppInfo

bot = telebot.TeleBot("7653825023:AAGdNRmILzxIkqBm64u78QSUw1pumyFBBXs")

# Измените этот URL на актуальный URL вашего веб-приложения
web_app_url = "https://lvd536.github.io/shovelcoin/"

text = "Tap tap tap по экранчику!"

@bot.message_handler(commands=['start'])
def send_message(message):
    keyboard = telebot.types.InlineKeyboardMarkup()
    web_app = WebAppInfo(url=web_app_url)
    keyboard.add(telebot.types.InlineKeyboardButton(text="Запустить", web_app=web_app))
    bot.send_message(message.chat.id, text=text, reply_markup=keyboard)

bot.polling()
