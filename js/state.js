import { loadSave } from './save.js';

export const S = loadSave();

export const IN = { x: 0, y: 0, jumpBuf: 0, jumpHeld: false, diveHeld: false, diveBuf: 0, camDrag: 0 };

export const PL = {
  x: -2, y: 0, z: 2, vy: 0, yaw: 0,
  onG: true, wasG: true, jumps: 0, coyote: 0,
  speed: 4.4, vx: 0, vz: 0, slideV: 0, r: 0.46, squash: 0, climbing: null,
  swimming: false, wasSwim: false, submerged: false, swimPhase: 0,
  diving: false, stomping: false, sliding: 0, onSlide: false,
  swinging: null, flying: null, carry: false, launched: false,
};

export const G = {
  ready: false,
  started: false,
  paused: false,
  lock: false,
  time: 0,
  camYaw: Math.PI,
  camDrag: 0,
  shopCool: false,
  stepStarted: 0,
  got: 0,
  chooseOpen: false,
  chooseMiss: 0,
  chooseSay: '',
  review: null,
  talkLeft: [],
  lastGreet: {},
  splashCool: 0,
  notyetCool: 0,
  lastInput: 0,
  lastNudge: 0,
  nudges: 0,
  camLook: null,
  camLookUntil: 0,
  talkToken: 0,
  moved: 0,
  onEvent: () => {},
  burst: () => {},
  swingCool: 0,
  planeStep: 9999,
  rideDone: false,
};
