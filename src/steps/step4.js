import createAudioEngine from "../createAudioEngine.js";
import rand from "../rand.js";
import setupListeners from "../setupListeners.js";
import oscillator from "../oscillator.js";
import filter from "../filter.js";
import gain from "../gain.js";
import envelope from "../envelope.js";

const template = `
<h2>Step 4: Filter envelope</h2>
<ul>
<li>Shape the filter cutoff with an envelope</li>
</ul>
<div id="diagram">
  <img src="diagrams/step4.svg">
</div>
`;

let triggerAmpEnv;
let triggerFiltEnv;
let timer;

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

const tick = state => {
  timer = setTimeout(() => {
    const freq = rand(50, 900);
    const now = state.ctx.currentTime + 0.05;
    triggerAmpEnv(now);
    triggerFiltEnv(now);
    state.osc.frequency.setValueAtTime(freq, now);
    tick(state);
  }, rand(100, 1500));
};

let pauseFn;

const entry = state => {
  createAudioStuff(state);
  const { pause } = setupListeners(state);
  pauseFn = pause;
  tick(state);
};

const exit = state => {
  pauseFn();
  clearTimeout(timer);
};

export { template, entry, exit };
