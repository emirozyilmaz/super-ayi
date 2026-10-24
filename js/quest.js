import { LINES, LESSON, WORD_TR, HATS, COLORS, categoryOf } from './lines.js';
import { writeSave, masteredCount, isKnown } from './save.js';
import { S, G, PL } from './state.js';
import { say, sfx, hush, canAmbient } from './audio.js';
import { cheerBear, setHat } from './bear.js';
import { dropFruit, faceAnimal, placeAnimal, sendAnimal } from './world.js';
import { AIRFIELD } from './toys.js';
import {
  itemIcon, cardIcon, jumpSvg, archSvg, bubbleSvg, heartSvg, earSvg, starSvg, ringSvg, planeSvg,
  balloonSvg, hideSvg, NUMBER_WORDS,
} from './icons.js';
import { placeBalloons, addBalloon, releaseBalloons, aliveBalloons } from './balloons.js';
import { hideAnimal, revealAnimal } from './hide.js';
import { freeSpot } from './spots.js';
import { unlockStickers } from './album.js';
import { wantsSpeak, speakPractice } from './speak.js';
import { dayKey } from './stats.js';

const $ = (id) => document.getElementById(id);

export const STEPS = [
  { type: 'talk', ids: ['hello', 'garden'] },
  { type: 'jump-practice', say: 'do-jump' },
  { type: 'reach', say: 'follow' },
  { type: 'collect', word: 'red', count: 2, say: 'find-red' },
  { type: 'choose', word: 'red', say: 'show-red' },
  { type: 'collect', word: 'apple', count: 2, say: 'find-apple' },
  { type: 'choose', word: 'apple', say: 'show-apple' },
  { type: 'rescue', index: 0, word: 'red', say: 'magic-red' },
  { type: 'collect', word: 'blue', count: 2, say: 'find-blue' },
  { type: 'choose', word: 'blue', say: 'show-blue' },
  { type: 'collect', word: 'banana', count: 2, say: 'find-banana' },
  { type: 'choose', word: 'banana', say: 'show-banana' },
  { type: 'rescue', index: 1, word: 'banana', say: 'magic-banana', keep: true },
  { type: 'collect', word: 'yellow', count: 2, say: 'find-yellow' },
  { type: 'choose', word: 'yellow', say: 'show-yellow' },
  { type: 'jump-high', say: 'climb-jump' },
  { type: 'jump-choose', say: 'show-jump' },
  { type: 'choose', word: 'red', say: 'show-red', keep: true },
  { type: 'rescue', index: 2, word: 'yellow', say: 'magic-yellow', keep: true },
  // Chapter 2 — Colors & Animals in the garden and lagoon!
  { type: 'collect', word: 'green', count: 2, say: 'find-green' },
  { type: 'choose', word: 'green', say: 'show-green' },
  { type: 'animal', word: 'cat', say: 'find-cat' },
  { type: 'choose', word: 'cat', say: 'show-cat' },
  { type: 'collect', word: 'orange', count: 2, say: 'find-orange' },
  { type: 'choose', word: 'orange', say: 'show-orange' },
  { type: 'animal', word: 'duck', say: 'find-duck' },
  { type: 'choose', word: 'duck', say: 'show-duck' },
  { type: 'collect', word: 'purple', count: 2, say: 'find-purple' },
  { type: 'choose', word: 'purple', say: 'show-purple' },
  { type: 'animal', word: 'frog', say: 'find-frog' },
  { type: 'choose', word: 'frog', say: 'show-frog' },
  // Chapter 3 — the Sky Park: slide, swing and the little plane!
  { type: 'ride', ride: 'slide', event: 'slide', word: 'slide', say: 'find-slide' },
  { type: 'choose', word: 'slide', say: 'show-slide' },
  { type: 'ride', ride: 'swing', event: 'swing', word: 'swing', say: 'find-swing' },
  { type: 'choose', word: 'swing', say: 'show-swing' },
  { type: 'ride', ride: 'plane', event: 'board', word: 'plane', say: 'find-plane', immediate: true },
  { type: 'fly', word: 'plane', count: 5, say: 'fly-rings' },
  { type: 'land', say: 'land-plane' },
  { type: 'choose', word: 'plane', say: 'show-plane' },
  // Chapter 4 — the Balloon Festival: numbers one to five, and colours in a new place.
  // (Step 39 is the first new step; save.js moves finished games here.)
  { type: 'balloons', mode: 'color', word: 'red', say: 'pop-red', intro: 'balloon-party' },
  { type: 'balloons', mode: 'count', count: 1, word: 'one', say: 'pop-one' },
  { type: 'choose', word: 'one', say: 'show-one' },
  { type: 'balloons', mode: 'count', count: 2, word: 'two', say: 'pop-two' },
  { type: 'choose', word: 'two', say: 'show-two' },
  { type: 'balloons', mode: 'color', word: 'blue', say: 'pop-blue' },
  { type: 'balloons', mode: 'count', count: 3, word: 'three', say: 'pop-three' },
  { type: 'choose', word: 'three', say: 'show-three' },
  { type: 'balloons', mode: 'count', count: 4, word: 'four', say: 'pop-four' },
  { type: 'choose', word: 'four', say: 'show-four' },
  { type: 'balloons', mode: 'color', word: 'purple', say: 'pop-purple' },
  { type: 'balloons', mode: 'count', count: 5, word: 'five', say: 'pop-five' },
  { type: 'choose', word: 'five', say: 'show-five' },
  // Chapter 5 — Hide and Seek: four new animal friends.
  { type: 'hide', word: 'rabbit', say: 'where-rabbit', intro: 'hide-seek' },
  { type: 'choose', word: 'rabbit', say: 'show-rabbit' },
  { type: 'hide', word: 'bird', say: 'where-bird' },
  { type: 'choose', word: 'bird', say: 'show-bird' },
  { type: 'hide', word: 'fox', say: 'where-fox' },
  { type: 'choose', word: 'fox', say: 'show-fox' },
  { type: 'hide', word: 'chicken', say: 'where-chicken' },
  { type: 'choose', word: 'chicken', say: 'show-chicken' },
  { type: 'done', say: 'all-done' },
];

