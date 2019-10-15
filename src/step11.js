import createAudioEngine from "./createAudioEngine.js";
import setupListeners from "./setupListeners.js";
import rand, { sample } from "./rand.js";
import oscillator from "./oscillator.js";
import filter from "./filter.js";
import gain from "./gain.js";
import delay from "./delay.js";
import envelope from "./envelope.js";
import createSample from "./createSample.js";
import { noteToFreq } from "./math.js";

const template = `
<h2>Step 11: Add samples and chord changes</h2>
<ul>
<li>Add sample-based simple drums</li>
<li>Instead of random bass notes, keep one "chord" longer</li>
<li>Synth 1 → Feedback delay → Channel 1 gain → Master gain</li>
<li>Synth 2 → Channel 2 gain → Master gain</li>
<li>Kick drum sample → Channel 3 gain → Master gain</li>
<li>Snare sample → Feedback delay → Channel 4 gain → Master gain</li>
</ul>
<div class="form-group">
  <label for="tempo">Tempo (BPM)</label>
  <input id="tempo" type="number" min="10" max="300" value="115" />
</div>
<button id="randomize" type="button">Randomize</button>
`;

let tempo = 115;

const createSynth = (ctx, destination) => {
  const synthGain = gain(ctx, destination, 0.7);
  const ampEnv = envelope(ctx, synthGain.gain, 0, 1, 0.02, 0.2);
  const synthFilter = filter(ctx, synthGain);
  const filtEnv = envelope(ctx, synthFilter.frequency, 100, 1500, 0.05, 0.1);
  const osc = oscillator(ctx, synthFilter);

  const noteOn = (when, note) => {
    const freq = noteToFreq(note.note);
    ampEnv(when);
    filtEnv(when);
    osc.frequency.setValueAtTime(freq, when);
  };

  return { osc, gain: synthGain, ampEnv, filtEnv, noteOn };
};

const NUM_SOUNDS = 4;
let channels;
let synths;

const createAudioStuff = state => {
  const { ctx, gain: masterGain } = createAudioEngine(state);
  state.ctx = ctx;
  state.masterGain = masterGain;

  channels = [];
  synths = [];
  for (let i = 0; i < NUM_SOUNDS; ++i) {
    const channelGain = gain(state.ctx, state.masterGain, i < 2 ? 0.5 : 0.7);
    let output = channelGain;
    let instrument;
    if (i === 1 || i === 3) {
      const delayEffect = delay(ctx, channelGain);
      delayEffect.delay.delayTime.value = i === 1 ? 0.25 : 0.38;
      output = delayEffect.input;
    }
    if (i === 0 || i === 1) {
      instrument = createSynth(ctx, output);
      if (i === 0) {
        instrument.osc.type = "square";
      }
    }
    if (i === 2) {
      instrument = createSample(ctx, "bd.ogg", output);
    }
    if (i === 3) {
      instrument = createSample(ctx, "sn.ogg", output);
    }

    synths.push(instrument);
    channels.push(channelGain);
  }
};

let timer;

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]; // distance as semitones from root
const BASS_NOTES = [0, 5, 7, 9]; // Four common chord roots in major
const SWEET_NOTES = [-1, 0, 2, 7]; // These sound good over basically any bass note
const ROOT = rand(33, 39);
const OCTAVE = 12;

const PATTERN_LENGTH = 64;
let patterns = [[], []];

const randomize = () => {
  for (let i = 0; i < NUM_SOUNDS; ++i) {
    patterns[i] = [];
    let currentChord;
    let currentRoot;
    for (let x = 0; x < PATTERN_LENGTH; ++x) {
      const isQuarter = x % 4 === 0;
      const isEighth = x % 2 === 0;
      const isFullBar = x % 16 === 0;
      if (i === 0) {
        // Bass
        const prob = isEighth ? rand(0, 100) > 20 : rand(0, 100) > 50;
        if (isFullBar) {
          currentRoot =
            rand(0, 100) > 40 ? sample(BASS_NOTES) : sample(MAJOR_SCALE);
          currentChord = ROOT + currentRoot - sample([0, OCTAVE]);
        }
        const note = currentChord;
        patterns[i].push(prob ? { note } : null);
      } else if (i === 1) {
        // "Lead melody"
        const prob = isQuarter
          ? rand(0, 100) > 20
          : isEighth
          ? rand(0, 100) > 50
          : rand(0, 100) > 80;
        const note =
          ROOT +
          OCTAVE +
          (rand(0, 100) > 30 ? sample(SWEET_NOTES) : sample(MAJOR_SCALE)) +
          sample([0, OCTAVE, 2 * OCTAVE]);
        patterns[i].push(prob ? { note } : null);
      } else if (i === 2) {
        // Kick, emphasize quarter beats
        const prob = isQuarter ? rand(0, 100) > 5 : rand(0, 100) > 95;
        const pitch = rand(-3, 3);
        patterns[i].push(prob ? { pitch } : null);
      } else if (i === 3) {
        // Snare, emphasize beats 2 and 4
        const prob = (x + 4) % 8 === 0 ? rand(0, 100) > 5 : rand(0, 100) > 95;
        const pitch = rand(-3, 3);
        patterns[i].push(prob ? { pitch } : null);
      }
    }
  }
};

const TICK_LEN = 500;
const SAFETY_OFFSET = 0.01;
let position = 0;
let lastTickTime = 0;

const getNextNoteTime = (tempo, noteLength, time) => {
  const beatLen = 60.0 / tempo;
  const currentNote = Math.floor(time / (noteLength * beatLen));
  return (currentNote + 1) * (noteLength * beatLen);
};

const tick = state => {
  timer = setInterval(() => {
    const now = state.ctx.currentTime;

    let time = lastTickTime;
    while (true) {
      // one step in pattern is a 16th note = 1/4 of a beat
      let nextNoteTime = getNextNoteTime(tempo, 1 / 4, time);
      if (nextNoteTime > now) {
        break;
      }
      for (let i = 0; i < NUM_SOUNDS; ++i) {
        const note = patterns[i][position % PATTERN_LENGTH];
        const delta = Math.max(
          nextNoteTime - (now - TICK_LEN / 1000) + SAFETY_OFFSET,
          0
        );
        const when = now + delta;
        if (note) {
          synths[i].noteOn(when, note);
        }
      }
      time += nextNoteTime - time + 0.005;
      position++;
    }

    lastTickTime = state.ctx.currentTime;
  }, TICK_LEN);
};

let pauseFn;
let tempoListener;
let randomizeListener;

const entry = state => {
  createAudioStuff(state);
  randomize();
  const { pause, play } = setupListeners(state);
  pauseFn = pause;

  tempoListener = evt => {
    tempo = Number(evt.target.value);
  };

  randomizeListener = () => {
    pause();
    randomize();
    play();
  };

  document.getElementById("tempo").addEventListener("change", tempoListener);
  document
    .getElementById("randomize")
    .addEventListener("click", randomizeListener);

  tick(state);
};

const exit = state => {
  pauseFn();
  document.getElementById("tempo").removeEventListener("change", tempoListener);
  document
    .getElementById("randomize")
    .removeEventListener("click", randomizeListener);
  clearInterval(timer);
};

export { template, entry, exit };
