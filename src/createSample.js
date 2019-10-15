const doRequest = url => fetch(url).then(response => response.arrayBuffer());
const cache = {};

const loadBuffer = (ctx, name) => {
  return new Promise(resolve => {
    if (cache[name]) {
      resolve(cache[name]);
      return;
    }
    doRequest(name).then(rawBuffer => {
      ctx.decodeAudioData(
        rawBuffer,
        buffer => {
          cache[name] = buffer;
          resolve(buffer);
        },
        err => console.log(err)
      );
    });
  });
};

const getRateFromPitch = pitch => Math.pow(2, (pitch * 1.0) / 12);

const createSample = (ctx, filename, destination) => {
  let buffer;
  let bufferSource;

  loadBuffer(ctx, filename).then(ret => {
    buffer = ret;
  });

  const noteOn = (when, note) => {
    if (!buffer) {
      return;
    }
    bufferSource = ctx.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.connect(destination);
    bufferSource.playbackRate.setValueAtTime(
      getRateFromPitch(note.pitch),
      when
    );
    bufferSource.start(when);
  };

  return { noteOn };
};

export default createSample;