let world = null;
let bear = null;
let onHud = () => {};
let fx = { collect() {}, pop() {}, cheer() {}, finale() {} };

export function bindQuest(w, b, hud, effects) {
  world = w;
  bear = b;
  onHud = hud;
  G.onEvent = onToyEvent;
  G.planeStep = STEPS.findIndex((s) => s.type === 'ride' && s.ride === 'plane');
  if (effects) fx = effects;
  if (world.balloons) world.balloons.onPop = balloonPopped;
}

function step() { return STEPS[Math.min(S.quest, STEPS.length - 1)]; }

/*
 * Quest timers run on the game clock (G.time stops while paused), so nothing
 * advances behind the pause screen. Drained by tickQuest every unpaused frame.
 */
const timers = [];
function later(fn, ms) { timers.push({ at: G.time + ms / 1000, fn }); }
function runTimers() {
  for (let i = timers.length - 1; i >= 0; i--) {
    if (G.time < timers[i].at) continue;
    const { fn } = timers.splice(i, 1)[0];
    fn();
  }
}

/** After a pause: say again what was cut off, so the child knows where they were. */
export function resumeQuest() {
  if (G.talkLeft.length && !$('dlg').classList.contains('hidden')) showTalkLine();
  else if (G.chooseOpen) replayInstruction();
  else if (!G.lock && step().say && ROAMING.includes(step().type)) say(step().say);
}

/** A later() call that moves the quest on is waiting (the step is finishing). */
function finishing() { return timers.length > 0; }

const WORD_COL = {
  red: COLORS.red, blue: COLORS.blue, yellow: COLORS.yellow,
  green: COLORS.green, orange: COLORS.orange, purple: COLORS.purple,
  apple: COLORS.red, banana: COLORS.yellow, jump: 0xffc107,
  cat: 0xffb74d, duck: 0xffe082, frog: 0x66bb6a,
  slide: 0xff7043, swing: 0xe53935, plane: 0x4fc3f7,
  rabbit: 0xf8bbd0, bird: 0x4fc3f7, fox: 0xff7a1f, chicken: 0xff3b3b,
  one: 0xe53935, two: 0xfb8c00, three: 0x43a047, four: 0x1e88e5, five: 0x8e24aa,
};
const ROAMING = ['jump-practice', 'reach', 'collect', 'rescue', 'jump-high', 'jump-choose', 'animal', 'ride', 'fly', 'land', 'balloons', 'hide'];
const BALLOON_COLS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

function setHint(kind) {
  G.hint = kind;
  G.hintX = PL.x;
  G.hintZ = PL.z;
  const el = $('hint');
  el.className = kind || 'hidden';
  $('btnJump').classList.toggle('pulse', kind === 'jump');
}

function lookAtTarget() {
  const t = guideTarget();
  if (!t) return;
  G.camLook = t;
  G.camLookUntil = G.time + 2.2;
}

/** A step whose work is already done (the game was closed between finishing it and moving on). */
function alreadyDone(st) {
  // The plane is parked: landing is done.
  if (st.type === 'land' && !PL.flying) return true;
  // The friend was freed (S.rescues is saved at once, the next step 0.7 s later).
  if (st.type === 'rescue' && S.rescues > st.index) return true;
  return false;
}

export function beginStep() {
  while (S.quest < STEPS.length - 1 && alreadyDone(step())) {
    S.quest += 1;
    writeSave(S);
  }
  const st = step();
  G.got = 0;
  G.rideDone = false;
  G.rideReady = 0;
  G.stepStarted = G.time;
  G.lastNudge = G.time;
  G.nudges = 0;
  G.chooseOpen = false;
  G.chooseMiss = 0;
  world.choosePads.forEach((p) => { p.mesh.visible = false; p.shown = false; });
  setHint(null);
  if (st.type === 'talk') {
    const lila = world.lila;
    if (!lila.wander) {
      placeAnimal(lila, PL.x - 2.6, PL.z + 2.4, PL.x, PL.z);
      faceAnimal(lila, PL.x, PL.z);
    }
    openTalk(st.ids);
    paintHud();
    return;
  }
  if (st.type === 'reach' && world.lila.x < 12) sendAnimal(world.lila, 17, 1.2, 3.4);
  if (st.type === 'balloons') startBalloons(st);
  if (st.type === 'hide') startHide(st);
  if (st.type === 'choose') openChoose(st);
  else if (st.intro) say(st.intro).then(() => { if (step() === st && !G.paused && !G.chooseOpen) say(st.say); });
  else if (st.say) say(st.say);
  if (st.type === 'jump-choose') {
    world.choosePads.forEach((p) => { p.mesh.visible = true; p.shown = true; });
  }
  if (st.type === 'jump-practice') setHint('jump');
  if (st.type === 'reach') setHint('joy');
  lookAtTarget();
  paintHud();
}

