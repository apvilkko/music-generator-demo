import gain from "./gain.js";

const createAudioEngine = (state, suspend = true) => {
  if (state.ctx) {
    state.ctx.suspend();
    state.ctx.close();
  }
  const ctx = new AudioContext();
  if (suspend) {
    ctx.suspend();
  }

  const masterGain = gain(ctx, ctx.destination);

  return { ctx, gain: masterGain };
};

export default createAudioEngine;
