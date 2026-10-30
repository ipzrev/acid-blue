# ACID BLUE

Веб-синтезатор на Tone.js о холоде и тревоге. Низкий гул ACID звучит как сигнал тревоги, высокий звон BLUE — как стекло. Только синтез, без записанных звуков.

- Синтезатор: [ссылка на GitHub Pages]
- Скринкаст: [ссылка на видео]

## Голоса

- **ACID** — синтезатор → Distortion → FeedbackDelay → канал слева
- **BLUE** — синтезатор → Chorus → Reverb → канал справа
- Оба канала → Limiter → выход

## Управление

- **Wave** — форма волны: sine, square, sawtooth, triangle
- **Attack, Sustain, Release, Volume** — огибающая и громкость голоса
- **D H E G** — ноты аккорда Em7, можно включать несколько сразу
- **LOOP** — повторяет включённые ноты, 110 BPM
- Клавиатура: D, H, E, G — ноты, пробел — LOOP

## Структура

```
index.html      разметка
css/fonts.css   шрифт заголовков
css/style.css   стили, нейминг по БЭМ
js/script.js    звук и управление
fonts/          ABC Asfalt Compressed
```

## Запуск

Открыть `index.html` через Live Server в VS Code. Tone.js подключается из CDN.

Пузырев Илия, 1 поток · 2026
