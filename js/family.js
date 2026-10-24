import { S } from './state.js';
import { writeSave, masteredCount } from './save.js';
import { LESSON, WORD_TR } from './lines.js';
import { SET, saveSettings } from './settings.js';
import { lastDays, playedToday, learnedThisWeek, hardestWords } from './stats.js';
import {
  PROFILES, AVATARS, MAX_PROFILES, displayName, addProfile, updateProfile, removeProfile, selectProfile, peekProgress, saveKeyFor,
} from './profiles.js';
import { enableMic, micReady } from './speak.js';
import { itemIcon } from './icons.js';

/*
 * Family panel (behind the multiplication gate): four tabs.
 *  İlerleme — every word and how far the child got with it.
 *  Bu hafta — minutes played per day, words learned this week, hardest words.
 *  Ayarlar  — sound levels, Turkish help, speaking practice, daily play limit, offline copy.
 *  Çocuklar — child profiles: switch, rename, avatar, add, remove.
 */
const $ = (id) => document.getElementById(id);
let tab = 'progress';
let renderWords = () => {};

export function bindFamily(renderWordGrid) {
  renderWords = renderWordGrid;
  document.querySelectorAll('#parentTabs button').forEach((b) => {
    b.addEventListener('click', () => { tab = b.dataset.tab; renderFamily(); });
  });
  ['music', 'sfx', 'voice'].forEach((k) => {
    $(`vol_${k}`).addEventListener('input', (e) => saveSettings({ [k]: Number(e.target.value) / 100 }));
  });
  $('togTr').addEventListener('change', () => { S.turkish = $('togTr').checked; writeSave(S); });
  document.querySelectorAll('input[name="speakMode"]').forEach((r) => {
    r.addEventListener('change', async () => {
      if (!r.checked) return;
      if (r.value === 'mic') {
        // The browser asks for the microphone now, while a parent is holding the tablet.
        $('micNote').textContent = 'Mikrofon izni isteniyor…';
        const ok = await enableMic();
        if (!ok) {
          $('micNote').textContent = 'Mikrofon kullanılamadı (izin verilmedi ya da cihazda yok). Mikrofonsuz mod seçildi.';
          saveSettings({ speak: 'echo' });
          renderSettings();
          return;
        }
      }
      saveSettings({ speak: r.value });
      renderSettings();
    });
  });
  $('limitSel').addEventListener('change', (e) => {
    S.limitMin = Number(e.target.value) || 0;
    writeSave(S);
    renderSettings();
  });
  $('btnReset').addEventListener('click', () => {
    if (!confirm('Bu çocuğun tüm ilerlemesi, altınları ve kostümleri silinsin mi? Bu geri alınamaz.')) return;
    try { localStorage.removeItem(saveKeyFor(PROFILES.current)); } catch (e) { /* storage blocked */ }
    location.reload();
  });
  $('kidAdd').addEventListener('click', () => {
    const p = addProfile($('kidName').value, $('kidNew').dataset.avatar || AVATARS[PROFILES.list.length % AVATARS.length]);
    if (!p) return;
    $('kidName').value = '';
    renderKids();
  });
}

