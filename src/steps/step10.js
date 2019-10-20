import createAudioEngine from "../createAudioEngine.js";
import rand, { sample } from "../rand.js";
import setupListeners from "../setupListeners.js";
import oscillator from "../oscillator.js";
import filter from "../filter.js";
import gain from "../gain.js";
import envelope from "../envelope.js";
import delay from "../delay.js";
import { noteToFreq } from "../math.js";

const template = `
<h2>Step 10: Accurate timing and a sequencer</h2>
<ul>
<li>Use AudioContext timing to schedule events</li>
<li>Randomize and store repeatable patterns</li>
</ul>
<div class="form-group">
  <label for="tempo">Tempo (BPM)</label>
  <input id="tempo" type="number" min="10" max="300" value="115" />
</div>
<button id="randomize" type="button">Randomize</button>
<div id="diagram">
  <img src="diagrams/step10.svg">
</div>
<div id="diagram">
  <img src="diagrams/step9.svg">
</div>
`;

let tempo = 115;

const createSynth = (ctx, destination) => {
  const synthGain = gain(ctx, destination, 0.7);
  const ampEnv = envelope(ctx, synthGain.gain, 0, 1, 0.02, 0.2);
  const synthFilter = filter(ctx, synthGain);
  const filtEnv = envelope(ctx, synthFilter.frequency, 100, 1500, 0.05, 0.1);
  const osc = oscillator(ctx, synthFilter);
  return { osc, gain: synthGain, ampEnv, filtEnv };
};

const NUM_SOUNDS = 2;
let channels;
let synths;

const createAudioStuff = state => {
  const { ctx, gain: masterGain } = createAudioEngine(state);
  state.ctx = ctx;
  state.masterGain = masterGain;

  channels = [];
  synths = [];
  for (let i = 0; i < NUM_SOUNDS; ++i) {
    const channelGain = gain(state.ctx, state.masterGain, 0.5);
    let output = channelGain;
    if (i === 1) {
      const delayEffect = delay(ctx, channelGain);
      delayEffect.delay.delayTime.value = 0.25;
      output = delayEffect.input;
    }
    const synth = createSynth(ctx, output);
    if (i === 0) {
      synth.osc.type = "square";
    }
    synths.push(synth);
    channels.push(channelGain);
  }
};

let timer;

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]; // distance as semitones from root
const ROOT = rand(33, 39);
const OCTAVE = 12;

const PATTERN_LENGTH = 64;
let patterns = [[], []];

const randomize = () => {
  for (let i = 0; i < NUM_SOUNDS; ++i) {
    patterns[i] = [];
    for (let x = 0; x < PATTERN_LENGTH; ++x) {
      const isQuarter = x % 4 === 0;
      const isEighth = x % 2 === 0;
      const prob = isQuarter
        ? rand(0, 100) > 20
        : isEighth
        ? rand(0, 100) > 50
        : rand(0, 100) > 80;
      const note =
        ROOT +
        sample(MAJOR_SCALE) +
        sample([0, OCTAVE, 2 * OCTAVE]) +
        i * OCTAVE;
      patterns[i].push(prob ? { note } : null);
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
          const freq = noteToFreq(note.note);
          synths[i].ampEnv(when);
          synths[i].filtEnv(when);
          synths[i].osc.frequency.setValueAtTime(freq, when);
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
