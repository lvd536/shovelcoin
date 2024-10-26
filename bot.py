import telebot
from telebot import types

bot = telebot.TeleBot("7653825023:AAGdNRmILzxIkqBm64u78QSUw1pumyFBBXs")

web_app_url = "t.me/shovelcoinweb_bot/shovelcoin"

text = "Это приложение - копия гры Hamster Kombat, сделанная за 100 минут!\n\nНажмите на кнопку снизу, что запустить его!"

button = types.InlineKeyboardButton('Запустить', url=web_app_url)
keyboard = types.InlineKeyboardMarkup()
keyboard.add(button)

@bot.message_handler(commands=['start'])
def send_message(message):
    bot.send_message(message.chat.id, text=text, reply_markup=keyboard)

bot.polling()