/** Called every frame: reminders when the child is stuck, and hint cleanup. */
export function tickQuest() {
  if (G.paused) return;
  runTimers();
  const st = step();
  if (G.lock) return;
  if (G.hint === 'joy' && Math.hypot(PL.x - G.hintX, PL.z - G.hintZ) > 2.5) setHint(null);
  if (st.type === 'ride' && G.rideDone) {
    // The ride counts as soon as it happens; the next step waits until the bear is back on the ground.
    if (!PL.swinging && !PL.flying && !PL.onSlide && PL.onG) {
      G.rideReady = G.rideReady || G.time + 0.7;
      if (G.time >= G.rideReady) { G.rideDone = false; G.rideReady = 0; advance(); }
    } else G.rideReady = 0;
    return;
  }
  if (PL.swinging || PL.onSlide || PL.flying) return;
  const toLila = st.type === 'done' && !S.finished;
  if (!ROAMING.includes(st.type) && !toLila) return;
  const wait = G.nudges ? 18 : 13;
  if (G.time - G.lastNudge < wait) return;
  G.lastNudge = G.time;
  G.nudges += 1;
  lookAtTarget();
  const t = guideTarget();
  const close = t && Math.hypot(t.x - PL.x, t.z - PL.z) < 6;
  if (st.type === 'jump-practice') say(st.say);
  else if (close) say('over-here');
  else if (toLila) say('follow');
  else say(G.nudges % 2 ? st.say : 'follow');
  if (st.type === 'jump-practice') setHint('jump');
  const m = $('mission');
  m.classList.remove('nudge');
  void m.offsetWidth;
  m.classList.add('nudge');
}

/** Tapping the mission card repeats what to do. */
export function replayInstruction() {
  const st = step();
  if (G.chooseOpen && G.chooseSay) say(G.chooseSay, { tr: true });
  else if (st.type === 'talk' && G.talkLeft.length) showTalkLine({ tr: true });
  else if (st.say) say(st.say, { tr: true });
}

function paintHud() {
  const st = step();
  let icons = [];
  let word = '';
  if (st.type === 'talk') icons = [{ svg: heartSvg(), on: true }];
  else if (st.type === 'jump-practice') { icons = [{ svg: jumpSvg(), on: true }]; word = 'jump'; }
  else if (st.type === 'reach') { icons = [{ svg: archSvg(), on: true }]; word = 'garden'; }
  else if (st.type === 'collect') {
    for (let i = 0; i < st.count; i++) icons.push({ svg: itemIcon(st.word), on: i < G.got });
    word = st.word;
  } else if (st.type === 'animal') {
    icons = [{ svg: itemIcon(st.word), on: false }];
    word = st.word;
  } else if (st.type === 'choose') icons = [{ svg: earSvg(), on: true }];
  else if (st.type === 'rescue') icons = [{ svg: bubbleSvg(), on: true }];
  else if (st.type === 'jump-high') { icons = [{ svg: jumpSvg(), on: true }]; word = 'jump'; }
  else if (st.type === 'jump-choose') { icons = [{ svg: starSvg(), on: true }]; word = 'jump'; }
  else if (st.type === 'ride') { icons = [{ svg: itemIcon(st.word), on: true }]; word = st.word; }
  else if (st.type === 'fly') {
    for (let i = 0; i < st.count; i++) icons.push({ svg: ringSvg(i < G.got), on: i < G.got });
    word = 'fly';
  } else if (st.type === 'land') { icons = [{ svg: planeSvg(), on: true }]; word = 'land'; }
  else if (st.type === 'balloons' && st.mode === 'color') {
    icons = [{ svg: balloonSvg(COLORS[st.word], G.got > 0), on: true }];
    word = st.word;
  } else if (st.type === 'balloons') {
    for (let i = 0; i < st.count; i++) icons.push({ svg: balloonSvg(COLORS[BALLOON_COLS[i]], i < G.got), on: i < G.got });
    word = st.word;
  } else if (st.type === 'hide') {
    icons = [{ svg: G.hideFound ? itemIcon(st.word) : hideSvg(), on: true }];
    word = st.word;
  } else if (st.type === 'done') { icons = [{ svg: heartSvg(), on: true }]; word = 'yay'; }
  $('misIcons').innerHTML = icons
    .map((c, i) => `<span class="ico${c.on ? '' : ' empty'}" data-i="${i}">${c.svg}</span>`)
    .join('');
  $('misWord').textContent = word;
  onHud();
}

export function refreshHud() { paintHud(); }

/** Events from the swing, slide and plane: 'slide' 'swing' 'board' 'ring' 'lap' 'landed' 'flip' 'hud'. */
function onToyEvent(name, data) {
  if (name === 'hud') { onHud(); return; }
  const st = step();
  if (st.type === 'ride' && st.event === name && !G.rideDone) {
    mark(st.word, 'found');
    mark(st.word, 'heard');
    floatWord(st.word);
    say(st.word);
    sfx.collect();
    if (st.immediate) { later(() => { if (step() === st) advance(); }, 900); return; }
    G.rideDone = true;
    return;
  }
  if (st.type === 'fly') {
    if (name === 'board') { G.got = 0; paintHud(); return; }
    if (name === 'ring') {
      G.got = Math.max(G.got, data + 1);
      paintHud();
      if (G.got >= st.count) later(() => { if (step() === st) advance(); }, 1700);
    }
    return;
  }
  if (st.type === 'land' && name === 'landed') {
    later(() => { if (step() === st) advance(); }, 600);
  }
}

/** For other modules (word of the day): update a word's learning stats. */
export function markWord(word, field) { mark(word, field); }

