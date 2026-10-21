import { LESSON, LINES, CATEGORY, ALBUM_PAGES } from './lines.js';
import { S } from './state.js';
import { say, sfx } from './audio.js';
import { writeSave } from './save.js';
import { cardIcon } from './icons.js';

/*
 * Sticker album. Every lesson word is a sticker: in full colour once learned (found, and picked
 * right on the first try), pale once the child has met it, a "?" before that. Tapping a sticker
 * says the word. "Listen and find" says a word in English only and the child taps its sticker:
 * free practice that keeps the album useful after the story is over.
 */
const $ = (id) => document.getElementById(id);
let page = 0;
let quiz = null; // { word, misses, score, last }
let answer = () => {};

/** onAnswer(word, firstTry) records quiz answers in the learning stats. */
export function bindAlbum(onAnswer) {
  answer = onAnswer;
  updateAlbumBadge();
}

function pageWords(p) {
  return (p.words || CATEGORY[p.id] || []).filter((w) => LESSON.includes(w));
}

export function stickerState(word) {
  const w = S.words[word];
  if (!w) return 'locked';
  if (w.found && w.chosen) return 'earned';
  if (w.heard || w.found) return 'met';
  return 'locked';
}

const earned = () => LESSON.filter((w) => stickerState(w) === 'earned');
const unseen = () => earned().filter((w) => !(S.albumSeen || []).includes(w));

export function updateAlbumBadge() {
  const badge = $('albumBadge');
  if (!badge) return;
  const n = unseen().length;
  badge.textContent = String(n);
  badge.classList.toggle('hidden', n === 0);
}

/** A sticker was just earned: it flies across the screen into the album button. */
export function unlockStickers(words) {
  words.forEach((word, i) => {
    setTimeout(() => {
      const btn = $('btnAlbum');
      const el = document.createElement('div');
      el.className = 'sticker-fly';
      el.innerHTML = `<span class="card-ico">${cardIcon(word)}</span><b>Yeni çıkartma!</b>`;
      document.body.appendChild(el);
      const r = btn && btn.offsetParent ? btn.getBoundingClientRect() : { left: innerWidth - 60, top: 10, width: 40, height: 40 };
      const anim = el.animate([
        { transform: `translate(${innerWidth / 2 - 70}px, ${innerHeight * 0.42}px) scale(.2) rotate(-20deg)`, opacity: 0 },
        { transform: `translate(${innerWidth / 2 - 70}px, ${innerHeight * 0.32}px) scale(1.15) rotate(6deg)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${innerWidth / 2 - 70}px, ${innerHeight * 0.32}px) scale(1) rotate(-4deg)`, opacity: 1, offset: 0.65 },
        { transform: `translate(${r.left + r.width / 2 - 70}px, ${r.top}px) scale(.25) rotate(0deg)`, opacity: 0.2 },
      ], { duration: 2300, easing: 'ease-in-out' });
      sfx.star();
      anim.onfinish = () => {
        el.remove();
        updateAlbumBadge();
        if (btn) {
          btn.classList.remove('bump');
          void btn.offsetWidth;
          btn.classList.add('bump');
        }
      };
    }, 900 + i * 700);
  });
}

function renderTabs() {
  const tabs = $('albumTabs');
  tabs.innerHTML = '';
  ALBUM_PAGES.forEach((p, i) => {
    const words = pageWords(p);
    const got = words.filter((w) => stickerState(w) === 'earned').length;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `album-tab${i === page ? ' on' : ''}`;
    b.innerHTML = `<span>${p.icon}</span>${p.title} <small>${got}/${words.length}</small>`;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (page === i) return;
      page = i;
      stopQuiz();
      sfx.click();
      render();
    });
    tabs.appendChild(b);
  });
}

