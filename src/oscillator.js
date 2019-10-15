const createOscillator = (ctx, destination) => {
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 220;
  osc.start(0);
  osc.connect(destination);
  return osc;
};

export default createOscillator;