function mark(word, field) {
  if (!LESSON.includes(word)) return;
  const w = S.words[word];
  const before = mastered(word);
  w[field] = true;
  writeSave(S);
  // Found and picked right on the first try: the word's sticker goes into the album.
  if (!before && mastered(word)) {
    w.learnedAt = Date.now(); // for the weekly report
    writeSave(S);
    unlockStickers([word]);
  }
}

function advance() {
  S.quest = Math.min(STEPS.length - 1, S.quest + 1);
  writeSave(S);
  sfx.star();
  cheerBear(bear);
  fx.cheer();
  beginStep();
}

function openTalk(ids) {
  G.lock = true;
  G.talkLeft = ids.slice();
  showTalkLine();
  $('dlg').classList.remove('hidden');
}

function showTalkLine(opts) {
  const id = G.talkLeft[0];
  const pair = LINES[id] || ['...', ''];
  $('dlgName').textContent = 'Lila';
  $('dlgText').textContent = pair[0];
  $('dlgTr').textContent = S.turkish ? pair[1] : '';
  const token = ++G.talkToken;
  const t0 = performance.now();
  say(id, opts).then((ok) => {
    // Cut off (replay, pause, mute): whoever cut it off decides what comes next.
    if (!ok && token !== G.talkToken) return;
    const wait = performance.now() - t0 < 400 ? 2600 : 700;
    later(() => {
      if (token === G.talkToken && G.talkLeft.length) nextTalk();
    }, wait);
  });
}

export function nextTalk() {
  if (!G.talkLeft.length) return;
  G.talkToken++;
  sfx.click();
  G.talkLeft.shift();
  if (G.talkLeft.length) showTalkLine();
  else {
    $('dlg').classList.add('hidden');
    G.lock = false;
    advance();
  }
}

/** Fisher–Yates; the right card must not always sit in the same place. */
function shuffled(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * The right card plus up to two from the same group. Words the child has already met are
 * preferred as distractors: telling known words apart is the useful practice.
 */
function cardOptions(word) {
  const met = (w) => S.words[w] && (S.words[w].heard || S.words[w].found);
  const others = shuffled(categoryOf(word).filter((w) => w !== word))
    .sort((a, b) => Number(met(b)) - Number(met(a)));
  return shuffled([word, ...others.slice(0, 2)]);
}

/*
 * Daily review: on the first play of each day, a short warm-up of up to three words the child
 * has already been taught (weakest first) comes before the quest carries on where it left off.
 */
const REVIEW_SIZE = 3;

const today = () => dayKey();

function weakness(word) {
  const w = S.words[word];
  return (w.chosen ? 0 : 2) + (isKnown(S, word) ? 0 : 1);
}

function reviewWords() {
  // 'jump' is practised on the star pads, not on cards.
  const taught = LESSON.filter((w) => w !== 'jump' && S.words[w] && S.words[w].found && LINES[`show-${w}`]);
  return shuffled(taught).sort((a, b) => weakness(b) - weakness(a)).slice(0, REVIEW_SIZE);
}

/** Start of a play session: today's review if it is due, then the current quest step. */
export function startSession(forceReview) {
  const words = reviewWords();
  if ((forceReview || S.reviewDay !== today()) && words.length >= 2) {
    G.review = { words, i: 0 };
    paintHud();
    openReview();
  } else beginStep();
}

function openReview() {
  const word = G.review.words[G.review.i];
  openChoose({ type: 'review', word, say: `show-${word}`, keep: true });
}

function nextReview() {
  G.review.i += 1;
  if (G.review.i < G.review.words.length) { openReview(); return; }
  G.review = null;
  S.reviewDay = today();
  writeSave(S);
  sfx.star();
  cheerBear(bear);
  fx.cheer();
  beginStep();
}

/** Only a first-try answer counts as "chosen" (mastered); after a miss it is just practice. */
function markAnswer(word, keep) {
  recordAnswer(word, G.chooseMiss === 0, keep);
}

const mastered = (word) => !!(S.words[word] && S.words[word].found && S.words[word].chosen);

/** One answer to a word question (cards, star pads, album quiz). A new sticker is announced. */
export function recordAnswer(word, firstTry, keep) {
  const w = S.words[word];
  if (!w) return;
  w.streak = firstTry ? (w.streak || 0) + 1 : 0;
  if (!firstTry) w.misses = (w.misses || 0) + 1; // the report lists the hardest words
  if (firstTry) mark(word, 'chosen');
  else writeSave(S);
  if (keep) mark(word, 'kept');
}

/** After a right card: sometimes a "your turn" speaking moment, then the next step. */
function afterAnswer(st) {
  if (st.word && wantsSpeak(st.word)) {
    G.lock = true;
    later(() => {
      speakPractice(st.word).then(() => {
        G.lock = false;
        if (step() === st) advance();
      });
    }, 650);
    return;
  }
  later(() => { if (step() === st) advance(); }, 700);
}

function openChoose(st) {
  say(st.say);
  G.lock = true;
  G.chooseOpen = true;
  G.chooseSay = st.say;
  G.chooseMiss = 0;
  const line = (LINES[st.say] || ['?'])[0];
  $('chooseTitle').textContent = st.type === 'review' ? `🔁 ${G.review.i + 1}/${G.review.words.length} · ${line}` : line;
  const box = $('chooseCards');
  box.innerHTML = '';
  cardOptions(st.word).forEach((opt) => {
    const b = document.createElement('button');
    b.className = 'card';
    b.type = 'button';
    b.dataset.word = opt;
    b.innerHTML = `<span class="card-ico">${cardIcon(opt)}</span><span class="card-en" lang="en">${opt}</span>`;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!G.chooseOpen) return;
      if (opt === st.word) {
        G.chooseOpen = false;
        b.classList.add('good');
        sfx.collect();
        markAnswer(st.word, st.keep);
        floatWord(st.word);
        say('great');
        $('choose').classList.add('hidden');
        // Between review cards nothing else may happen: the current step has not begun yet.
        G.lock = st.type === 'review';
        if (st.type === 'rescue') popBubble(st.index);
        if (st.type === 'review') later(() => nextReview(), 700);
        else afterAnswer(st);
      } else {
        b.classList.remove('bad');
        void b.offsetWidth;
        b.classList.add('bad');
        sfx.wrong();
        G.chooseMiss += 1;
        if (G.chooseMiss >= 2) {
          // Two misses: show the right card and say the word again, so the child is never stuck.
          box.querySelector(`.card[data-word="${st.word}"]`)?.classList.add('help');
          say(st.say);
        } else {
          say(LINES[`thats-${opt}`] ? `thats-${opt}` : 'try-again');
        }
      }
    });
    box.appendChild(b);
  });
  $('choose').classList.remove('hidden');
}

