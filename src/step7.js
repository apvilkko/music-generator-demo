import createAudioEngine from "./createAudioEngine.js";
import setupListeners from "./setupListeners.js";
import rand, { sample } from "./rand.js";
import oscillator from "./oscillator.js";
import filter from "./filter.js";
import gain from "./gain.js";
import envelope from "./envelope.js";
import { tempoToMs, noteToFreq } from "./math.js";

const template = `
<h2>Step 7: Tonality with a scale</h2>
<ul>
<li>Instead of random 12 tones, use a scale</li>
</ul>
<div class="form-group">
  <label for="tempo">Tempo (BPM)</label>
  <input id="tempo" type="number" min="10" max="300" value="130" />
</div>
<div id="diagram">
  <img src="diagrams/step4.svg">
</div>
`;

let triggerAmpEnv;
let triggerFiltEnv;
let tempo = 130;

const createAudioStuff = state => {
  const { ctx, gain: masterGain } = createAudioEngine(state);
  state.ctx = ctx;
  state.masterGain = masterGain;

  state.gain = gain(state.ctx, state.masterGain, 1);
  triggerAmpEnv = envelope(state.ctx, state.gain.gain);
  state.filter = filter(state.ctx, state.gain);
  triggerFiltEnv = envelope(
    state.ctx,
    state.filter.frequency,
    100,
    1500,
    0.2,
    0.2
  );
  state.osc = oscillator(state.ctx, state.filter);
};

let timer;

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]; // distance as semitones from root
const ROOT = rand(33, 39);

const tick = state => {
  let oneBeatInMs = tempoToMs(tempo);

  timer = setTimeout(() => {
    oneBeatInMs = tempoToMs(tempo);

    const shouldTrigger = rand(0, 100) > 25;
    if (shouldTrigger) {
      // random major scale note with a random octave variation
      const note = ROOT + sample(MAJOR_SCALE) + sample([0, 12, 24]);
      const freq = noteToFreq(note);
      const now = state.ctx.currentTime + 0.05;
      triggerAmpEnv(now);
      triggerFiltEnv(now);
      state.osc.frequency.linearRampToValueAtTime(freq, now);
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
