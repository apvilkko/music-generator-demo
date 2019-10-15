let listener;
let volumeListener;

const setupListeners = state => {
  const playButton = document.getElementById("play");
  if (listener) {
    playButton.removeEventListener("click", listener);
  }
  const play = () => {
    state.ctx.resume();
    state.playing = true;
    playButton.innerHTML = "Pause";
  };
  const pause = () => {
    state.ctx.suspend();
    state.playing = false;
    playButton.innerHTML = "Play";
  };
  listener = () => {
    if (!state.playing) {
      play();
    } else {
      pause();
    }
  };
  playButton.addEventListener("click", listener, false);

  const volumeInput = document.getElementById("volume");
  if (volumeListener) {
    volumeInput.removeEventListener("change", volumeListener);
  }
  volumeListener = evt => {
    const value = Number(evt.target.value) / 100.0;
    state.masterGain.gain.setValueAtTime(value, state.ctx.currentTime);
  };
  volumeInput.addEventListener("change", volumeListener, true);

  return { play, pause };
};

export default setupListeners;
