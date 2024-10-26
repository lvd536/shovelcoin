import telebot
from telebot import types
from telebot.types import WebAppInfo

bot = telebot.TeleBot("7653825023:AAGdNRmILzxIkqBm64u78QSUw1pumyFBBXs")

web_app_url = "https://lvd536.github.io/shovelcoin/"

text = "Tap tap tap по экранчику!"

@bot.message_handler(commands=['start'])
def send_message(message):
    user_id = message.from_user.id
    full_url = f"{web_app_url}?id={user_id}"
    keyboard = telebot.types.InlineKeyboardMarkup()
    web_app = WebAppInfo(url=full_url)
    keyboard.add(telebot.types.InlineKeyboardButton(text="Запустить", web_app=web_app))
    bot.send_message(message.chat.id, text=text, reply_markup=keyboard)

bot.polling()
