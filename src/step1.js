import createAudioEngine from "./createAudioEngine.js";
import oscillator from "./oscillator.js";
import rand from "./rand.js";
import setupListeners from "./setupListeners.js";

const template = `
<h2>Step 1: Random Mess</h2>
<ul>
<li>One sawtooth oscillator</li>
<li>random frequencies</li>
<li>random timing</li>
<li>Oscillator → Master gain</li>
</ul>
`;

let timer;

const createAudioStuff = state => {
  const { ctx, gain } = createAudioEngine(state);
  state.ctx = ctx;
  state.masterGain = gain;

  state.osc = oscillator(state.ctx, state.masterGain);
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
