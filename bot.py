import telebot
from telebot import types

bot = telebot.TeleBot("7653825023:AAGdNRmILzxIkqBm64u78QSUw1pumyFBBXs")

base_web_app_url = "https://shovel-coin.web.app"  # Замените на URL вашего веб-приложения

text = "Это приложение - копия игры Hamster Kombat, сделанная за 100 минут!\n\nНажмите на кнопку снизу, чтобы запустить его!"

@bot.message_handler(commands=['start'])
def send_message(message):
    user_id = message.from_user.id
    web_app_url = f"{base_web_app_url}?id={user_id}"
    
    button = types.InlineKeyboardButton('Запустить', web_app=types.WebAppInfo(url=web_app_url))
    keyboard = types.InlineKeyboardMarkup()
    keyboard.add(button)
    
    bot.send_message(message.chat.id, text=text, reply_markup=keyboard)

bot.polling()
