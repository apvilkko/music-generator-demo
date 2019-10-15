const createEnvelope = (
  ctx,
  target,
  min = 0,
  max = 1,
  attack = 0.1,
  release = 0.4
) => {
  const trigger = when => {
    const now = when || ctx.currentTime;
    target.cancelScheduledValues(now);
    target.linearRampToValueAtTime(min, now);
    target.linearRampToValueAtTime(max, now + attack);
    target.linearRampToValueAtTime(min, now + attack + release);
  };
  return trigger;
};

export default createEnvelope;