function popBubble(index) {
  const b = world.bubbles[index];
  if (!b || b.popped) return;
  b.popped = true;
  b.mesh.visible = false;
  S.rescues = Math.max(S.rescues, index + 1);
  writeSave(S);
  sfx.pop();
  fx.pop(b);
  say('thanks');
}

function floatWord(word) {
  const el = $('floaty');
  const tr = S.turkish && WORD_TR[word] && !isKnown(S, word) ? `<small>${WORD_TR[word]}</small>` : '';
  el.innerHTML = `<span class="ico">${itemIcon(word)}</span>${word.toUpperCase()}${tr}`;
  el.classList.remove('hidden');
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
}

function wantedItems(word) {
  return world.items
    .filter((it) => it.alive && it.word === word && (it.kind === 'flower' || it.kind === 'fruit'))
    .map((it) => ({ it, d: Math.hypot(it.x - PL.x, it.z - PL.z) }))
    .sort((a, b) => a.d - b.d)
    .map((e) => e.it);
}

/* ---- Chapter 4: balloons ---------------------------------------------------------------- */

function startBalloons(st) {
  G.stepDone = false;
  let words;
  if (st.mode === 'color') {
    const others = shuffled(BALLOON_COLS.filter((c) => c !== st.word)).slice(0, 3);
    words = shuffled([st.word, ...others]);
  } else {
    words = Array.from({ length: st.count + 2 }, () => BALLOON_COLS[Math.floor(Math.random() * 6)]);
  }
  placeBalloons(world.balloons, world, PL, words);
}

function balloonPopped(b) {
  const st = step();
  sfx.pop();
  G.burst(b.x, b.y, b.z, COLORS[b.word]);
  if (st.type !== 'balloons' || G.stepDone) return;
  G.lastNudge = G.time;
  if (st.mode === 'color') {
    if (b.word !== st.word) {
      sfx.wrong();
      say(LINES[`thats-${b.word}`] ? `thats-${b.word}` : 'try-again');
      later(() => { if (step() === st && !G.stepDone) addBalloon(world.balloons, world, PL, b.word); }, 1500);
      return;
    }
    G.got = 1;
    finishBalloons(st, st.word);
    say(st.word);
    return;
  }
  // Count mode: every pop is counted out loud.
  G.got += 1;
  const n = NUMBER_WORDS[G.got - 1];
  if (n) {
    mark(n, 'heard');
    say(n);
  }
  paintHud();
  if (G.got >= st.count) finishBalloons(st, st.word);
}

function finishBalloons(st, word) {
  G.stepDone = true;
  mark(word, 'heard');
  mark(word, 'found');
  floatWord(word);
  sfx.collect();
  paintHud();
  later(() => {
    releaseBalloons(world.balloons);
    if (step() === st) advance();
  }, 1500);
}

/* ---- Chapter 5: hide and seek ------------------------------------------------------------ */

function startHide(st) {
  G.hideFound = false;
  G.hideSpot = null;
  const an = world.animals.find((a) => a.word === st.word && !a.npc);
  if (!an || !world.hideBush) return;
  let spot = freeSpot(world, PL, 10, 20, 1.6) || freeSpot(world, PL, 6, 26, 1.0);
  if (!spot) {
    // Fallback: the animal's own place, or if that is too close, its walking path's far end.
    const far = (an.saved && an.saved.wander || an.wander || []).map(([x, z]) => ({ x, z }))
      .concat([{ x: an.homeX, z: an.homeZ }, { x: an.x, z: an.z }])
      .sort((a, b) => Math.hypot(b.x - PL.x, b.z - PL.z) - Math.hypot(a.x - PL.x, a.z - PL.z))[0];
    spot = far;
  }
  G.hideSpot = spot;
  hideAnimal(world.hideBush, an, spot, PL);
}

function foundHidden(st) {
  G.hideFound = true;
  revealAnimal(world.hideBush);
  mark(st.word, 'heard');
  mark(st.word, 'found');
  floatWord(st.word);
  sfx.collect();
  fx.cheer();
  paintHud();
  say('peekaboo').then((ok) => { if (ok && step() === st) say(st.word); });
  later(() => { if (step() === st) advance(); }, 3200);
}

