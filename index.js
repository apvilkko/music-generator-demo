let audioContext;
let oscillatorNode;
let gainNode;
let playing = false;

const createAudioStuff = () => {
  audioContext = new AudioContext();
  if (!playing) {
    audioContext.suspend();
  }

  gainNode = audioContext.createGain();
  gainNode.gain = 0.2;
  gainNode.connect(audioContext.destination);

  oscillatorNode = audioContext.createOscillator();
  oscillatorNode.type = "sawtooth";
  oscillatorNode.frequency = 220;
  oscillatorNode.start(0);
  oscillatorNode.connect(gainNode);
};

const rand = (min, max) => Math.random() * (max - min) + min;

const tick = () => {
  setTimeout(() => {
    const freq = rand(50, 900);
    oscillatorNode.frequency.setValueAtTime(freq, audioContext.currentTime);
    tick();
  }, rand(100, 1500));
};

const setupListeners = () => {
  const playButton = document.getElementById("play");
  playButton.addEventListener(
    "click",
    () => {
      if (!playing) {
        audioContext.resume();
        playing = true;
      } else {
        audioContext.suspend();
        playing = false;
      }
    },
    false
  );
};

createAudioStuff();
setupListeners();
tick();
