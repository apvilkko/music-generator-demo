const createGain = (ctx, destination, value) => {
  const gain = ctx.createGain();
  gain.gain.value = value || 0.5;
  gain.connect(destination);
  return gain;
};

export default createGain;