/** Where the butterfly should lead: { x, z, y, gy, color } or null. */
export function guideTarget() {
  const st = step();
  if (G.lock || G.chooseOpen) return null;
  if (st.type === 'reach') return { x: world.gate.x, z: world.gate.z, y: 1.8, gy: 0, color: 0xab47bc };
  if (st.type === 'collect') {
    const best = wantedItems(st.word)[0];
    return best ? { x: best.x, z: best.z, y: best.y, gy: 0, color: WORD_COL[st.word] } : null;
  }
  if (st.type === 'animal') {
    const an = world.animals.find((a) => a.word === st.word && !a.npc);
    return an ? { x: an.x, z: an.z, y: 1.1, gy: 0, color: WORD_COL[st.word] || 0xffca28 } : null;
  }
  if (st.type === 'rescue') {
    const b = world.bubbles[st.index];
    if (b && !b.popped) return { x: b.x, z: b.z, y: b.y, gy: b.y > 2 ? 3.05 : 0, color: 0xce93d8 };
  }
  if (st.type === 'jump-high') {
    if (PL.y > 2.4) return { x: world.highPad.x, z: world.highPad.z, y: 3.3, gy: 3.3, color: 0xffc107 };
    return { x: world.vine.x, z: world.vine.z, y: 1.6, gy: 0, color: 0x66bb6a };
  }
  if (st.type === 'jump-choose') {
    const p = world.choosePads.find((q) => q.word === 'jump');
    return { x: p.x, z: p.z, y: 0.4, gy: 0, color: 0xffc107 };
  }
  if (st.type === 'ride') {
    if (st.ride === 'slide') {
      const sl = world.slide;
      if (PL.y > 1.0 || PL.onSlide) return { x: sl.xTop - 0.3, z: sl.z, y: sl.yTop + 0.2, gy: sl.yTop, color: 0xffc107 };
      return { x: 17.5, z: -4.4, y: 0.6, gy: 0, color: 0xff7043 };
    }
    if (st.ride === 'swing') {
      const sw = world.toys.swings[0];
      return { x: sw.x, z: sw.z, y: 1.2, gy: 0, color: 0xe53935 };
    }
    if (st.ride === 'plane') return { x: AIRFIELD.pad.x, z: AIRFIELD.pad.z, y: 1.2, gy: 0, color: 0xffd54f };
  }
  if (st.type === 'fly') {
    const fl = world.toys.fl;
    if (!fl) return { x: AIRFIELD.pad.x, z: AIRFIELD.pad.z, y: 1.2, gy: 0, color: 0xffd54f };
    const r = world.toys.rings[Math.min(fl.ringNext, world.toys.rings.length - 1)];
    return { x: r.x, z: r.z, y: r.y - 1.4, gy: r.y - 4.5, color: 0xffd54f };
  }
  if (st.type === 'land') return { x: AIRFIELD.x0 + 6, z: AIRFIELD.z, y: 1, gy: 0, color: 0x4fc3f7 };
  if (st.type === 'balloons' && world.balloons) {
    const left = aliveBalloons(world.balloons).filter((b) => st.mode !== 'color' || b.word === st.word);
    left.sort((a, b) => Math.hypot(a.x - PL.x, a.z - PL.z) - Math.hypot(b.x - PL.x, b.z - PL.z));
    const b = left[0];
    if (b) return { x: b.x, z: b.z, y: b.base + 1.0, gy: 0, color: COLORS[b.word] };
  }
  if (st.type === 'hide' && G.hideSpot && !G.hideFound) {
    // Seeking is the game: the butterfly only helps after a while.
    if (G.time - G.stepStarted < 9) return null;
    return { x: G.hideSpot.x, z: G.hideSpot.z, y: 1.4, gy: 0, color: WORD_COL[st.word] || 0x66bb6a };
  }
  if (st.type === 'done' && !S.finished) return { x: world.lila.x, z: world.lila.z, y: 1.3, gy: 0, color: 0xec407a };
  return null;
}

/** Items to ring on the ground during a collect step. */
export function guideMarks() {
  const st = step();
  if (st.type !== 'collect' || G.lock) return [];
  return wantedItems(st.word).slice(0, 12).map((it) => {
    it.hl = WORD_COL[st.word];
    return it;
  });
}

