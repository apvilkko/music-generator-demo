const createFilter = (ctx, destination) => {
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 4;
  filter.connect(destination);
  return filter;
};

export default createFilter;
