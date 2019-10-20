import createAudioEngine from "./createAudioEngine.js";
import setupListeners from "./setupListeners.js";
import rand, { sample } from "./rand.js";
import oscillator from "./oscillator.js";
import filter from "./filter.js";
import gain from "./gain.js";
import envelope from "./envelope.js";
import { tempoToMs, noteToFreq } from "./math.js";

const template = `
<h2>Step 8: Mixing multiple sounds</h2>
<ul>
<li>Encapsulate the osc + filter + amp into a "synth"</li>
<li>Create a channel for each sound</li>
</ul>
<div class="form-group">
  <label for="tempo">Tempo (BPM)</label>
  <input id="tempo" type="number" min="10" max="300" value="130" />
</div>
<div id="diagram">
  <img src="diagrams/step8.svg">
</div>
`;

let tempo = 130;

const createSynth = (ctx, destination) => {
  const synthGain = gain(ctx, destination, 0.7);
  const ampEnv = envelope(ctx, synthGain.gain);
  const synthFilter = filter(ctx, synthGain);
  const filtEnv = envelope(ctx, synthFilter.frequency, 100, 1500, 0.2, 0.2);
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
    const synth = createSynth(ctx, channelGain);
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

const tick = state => {
  let oneBeatInMs = tempoToMs(tempo);

  timer = setTimeout(() => {
    oneBeatInMs = tempoToMs(tempo);

    for (let i = 0; i < NUM_SOUNDS; ++i) {
      const shouldTrigger = rand(0, 100) > 25;
      if (shouldTrigger) {
        // random major scale note with a random octave variation
        const note =
          ROOT +
          sample(MAJOR_SCALE) +
          sample([0, OCTAVE, 2 * OCTAVE]) +
          i * OCTAVE;
        const freq = noteToFreq(note);
        const now = state.ctx.currentTime + 0.05;
        synths[i].ampEnv(now);
        synths[i].filtEnv(now);
        synths[i].osc.frequency.linearRampToValueAtTime(freq, now);
      }
    }

    tick(state);
  }, oneBeatInMs);
};

let pauseFn;
let tempoListener;

const entry = state => {
  createAudioStuff(state);
  const { pause } = setupListeners(state);
  pauseFn = pause;

  tempoListener = evt => {
    tempo = Number(evt.target.value);
  };

  document.getElementById("tempo").addEventListener("change", tempoListener);

  tick(state);
};

const exit = state => {
  pauseFn();
  document.getElementById("tempo").removeEventListener("change", tempoListener);
  clearTimeout(timer);
};

export { template, entry, exit };