export function renderFamily() {
  document.querySelectorAll('#parentTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  document.querySelectorAll('.ptab').forEach((p) => p.classList.toggle('hidden', p.id !== `ptab_${tab}`));
  const kid = PROFILES.list.findIndex((p) => p.id === PROFILES.current);
  $('parentWho').textContent = `${PROFILES.list[kid].avatar} ${displayName(PROFILES.list[kid], kid)}`;
  if (tab === 'progress') {
    renderWords();
    $('progressSum').textContent = `${LESSON.length} kelimeden ${masteredCount(S)} tanesi öğrenildi (çıkartma kazanıldı).`;
  }
  if (tab === 'week') renderWeek();
  if (tab === 'settings') renderSettings();
  if (tab === 'kids') renderKids();
}

function renderWeek() {
  const days = lastDays(7);
  const max = Math.max(10, ...days.map((d) => d.min));
  $('weekChart').innerHTML = days.map((d) => `
    <div class="bar${d.today ? ' today' : ''}">
      <span class="bar-val">${d.min}</span>
      <i style="height:${Math.round((d.min / max) * 100)}%"></i>
      <span class="bar-day">${d.label}</span>
    </div>`).join('');
  const total = days.reduce((n, d) => n + d.min, 0);
  $('weekSum').textContent = `Son 7 günde ${total} dakika oynandı · bugün ${Math.round(playedToday() / 60)} dk.`;
  const learned = learnedThisWeek();
  $('weekLearned').innerHTML = learned.length
    ? learned.map((w) => `<span class="mini-sticker" title="${WORD_TR[w] || ''}"><i>${itemIcon(w)}</i><b>${w}</b></span>`).join('')
    : '<span class="legend">Bu hafta henüz yeni çıkartma yok.</span>';
  const hard = hardestWords(5);
  $('weekHard').innerHTML = hard.length
    ? hard.map((h) => `<span class="mini-sticker"><i>${itemIcon(h.id)}</i><b>${h.id}</b><small>${h.misses}×</small></span>`).join('')
    : '<span class="legend">Zorlandığı bir kelime görünmüyor.</span>';
}

function renderSettings() {
  ['music', 'sfx', 'voice'].forEach((k) => { $(`vol_${k}`).value = Math.round(SET[k] * 100); });
  $('togTr').checked = !!S.turkish;
  document.querySelectorAll('input[name="speakMode"]').forEach((r) => { r.checked = r.value === SET.speak; });
  if (SET.speak === 'mic' && !micReady()) $('micNote').textContent = 'Mikrofon bu açılışta henüz açılmadı: "Mikrofonla"yı yeniden seçince izin istenir.';
  else if (SET.speak === 'mic') $('micNote').textContent = 'Kayıt yalnızca hemen geri çalmak içindir; hiçbir yere kaydedilmez veya gönderilmez.';
  else $('micNote').textContent = '';
  $('limitSel').value = String(S.limitMin || 0);
  $('limitNote').textContent = S.limitMin
    ? `Bugün ${Math.round(playedToday() / 60)} / ${S.limitMin} dk oynandı. Süre dolunca oyun nazikçe mola verir; devam için bu panel gerekir.`
    : 'Süre sınırı yok.';
}

function renderKids() {
  const list = $('kidList');
  list.innerHTML = '';
  PROFILES.list.forEach((p, i) => {
    const prog = peekProgress(p.id);
    const row = document.createElement('div');
    row.className = `kid-row${p.id === PROFILES.current ? ' current' : ''}`;
    row.innerHTML = `
      <button type="button" class="kid-ava" title="Simgeyi değiştir">${p.avatar}</button>
      <input class="kid-name" maxlength="16" value="${(p.name || '').replace(/"/g, '&quot;')}" placeholder="${displayName(p, i)}">
      <span class="kid-prog">⭐ ${prog.learned}/${LESSON.length}</span>
      ${p.id === PROFILES.current ? '<b class="kid-now">Şu an</b>' : '<button type="button" class="ghost kid-play">Bununla oyna</button>'}
      ${PROFILES.list.length > 1 ? '<button type="button" class="ghost kid-del" title="Sil">🗑</button>' : ''}`;
    row.querySelector('.kid-ava').addEventListener('click', () => {
      const next = AVATARS[(AVATARS.indexOf(p.avatar) + 1) % AVATARS.length];
      updateProfile(p.id, { avatar: next });
      renderFamily();
    });
    row.querySelector('.kid-name').addEventListener('change', (e) => { updateProfile(p.id, { name: e.target.value }); renderFamily(); });
    const play = row.querySelector('.kid-play');
    if (play) play.addEventListener('click', () => { selectProfile(p.id); location.reload(); });
    const del = row.querySelector('.kid-del');
    if (del) {
      del.addEventListener('click', () => {
        if (!confirm(`${displayName(p, i)} ve tüm ilerlemesi silinsin mi? Bu geri alınamaz.`)) return;
        const wasCurrent = p.id === PROFILES.current;
        removeProfile(p.id);
        if (wasCurrent) location.reload();
        else renderKids();
      });
    }
    list.appendChild(row);
  });
  const full = PROFILES.list.length >= MAX_PROFILES;
  $('kidNew').classList.toggle('hidden', full);
  $('kidFull').classList.toggle('hidden', !full);
  const ava = $('kidNew').dataset.avatar || AVATARS[PROFILES.list.length % AVATARS.length];
  $('kidNewAva').textContent = ava;
  $('kidNewAva').onclick = () => {
    $('kidNew').dataset.avatar = AVATARS[(AVATARS.indexOf($('kidNewAva').textContent) + 1) % AVATARS.length];
    renderKids();
  };
}