export function interact() {
  const st = step();
  if (G.lock || G.paused) return;

  world.bands.forEach((b) => {
    const inside = Math.abs(PL.x - b.x) < b.w && Math.abs(PL.z - b.z) < b.d;
    if (inside && !b.inside) {
      b.inside = true;
      say(b.id, { soft: true });
      if (LESSON.includes(b.id)) mark(b.id, 'heard');
    } else if (!inside) b.inside = false;
  });

  if (st.type === 'hide' && G.hideSpot && !G.hideFound && Math.hypot(PL.x - G.hideSpot.x, PL.z - G.hideSpot.z) < 2.1) {
    foundHidden(st);
    return;
  }
  if (st.type === 'jump-practice' && PL.jumps > 0) {
    mark('jump', 'heard');
    floatWord('jump');
    advance();
    return;
  }
  if (st.type === 'done' && !S.finished && Math.hypot(PL.x - world.lila.x, PL.z - world.lila.z) < 2.4) {
    openFinale();
    return;
  }
  if (st.type === 'reach' && Math.hypot(PL.x - world.gate.x, PL.z - world.gate.z) < world.gate.r) {
    say('wow');
    advance();
    return;
  }

  world.items.forEach((it) => {
    if (!it.alive) return;
    const d = Math.hypot(PL.x - it.x, PL.z - it.z);
    if (it.kind === 'fruit' && d < 1.35 && Math.abs((PL.y + 0.8) - it.y) < 1.6) {
      takeFruit(it, st);
    } else if (it.kind === 'flower' && d < 1.25 && PL.y < 1.2) {
      takeFlower(it, st);
    } else if (it.kind === 'coin' && d < 1.05 && Math.abs((PL.y + 0.55) - it.y) < 1.15) {
      it.alive = false;
      it.mesh.visible = false;
      S.coins += 1;
      writeSave(S);
      sfx.coin();
    } else if (it.kind === 'bush' && d < 1.25 && PL.y < 1.4) {
      popBush(it);
    } else if (it.kind === 'mushroom' && d < 0.95 && PL.y > 0.45 && PL.vy < 0) {
      stompMushroom(it);
    } else if (it.kind === 'crate' && d < 1.05 && (PL.stomping || PL.diving || PL.sliding > 0 || (PL.y > 0.4 && PL.vy < -1))) {
      it.alive = false;
      it.mesh.visible = false;
      it.respawn = G.time + 12;
      if (PL.vy < 0 && !PL.stomping) { PL.vy = 5.8; PL.launched = true; }
      S.coins += 3;
      writeSave(S);
      sfx.coin();
      say('smash', { soft: true });
      fx.collect(it, -1);
      onHud();
    } else if (it.kind === 'secret-hat' && d < 1.3 && PL.y < 1.5) {
      it.alive = false;
      it.mesh.visible = false;
      if (!S.hats.includes('yellow')) S.hats.push('yellow');
      S.hat = 'yellow';
      S.outfit = Object.assign({ hat: null, eyes: null, back: null }, S.outfit, { hat: 'yellow' });
      S.coins += 6;
      setHat(bear, S.outfit);
      writeSave(S);
      sfx.star();
      say('secret');
      floatWord('yellow');
    }
  });

  if (st.type === 'animal') {
    const an = world.animals.find((a) => a.word === st.word && !a.npc);
    if (an && Math.hypot(PL.x - an.x, PL.z - an.z) < 2.3) {
      if (!an.duck) faceAnimal(an, PL.x, PL.z);
      mark(st.word, 'found');
      mark(st.word, 'heard');
      floatWord(st.word);
      say(st.word);
      sfx.collect();
      G.lock = true;
      later(() => {
        G.lock = false;
        if (step() === st) advance();
      }, 1300);
      return;
    }
  }

  if (st.type === 'collect') {
    /* counting happens in takeFruit / takeFlower */
  }
  if (st.type === 'rescue') {
    const b = world.bubbles[st.index];
    if (b && !b.popped && Math.hypot(PL.x - b.x, PL.z - b.z) < 1.8 && Math.abs(PL.y - (b.y - 1)) < 2.2) {
      openChoose(st);
    }
  }
  world.bubbles.forEach((b) => {
    if (b.popped) return;
    if (st.type === 'rescue' && st.index === b.index) return;
    if (Math.hypot(PL.x - b.x, PL.z - b.z) < 1.7 && G.time > G.notyetCool) {
      G.notyetCool = G.time + 3.5;
      say('notyet');
    }
  });

  if (st.type === 'jump-high' && PL.onG && Math.hypot(PL.x - world.highPad.x, PL.z - world.highPad.z) < 1.5 && PL.y > 2.4) {
    mark('jump', 'found');
    floatWord('jump');
    say('great');
    advance();
  }
  if (st.type === 'jump-choose' && PL.onG && PL.y < 1.2) {
    world.choosePads.forEach((p) => {
      if (!p.shown) return;
      if (Math.hypot(PL.x - p.x, PL.z - p.z) < 0.95) {
        if (p.word === 'jump') {
          markAnswer('jump', false);
          floatWord('jump');
          say('great');
          advance();
        } else if (G.time > (p.cool || 0)) {
          p.cool = G.time + 1.4;
          G.chooseMiss += 1;
          sfx.wrong();
          say(LINES[`thats-${p.word}`] ? `thats-${p.word}` : 'try-again');
        }
      }
    });
  }

  const shopD = Math.hypot(PL.x - world.shop.x, PL.z - world.shop.z);
  // Not while a step is finishing: its next step would open under the shop.
  if (shopD < world.shop.r && !G.shopCool && !finishing()) {
    G.shopCool = true;
    openShop();
  } else if (shopD > world.shop.r + 1.4) G.shopCool = false;

  // Ambient animal greetings: only when quiet, close, and not mid-quest UI.
  // Wave always; speak at most one soft line with a long cooldown so EN+TR can finish.
  if (!G.chooseOpen && !G.lock && canAmbient()) {
    let greeted = false;
    world.animals.forEach((an) => {
      if (greeted) return;
      const d = Math.hypot(PL.x - an.x, PL.z - an.z);
      if (d > 1.7 || G.time < an.cool) return;
      an.cool = G.time + 18;
      if (!an.duck) faceAnimal(an, PL.x, PL.z);
      else if (an.duck) { /* duck just bobbles */ }
      say(an.line, { soft: true });
      greeted = true;
    });
  }
}

function countCollect(it, st) {
  const questHit = st.type === 'collect' && st.word === it.word;
  if (questHit) {
    G.got += 1;
    G.lastNudge = G.time;
    mark(it.word, 'found');
    mark(it.word, 'heard');
    floatWord(it.word);
    say(it.word);
    sfx.collect();
    paintHud();
    fx.collect(it, G.got - 1);
    if (G.got >= st.count) {
      G.lock = true;
      later(() => {
        G.lock = false;
        if (step() === st) advance();
      }, 1400);
    }
    return true;
  }
  if (st.type === 'collect') {
    sfx.wrong();
    say(LINES[`thats-${it.word}`] ? `thats-${it.word}` : 'try-again');
    return false;
  }
  markHeardMaybe(it.word);
  say(it.word, { soft: true });
  sfx.collect();
  fx.collect(it, -1);
  return false;
}