function renderGrid() {
  const grid = $('albumGrid');
  grid.innerHTML = '';
  const seen = S.albumSeen || [];
  pageWords(ALBUM_PAGES[page]).forEach((word, i) => {
    const state = stickerState(word);
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.word = word;
    b.className = `album-sticker ${state}${state === 'earned' && !seen.includes(word) ? ' new' : ''}`;
    b.style.setProperty('--tilt', `${((i * 37) % 9) - 4}deg`);
    b.innerHTML = state === 'locked'
      ? '<span class="card-ico q">?</span><b>&nbsp;</b>'
      : `<span class="card-ico">${cardIcon(word)}</span><b lang="en">${word}</b>`;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      tapSticker(b, word, state);
    });
    grid.appendChild(b);
  });
}

function render() {
  const all = earned().length;
  $('albumCount').textContent = `⭐ ${all}/${LESSON.length}`;
  renderTabs();
  renderGrid();
  const can = quizWords().length >= 2;
  $('albumQuiz').disabled = !can;
  $('albumQuiz').classList.toggle('off', !can);
  $('albumScore').textContent = quiz ? `🎧 ${quiz.score}` : '';
}

function bounce(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function tapSticker(el, word, state) {
  if (quiz) {
    if (state === 'locked') return;
    if (word === quiz.word) {
      sfx.collect();
      bounce(el, 'hit');
      answer(word, quiz.misses === 0);
      quiz.score += 1;
      quiz.last = word;
      quiz.word = null;
      say('great');
      $('albumScore').textContent = `🎧 ${quiz.score}`;
      setTimeout(() => { if (quiz && !quiz.word) { renderGrid(); renderTabs(); nextQuestion(); } }, 1300);
    } else if (quiz.word) {
      quiz.misses += 1;
      sfx.wrong();
      bounce(el, 'miss');
      say(LINES[`thats-${word}`] ? `thats-${word}` : 'try-again');
      if (quiz.misses >= 2) {
        const right = $('albumGrid').querySelector(`[data-word="${quiz.word}"]`);
        if (right) right.classList.add('hint');
      }
    }
    return;
  }
  if (state === 'locked') {
    sfx.wrong();
    bounce(el, 'miss');
    return;
  }
  sfx.click();
  bounce(el, 'hit');
  say(word, { tr: true });
}

/** Words the quiz can ask on this page: the ones the child has met. */
function quizWords() {
  return pageWords(ALBUM_PAGES[page]).filter((w) => stickerState(w) !== 'locked');
}

function nextQuestion() {
  const words = quizWords().filter((w) => w !== (quiz && quiz.last));
  if (!quiz || !words.length) return;
  quiz.word = words[Math.floor(Math.random() * words.length)];
  quiz.misses = 0;
  $('albumGrid').querySelectorAll('.hint').forEach((e) => e.classList.remove('hint'));
  say(quiz.word, { noTr: true });
}

function stopQuiz() {
  quiz = null;
  $('albumQuiz').textContent = '🎧 Dinle ve bul';
  $('album').classList.remove('quiz');
}

function toggleQuiz() {
  if (quiz) {
    stopQuiz();
    render();
    return;
  }
  if (quizWords().length < 2) return;
  quiz = { word: null, misses: 0, score: 0, last: null };
  $('albumQuiz').textContent = '⏹ Bitir';
  $('album').classList.add('quiz');
  render();
  say('listen-find').then((ok) => { if (ok && quiz && !quiz.word) nextQuestion(); });
}

export function openAlbum() {
  stopQuiz();
  const fresh = unseen();
  if (fresh.length) {
    // Open on the page of the newest sticker.
    const idx = ALBUM_PAGES.findIndex((p) => pageWords(p).includes(fresh[fresh.length - 1]));
    if (idx >= 0) page = idx;
    say('new-sticker');
  } else say('album');
  render();
  $('album').classList.remove('hidden');
  // They have been shown now; the "new" ribbons stay until the album is opened again.
  S.albumSeen = earned();
  writeSave(S);
  updateAlbumBadge();
}

export function closeAlbum() {
  stopQuiz();
  $('album').classList.add('hidden');
}

export function bindAlbumUi() {
  $('albumQuiz').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sfx.click();
    toggleQuiz();
  });
  $('albumSay').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (quiz && quiz.word) say(quiz.word, { noTr: true });
  });
}
