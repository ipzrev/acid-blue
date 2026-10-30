import * as Tone from "https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm";

// ---------- Настройки ----------

// Темп лупа, ударов в минуту
const TEMPO = 110;

// Ноты пэдов. Вместе D H E G — аккорд Em7, любые сочетания звучат согласованно.
// ACID играет внизу, BLUE — наверху. H — это си (B)
const NOTES = {
  D: { acid: "D3", blue: "D6" },
  H: { acid: "B2", blue: "B5" },
  E: { acid: "E2", blue: "E5" },
  G: { acid: "G3", blue: "G5" },
};

// Клавиши по физическому положению — работают и в русской раскладке
const KEYS = { KeyD: "D", KeyH: "H", KeyB: "H", KeyE: "E", KeyG: "G" };

// ---------- Выход ----------

// Лимитер на общем выходе не даёт звуку перегрузиться
const master = new Tone.Limiter(-1).toDestination();
const transport = Tone.getTransport();
transport.bpm.value = TEMPO;

// ---------- ACID: тревога, слева ----------
// Синтезатор → дисторшн → эхо → канал (pan −0.5)

const acidChannel = new Tone.Channel({ pan: -0.5, volume: -6 }).connect(master);

const acidSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.3 },
});

acidSynth.chain(
  new Tone.Distortion({ distortion: 0.45, wet: 0.35 }),
  new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.35, wet: 0.25 }),
  acidChannel,
);

// ---------- BLUE: стекло, справа ----------
// Синтезатор → хорус → реверб → канал (pan +0.5)

const blueChannel = new Tone.Channel({ pan: 0.5, volume: -10 }).connect(master);

const blueSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 0.002, decay: 0.4, sustain: 0.2, release: 2.5 },
});

blueSynth.chain(
  new Tone.Chorus({ frequency: 0.7, delayTime: 3.5, depth: 0.6, wet: 0.5 }).start(),
  new Tone.Reverb({ decay: 7, wet: 0.55 }),
  blueChannel,
);

// Голоса по имени из data-voice.
// preview — нота при выборе волны, releaseMax — самое долгое затухание, с
const voices = {
  acid: { synth: acidSynth, channel: acidChannel, preview: "E2", releaseMax: 3 },
  blue: { synth: blueSynth, channel: blueChannel, preview: "E5", releaseMax: 8 },
};

// ---------- Общие функции ----------

// Браузер включает звук только после клика пользователя
async function startAudio() {
  if (Tone.getContext().state !== "running") await Tone.start();
}

// Включённая кнопка: белая и с aria-pressed для экранного диктора
function setActive(button, isActive) {
  button.classList.toggle("is-active", isActive);
  button.setAttribute("aria-pressed", isActive);
}

// Оба голоса играют выбранные ноты одновременно
function playNotes(notes, time = Tone.now()) {
  if (notes.length === 0) return;
  acidSynth.triggerAttackRelease(notes.map((note) => NOTES[note].acid), "8n", time);
  blueSynth.triggerAttackRelease(notes.map((note) => NOTES[note].blue), "8n", time);
}

// ---------- Wave ----------
// Клик: меняем волну голоса, подсвечиваем кнопку и даём послушать

document.querySelectorAll(".wave").forEach((group) => {
  const voice = voices[group.dataset.voice];
  const buttons = group.querySelectorAll(".wave__btn");

  buttons.forEach((button) => {
    setActive(button, button.classList.contains("is-active"));

    button.addEventListener("click", async () => {
      await startAudio();
      voice.synth.set({ oscillator: { type: button.dataset.wave } });
      buttons.forEach((item) => setActive(item, item === button));
      voice.synth.triggerAttackRelease(voice.preview, "8n");
    });
  });
});

// ---------- Attack · Sustain · Release · Volume ----------
// Положение ползунка от 0 до 1 переводим в настройку голоса.
// Квадрат x * x делает начало шкалы точнее

document.querySelectorAll(".params__col").forEach((column) => {
  const voice = voices[column.dataset.voice];

  column.querySelectorAll(".param__slider").forEach((slider) => {
    function apply() {
      const x = slider.value / 100;

      if (slider.dataset.param === "attack") {
        voice.synth.set({ envelope: { attack: 0.001 + x * x * 2 } }); // 1 мс … 2 с
      }
      if (slider.dataset.param === "sustain") {
        voice.synth.set({ envelope: { sustain: x * x * 0.8 } });
      }
      if (slider.dataset.param === "release") {
        voice.synth.set({ envelope: { release: 0.05 + x * x * voice.releaseMax } });
      }
      if (slider.dataset.param === "volume") {
        voice.channel.volume.value = x === 0 ? -Infinity : -24 + x * 30; // дБ
      }
    }

    slider.addEventListener("input", apply);
    apply(); // выставляем настройки сразу при загрузке
  });
});

// ---------- Ноты D H E G ----------
// Можно включить несколько сразу. Без лупа нота звучит один раз

const noteButtons = document.querySelectorAll(".pads__note");
const selectedNotes = new Set(["D"]);
let isLooping = false;

async function toggleNote(note) {
  const isOn = !selectedNotes.has(note);
  if (isOn) selectedNotes.add(note);
  else selectedNotes.delete(note);

  noteButtons.forEach((button) => {
    setActive(button, selectedNotes.has(button.dataset.note));
  });

  await startAudio();
  if (isOn && !isLooping) playNotes([note]);
}

noteButtons.forEach((button) => {
  setActive(button, selectedNotes.has(button.dataset.note));
  button.addEventListener("click", () => toggleNote(button.dataset.note));
});

// ---------- LOOP ----------
// Включённые ноты повторяются каждую четверть, кнопки вспыхивают на ударе

const loopButton = document.querySelector(".pads__loop");
setActive(loopButton, false);

transport.scheduleRepeat((time) => {
  const notes = [...selectedNotes];
  playNotes(notes, time);

  // вспышка синхронно со звуком
  Tone.getDraw().schedule(() => {
    noteButtons.forEach((button) => {
      if (!notes.includes(button.dataset.note)) return;
      button.classList.add("is-hit");
      setTimeout(() => button.classList.remove("is-hit"), 90);
    });
  }, time);
}, "4n");

async function toggleLoop() {
  await startAudio();
  isLooping = !isLooping;
  setActive(loopButton, isLooping);

  if (isLooping) {
    transport.start("+0.05");
  } else {
    transport.stop();
    acidSynth.releaseAll(); // глушим хвосты нот
    blueSynth.releaseAll();
  }
}

loopButton.addEventListener("click", toggleLoop);

// ---------- Клавиатура для лайва ----------
// D H E G — ноты (B тоже работает как H), пробел — LOOP

document.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.code === "Space") {
    if (event.target.tagName === "BUTTON") return; // кнопку в фокусе пробел и так нажимает
    event.preventDefault(); // чтобы страница не прокручивалась
    toggleLoop();
    return;
  }

  if (KEYS[event.code]) toggleNote(KEYS[event.code]);
});
