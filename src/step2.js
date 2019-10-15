import createAudioEngine from "./createAudioEngine.js";
import oscillator from "./oscillator.js";
import filter from "./filter.js";
import rand from "./rand.js";
import setupListeners from "./setupListeners.js";

const template = `
<h2>Step 2: Filter</h2>
<ul>
<li>Oscillator → Lowpass filter → Master gain</li>
</ul>
`;

let timer;

const createAudioStuff = state => {
  const { ctx, gain } = createAudioEngine(state);
  state.ctx = ctx;
  state.masterGain = gain;

  state.filter = filter(state.ctx, state.masterGain);
  state.osc = oscillator(state.ctx, state.filter);
};

const tick = state => {
  timer = setTimeout(() => {
    const freq = rand(50, 900);
    state.osc.frequency.setValueAtTime(freq, state.ctx.currentTime);
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
