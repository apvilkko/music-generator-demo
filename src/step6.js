import createAudioEngine from "./createAudioEngine.js";
import setupListeners from "./setupListeners.js";
import rand from "./rand.js";
import oscillator from "./oscillator.js";
import filter from "./filter.js";
import gain from "./gain.js";
import envelope from "./envelope.js";
import { tempoToMs, noteToFreq } from "./math.js";

const template = `
<h2>Step 6: Tuning</h2>
<ul>
<li>Use equal temperament tuning instead of random frequencies</li>
<li>Oscillator → Lowpass filter w/envelope → Amp w/envelope → Master gain</li>
</ul>
<div class="form-group">
  <label for="tempo">Tempo (BPM)</label>
  <input id="tempo" type="number" min="10" max="300" value="120" />
</div>
`;

let triggerAmpEnv;
let triggerFiltEnv;
let tempo = 120;

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

const tick = state => {
  let oneBeatInMs = tempoToMs(tempo);

  timer = setTimeout(() => {
    oneBeatInMs = tempoToMs(tempo);

    const shouldTrigger = rand(0, 100) > 25;
    if (shouldTrigger) {
      const note = rand(36, 72); // MIDI notes C2 to C5
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
