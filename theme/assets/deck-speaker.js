// Speaker view — recibe el slide actual via BroadcastChannel desde deck.js
// y muestra: thumbnail actual, thumbnail siguiente, notas, timer.
(function () {
  const slides = window.__SLIDES__ || [];
  const channel = new BroadcastChannel('cv-talks-deck');

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const frameCurrentEl   = document.getElementById('spk-frame-current');
  // Up to 4 upcoming slide slots
  const nextSlots = [1, 2, 3, 4].map(n => ({
    frame:     document.getElementById(`spk-frame-next${n > 1 ? n : ''}`),
    label:     document.getElementById(`spk-next${n > 1 ? n : ''}-label`),
    container: document.getElementById(`spk-next${n > 1 ? n : ''}-container`),
  }));
  const notesEl          = document.getElementById('spk-notes');
  const hudEl            = document.getElementById('spk-hud');
  const timerEl          = document.getElementById('spk-timer');
  const btnStart         = document.getElementById('spk-btn-start');
  const btnReset         = document.getElementById('spk-btn-reset');
  const btnPrev          = document.getElementById('spk-btn-prev');
  const btnNext          = document.getElementById('spk-btn-next');

  // ── State ─────────────────────────────────────────────────────────────────
  let currentOrder = slides[0]?.order ?? 1;
  let timerStart   = null;   // Date.now() when timer started
  let timerPaused  = null;   // elapsed ms when paused
  let timerRunning = false;
  let timerRaf     = null;

  // ── Timer ─────────────────────────────────────────────────────────────────
  function elapsed() {
    if (!timerStart) return timerPaused ?? 0;
    return (timerPaused ?? 0) + (Date.now() - timerStart);
  }

  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
  }

  function tickTimer() {
    timerEl.textContent = fmtTime(elapsed());
    if (timerRunning) timerRaf = requestAnimationFrame(tickTimer);
  }

  function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    timerStart = Date.now();
    timerPaused = null;
    btnStart.textContent = '⏸';
    btnStart.title = 'Pausar timer';
    timerRaf = requestAnimationFrame(tickTimer);
  }

  function pauseTimer() {
    if (!timerRunning) return;
    timerRunning = false;
    timerPaused = elapsed();
    timerStart = null;
    cancelAnimationFrame(timerRaf);
    btnStart.textContent = '▶';
    btnStart.title = 'Reanudar timer';
  }

  function resetTimer() {
    pauseTimer();
    timerStart = null;
    timerPaused = null;
    timerRunning = false;
    btnStart.textContent = '▶';
    btnStart.title = 'Iniciar timer';
    timerEl.textContent = '00:00';
  }

  btnStart.addEventListener('click', () => timerRunning ? pauseTimer() : startTimer());
  btnReset.addEventListener('click', resetTimer);

  // ── Slide rendering ───────────────────────────────────────────────────────
  function currentIndex() {
    return slides.findIndex(s => s.order === currentOrder);
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function loadSlide(order) {
    const idx = slides.findIndex(s => s.order === order);
    if (idx === -1) return;
    currentOrder = order;

    const cur = slides[idx];

    // HUD
    const total = slides[slides.length - 1].order;
    hudEl.textContent = `${pad(cur.order)} / ${pad(total)} · ${cur.label}`;

    // Current thumbnail
    const curParams = new URLSearchParams({ present: '1', embedded: '1', reveal: '1' });
    frameCurrentEl.src = cur.url + '?' + curParams.toString();

    // Next 4 thumbnails
    nextSlots.forEach((slot, i) => {
      const s = slides[idx + i + 1] ?? null;
      if (s) {
        slot.frame.src = s.url + '?' + new URLSearchParams({ present: '1', embedded: '1', reveal: '1' });
        slot.label.textContent = `${pad(s.order)} · ${s.label}`;
        slot.container.style.visibility = '';
        slot.label.style.visibility = '';
      } else {
        slot.frame.src = 'about:blank';
        slot.container.style.visibility = 'hidden';
        slot.label.style.visibility = 'hidden';
      }
    });

    // Notes
    const notes = cur.notes ?? '';
    notesEl.textContent = notes;
    notesEl.classList.toggle('empty', !notes.trim());

    // Nav buttons
    btnPrev.disabled = idx === 0;
    btnNext.disabled = idx === slides.length - 1;

    // Broadcast so the deck window follows
    channel.postMessage({ type: 'slide', order });
  }

  // ── BroadcastChannel ─────────────────────────────────────────────────────
  channel.addEventListener('message', e => {
    const d = e.data;
    if (d?.type === 'slide' && typeof d.order === 'number') {
      if (d.order !== currentOrder) loadSlide(d.order);
    }
  });

  // ── Nav controls ─────────────────────────────────────────────────────────
  btnPrev.addEventListener('click', () => {
    const idx = currentIndex();
    if (idx > 0) loadSlide(slides[idx - 1].order);
  });

  btnNext.addEventListener('click', () => {
    const idx = currentIndex();
    if (idx < slides.length - 1) loadSlide(slides[idx + 1].order);
  });

  document.addEventListener('keydown', e => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
      const idx = currentIndex();
      if (idx < slides.length - 1) loadSlide(slides[idx + 1].order);
      e.preventDefault();
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
      const idx = currentIndex();
      if (idx > 0) loadSlide(slides[idx - 1].order);
      e.preventDefault();
    }
  });

  // ── Open presentation window ──────────────────────────────────────────────
  const deckUrl = window.__DECK_URL__;
  const btnOpen = document.getElementById('spk-btn-open');
  if (btnOpen && deckUrl) {
    btnOpen.addEventListener('click', () => {
      const win = window.open(deckUrl + '#/' + currentOrder, 'cv-talks-presentation',
        'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
      if (win) win.focus();
    });
  }

  // ── Thumbnail scaling ─────────────────────────────────────────────────────
  // Iframes are always 1920×1080; scale them to fill their container.
  function scaleThumb(container, iframe) {
    const w = container.clientWidth;
    if (!w) return;
    // Container is always 16:9 via CSS aspect-ratio; scale iframe to match width
    const scale = w / 1920;
    iframe.style.transform = `scale(${scale})`;
  }

  function scaleAll() {
    scaleThumb(document.getElementById('spk-current-container'), frameCurrentEl);
    nextSlots.forEach(slot => scaleThumb(slot.container, slot.frame));
  }

  const ro = new ResizeObserver(scaleAll);
  ro.observe(document.getElementById('spk-current-container'));
  nextSlots.forEach(slot => ro.observe(slot.container));
  scaleAll();

  // ── Init ─────────────────────────────────────────────────────────────────
  loadSlide(currentOrder);
})();
