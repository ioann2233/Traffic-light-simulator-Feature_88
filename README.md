# Симулятор работы умного светофора

Интерактивная 3D-симуляция умного светофора с адаптивным управлением на основе данных о трафике. Симулятор демонстрирует работу системы управления дорожным движением на перекрестке с использованием алгоритмов машинного обучения для оптимизации транспортных потоков.

## Особенности

- 3D-визуализация перекрестка с реалистичной физикой движения
- Адаптивное управление светофорами на основе данных о трафике
- Система обучения с подкреплением для оптимизации времени работы сигналов
- Мониторинг транспортных потоков в реальном времени
- Визуализация статистики движения
- Поддержка пешеходных переходов и поворотных маневров
- Симуляция камер наблюдения

## Технологии

- Python 3.11+
- Flask
- Three.js
- OpenCV
- NumPy
- Chart.js
- SQLAlchemy

## Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone [URL репозитория]
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Запустите сервер:
```bash
python main.py
```

4. Откройте браузер и перейдите по адресу http://localhost:5000

## Структура проекта

- `/static/js/` - JavaScript файлы для 3D-визуализации и логики симуляции
- `/static/css/` - Стили приложения
- `/templates/` - HTML шаблоны
- `app.py` - Основной файл сервера Flask
- `traffic_algorithm.py` - Алгоритмы управления светофором
- `models.js` - 3D модели объектов

## Использование

1. После запуска вы увидите 3D-визуализацию перекрестка
2. Камеры автоматически отслеживают транспортный поток
3. Система управления адаптивно регулирует время работы светофоров
4. В правой панели отображается статистика движения
5. Поддерживается интерактивное управление камерами и светофорами

## Лицензия

MIT License

## Авторы

[Ваше имя/организация]

## Контакты

- Email: [email]
- GitHub: [ссылка на профиль]