function markHeardMaybe(word) {
  if (LESSON.includes(word)) mark(word, 'heard');
}

function takeFruit(it, st) {
  if (it.y > 1.05) {
    dropFruit(it);
    if (PL.y < 0.4) return;
  }
  it.alive = false;
  it.mesh.visible = false;
  it.respawn = G.time + 14;
  countCollect(it, st);
}

function takeFlower(it, st) {
  it.alive = false;
  it.mesh.visible = false;
  it.respawn = G.time + 16;
  countCollect(it, st);
}

function popBush(it) {
  it.alive = false;
  it.mesh.visible = false;
  it.respawn = G.time + 40;
  if (it.obstacle) it.obstacle.off = true;
  sfx.pop();
  spawnBonusCoin(it.x + 0.45, it.z);
  spawnBonusCoin(it.x - 0.35, it.z + 0.35);
}

function spawnBonusCoin(x, z) {
  const mesh = world.items.find((i) => i.kind === 'coin')?.mesh.clone();
  if (!mesh) return;
  mesh.visible = true;
  mesh.position.set(x, 0.7, z);
  world.items[0].mesh.parent.add(mesh);
  world.items.push({
    mesh, kind: 'coin', word: 'coins', x, y: 0.7, z, r: 0.7, alive: true,
    baseY: 0.7, dropping: false, vy: 0, respawn: 0, cool: 0, bonus: true,
  });
}

function stompMushroom(it) {
  it.alive = false;
  it.respawn = G.time + 8;
  if (it.baseScale) it.mesh.scale.setScalar(it.baseScale * 0.35);
  S.coins += 1;
  writeSave(S);
  sfx.pop();
  say(it.word, { soft: true });
  if (LESSON.includes(it.word)) mark(it.word, 'heard');
}

function openFinale() {
  G.lock = true;
  hush();
  faceAnimal(world.lila, PL.x, PL.z);
  cheerBear(bear);
  fx.finale();
  say('you-did-it').then(() => say('all-done', { soft: true }));
  later(() => {
    // Saved only now: a game closed before the panel showed comes back to Lila for it.
    S.finished = true;
    writeSave(S);
    const box = $('finaleWords');
    box.innerHTML = '';
    LESSON.forEach((w) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sticker';
      b.innerHTML = `<span class="card-ico">${itemIcon(w)}</span><b lang="en">${w}</b>`;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sfx.collect();
        say(w);
      });
      box.appendChild(b);
    });
    $('finaleStars').textContent = starsLabel();
    $('finale').classList.remove('hidden');
  }, 2200);
}

/** Free play after the finale: no target, the garden stays open. */
export function finaleFree() {
  $('finale').classList.add('hidden');
  G.lock = false;
  paintHud();
}

export function finaleReplay() {
  S.quest = 0;
  S.rescues = 0;
  S.finished = false;
  writeSave(S);
  location.reload();
}

export function openShop() {
  G.lock = true;
  hush();
  say('shop');
  renderShop();
  $('shop').classList.remove('hidden');
}

export function closeShop() {
  $('shop').classList.add('hidden');
  G.lock = G.chooseOpen || G.talkLeft.length > 0 || !!G.review || !$('finale').classList.contains('hidden');
}

function renderShop() {
  $('shopCoins').textContent = String(S.coins);
  const grid = $('shopGrid');
  grid.innerHTML = '';
  if (!S.outfit) S.outfit = { hat: S.hat || null, eyes: null, back: null };
  HATS.forEach((h) => {
    const slot = h.slot || 'hat';
    const owned = S.hats.includes(h.id);
    const worn = S.outfit[slot] === h.id;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hat' + (worn ? ' worn' : '');
    const badge = h.icon
      ? `<span style="font-size:32px;line-height:1">${h.icon}</span>`
      : `<i style="border-bottom-color:#${h.hex.toString(16).padStart(6, '0')}"></i>`;
    b.innerHTML = `${badge}<b lang="en">${h.id}</b><small>${owned ? (worn ? '✓ on' : 'wear') : '🪙 ' + h.price}</small>`;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!owned) {
        if (S.coins < h.price) { sfx.wrong(); say('need-coins'); return; }
        S.coins -= h.price;
        S.hats.push(h.id);
      }
      S.outfit[slot] = worn ? null : h.id;
      if (slot === 'hat') S.hat = S.outfit.hat;
      setHat(bear, S.outfit);
      writeSave(S);
      sfx.coin();
      if (S.outfit[slot]) say(h.line);
      renderShop();
      onHud();
    });
    grid.appendChild(b);
  });
}

export function renderParent() {
  const grid = $('parentGrid');
  grid.innerHTML = '';
  LESSON.forEach((id) => {
    const w = S.words[id];
    const row = document.createElement('div');
    row.className = 'prow';
    const dot = (on) => `<span class="${on ? 'on' : ''}">${on ? '●' : '○'}</span>`;
    const en = isKnown(S, id) ? ' <small class="en" title="Türkçe çeviri artık kendiliğinden çalmıyor">EN</small>' : '';
    const said = w.spoken ? ` <small class="said" title="Sesli söyledi">🗣️${w.spoken}</small>` : '';
    row.innerHTML = `<b>${id}${en}</b> <em>${WORD_TR[id]}</em>${said} ${dot(w.heard)}${dot(w.found)}${dot(w.chosen)}${dot(w.kept)}`;
    grid.appendChild(row);
  });
}

export function starsLabel() {
  return `${masteredCount(S)}/${LESSON.length}`;
}
