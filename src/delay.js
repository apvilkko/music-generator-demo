import gain from "./gain.js";
import filter from "./filter.js";

const createDelay = (ctx, destination) => {
  const output = gain(ctx, destination);
  const wet = gain(ctx, output, 0.6);
  const dry = gain(ctx, output, 0.9);
  const input = gain(ctx, destination, 1);

  const delay = ctx.createDelay();
  delay.delayTime.value = 0.33;

  const feedback = gain(ctx, delay, 0.6);

  delay.connect(feedback);
  delay.connect(wet);

  const inputFilter = filter(ctx, delay);
  inputFilter.frequency.value = 4000;
  input.connect(dry);
  input.connect(inputFilter);

  return { input, output, delay };
};

export default createDelay;
