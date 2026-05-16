/**
 * PHANTOM PORTFOLIO — MAIN APPLICATION
 * =====================================
 * Persona 5-inspired interactive portfolio
 * Built with Vanilla JS, Vue.js, and GSAP
 */

'use strict';

// ── Global State ──────────────────────────────────────────────
const APP = {
  data: null,          // JSON data loaded via fetch()
  currentScreen: null, // Active screen identifier
  audioEnabled: false, // Whether user allowed audio
  menuFocused: 0,      // Currently focused menu index (keyboard nav)
};

// ── Utility: $ selector ──────────────────────────────────────
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

// ── Custom Cursor ─────────────────────────────────────────────
(function initCursor() {
  const cursor      = $('#cursor');
  const cursorTrail = $('#cursor-trail');
  if (!cursor || !cursorTrail) return;

  let mouseX = 0, mouseY = 0;
  let trailX = 0, trailY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // Smooth trail using rAF
  function animTrail() {
    trailX += (mouseX - trailX) * 0.12;
    trailY += (mouseY - trailY) * 0.12;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top  = trailY + 'px';
    requestAnimationFrame(animTrail);
  }
  animTrail();

  // Cursor grow on interactive elements
  document.addEventListener('mouseover', (e) => {
    if (e.target.matches('button, a, [data-clickable]')) {
      cursor.style.transform = 'translate(-50%, -50%) rotate(45deg) scale(2)';
      cursor.style.background = 'var(--white)';
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.matches('button, a, [data-clickable]')) {
      cursor.style.transform = 'translate(-50%, -50%) rotate(45deg) scale(1)';
      cursor.style.background = 'var(--red)';
    }
  });
})();

// ── Background Shapes Animation ───────────────────────────────
function initBgShapes() {
  const container = $('.bg-animated');
  if (!container) return;

  const shapes = [
    { w: 300, h: 300, x: '10%', y: '20%', r: 45, dur: 8 },
    { w: 200, h: 600, x: '70%', y: '-10%', r: -15, dur: 12 },
    { w: 400, h: 150, x: '50%', y: '70%', r: 30, dur: 10 },
    { w: 100, h: 100, x: '85%', y: '40%', r: 60, dur: 7 },
  ];

  shapes.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'bg-shape';
    el.style.cssText = `
      width: ${s.w}px; height: ${s.h}px;
      left: ${s.x}; top: ${s.y};
      transform: rotate(${s.r}deg);
      animation: shape-float-${i} ${s.dur}s ease-in-out infinite alternate;
    `;
    container.appendChild(el);

    // Inject keyframe
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shape-float-${i} {
        from { transform: rotate(${s.r}deg) scale(1); }
        to   { transform: rotate(${s.r + 20}deg) scale(1.1); }
      }
    `;
    document.head.appendChild(style);
  });
}

// ── Screen Management ─────────────────────────────────────────
function showScreen(id) {
  // Hide all screens
  $$('.screen').forEach(s => {
    s.classList.remove('active');
  });

  APP.currentScreen = id;
  const target = $(`#screen-${id}`);
  if (target) {
    target.classList.add('active');
  }
}

function triggerGlitch() {
  const overlay = $('.glitch-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  void overlay.offsetWidth;
  overlay.classList.add('active');
  setTimeout(() => overlay.classList.remove('active'), 400);
}


// ── Background Music System ───────────────────────────────────
const MUSIC = {
  tracks: Array.from({ length: 77 }, (_, i) =>
    `/audios/persona/audio${i + 1}.mp3`
  ),
  audio: null,
  lastIndex: -1,
  muted: false,
};

function pickRandomTrack() {
  let idx;
  do { idx = Math.floor(Math.random() * MUSIC.tracks.length); }
  while (idx === MUSIC.lastIndex && MUSIC.tracks.length > 1);
  MUSIC.lastIndex = idx;
  return MUSIC.tracks[idx];
}

function startBackgroundMusic() {
  if (MUSIC.audio) { MUSIC.audio.pause(); MUSIC.audio = null; }
  const track = pickRandomTrack();
  const audio = new Audio(track);
  MUSIC.audio = audio;

  const btn = $('#music-skip-btn');
  if (btn) {
    btn.style.display = 'block';
    btn.onmouseenter = () => { btn.style.color = 'var(--white)'; btn.style.borderColor = 'var(--red)'; };
    btn.onmouseleave = () => { btn.style.color = 'var(--grey)'; btn.style.borderColor = 'var(--grey-dark)'; };
  }

  const muteBtn = $('#music-mute-btn');
  if (muteBtn) muteBtn.style.display = 'block';

  audio.muted = MUSIC.muted;

  audio.volume = 0;
  audio.addEventListener('ended', () => startBackgroundMusic(), { once: true });
  updateMusicBtn();

  // Play first, THEN fade in once playing has actually started
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      // Audio is playing — now fade in
      const fadeIn = setInterval(() => {
        if (MUSIC.audio === audio && audio.volume < 0.4) {
          audio.volume = Math.min(audio.volume + 0.02, 0.4);
        } else {
          clearInterval(fadeIn);
        }
      }, 80);
    }).catch(() => {
      // Autoplay blocked — wait for next user interaction then try again
      const unlock = () => {
        audio.play().then(() => {
          const fadeIn = setInterval(() => {
            if (MUSIC.audio === audio && audio.volume < 0.4) {
              audio.volume = Math.min(audio.volume + 0.02, 0.4);
            } else { clearInterval(fadeIn); }
          }, 80);
        }).catch(() => {});
        document.removeEventListener('click', unlock);
        document.removeEventListener('keydown', unlock);
      };
      document.addEventListener('click', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
    });
  }
}

function skipToNextTrack() {
  if (MUSIC.audio) {
    const audio = MUSIC.audio;
    const fadeOut = setInterval(() => {
      if (audio.volume > 0.04) { audio.volume = Math.max(audio.volume - 0.04, 0); }
      else { audio.pause(); clearInterval(fadeOut); startBackgroundMusic(); }
    }, 40);
  } else { startBackgroundMusic(); }
}

function updateMusicBtn() {
  const btn = $('#music-skip-btn');
  if (!btn || !MUSIC.audio) return;
  btn.textContent = `♪ TRACK ${MUSIC.lastIndex + 1} ▶▶`;
}

function toggleMute() {
  MUSIC.muted = !MUSIC.muted;
  if (MUSIC.audio) {
    MUSIC.audio.muted = MUSIC.muted;
  }
  const btn = $('#music-mute-btn');
  if (!btn) return;
  btn.textContent = MUSIC.muted ? '♪ UNMUTE' : '♪ MUTE';
  btn.style.color = MUSIC.muted ? 'var(--red)' : 'var(--grey)';
  btn.style.borderColor = MUSIC.muted ? 'var(--red)' : 'var(--grey-dark)';
}

function initMusicBtn() {
  const btn = $('#music-skip-btn');
  if (btn) btn.addEventListener('click', skipToNextTrack);

  const muteBtn = $('#music-mute-btn');
  if (muteBtn) {
    muteBtn.addEventListener('click', toggleMute);
    muteBtn.onmouseenter = () => {
      if (!MUSIC.muted) { muteBtn.style.color = 'var(--white)'; muteBtn.style.borderColor = 'var(--red)'; }
    };
    muteBtn.onmouseleave = () => {
      if (!MUSIC.muted) { muteBtn.style.color = 'var(--grey)'; muteBtn.style.borderColor = 'var(--grey-dark)'; }
    };
  }
}

// ── Live Clock ────────────────────────────────────────────────
function updateClock() {
  const clockEl = $('#menu-clock');
  if (!clockEl) return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}:${s}`;
}

// ── Data Loading ──────────────────────────────────────────────
async function loadData() {
  try {
    const res = await fetch('./data/projects.json');
    if (!res.ok) {
  throw new Error(`HTTP error ${res.status}`);
}

APP.data = await res.json();

console.log('[Phantom Portfolio] Data loaded ✓');
    APP.data = await res.json();
    console.log('[Phantom Portfolio] Data loaded ✓');
  } catch (err) {
    console.error('[Phantom Portfolio] Failed to load data:', err);
    APP.data = null;
  }
}

// ── Startup Screen Logic ──────────────────────────────────────
function initStartup() {
  const btnYes     = $('#btn-yes');
  const btnNo      = $('#btn-no');
  const loadingEl  = $('#startup-loading');
  const loadingBar = $('#loading-bar-fill');
  const loadingTxt = $('#loading-text');

  const loadingMessages = [
    'CONNECTING TO NETWORK...',
    'ESTABLISHING SECURE LINK...',
    'LOADING PHANTOM DATABASE...',
    'DECRYPTING PORTFOLIO...',
    'ACCESS GRANTED...',
  ];

  function startMediaAfterConnect() {
    playIntroVideo();
  }

  function beginConnectionSequence() {
    APP.audioEnabled = true;
    btnYes.disabled = true;
    btnNo.disabled = true;
    btnYes.style.opacity = '0.5';
    btnNo.style.opacity = '0.5';
    loadingEl.classList.add('visible');
    let progress = 0;
    let msgIndex = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8 + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(startMediaAfterConnect, 500);
      }
      loadingBar.style.width = progress + '%';
      const expectedMsg = Math.floor((progress / 100) * loadingMessages.length);
      if (expectedMsg > msgIndex && expectedMsg < loadingMessages.length) {
        msgIndex = expectedMsg;
        loadingTxt.textContent = loadingMessages[msgIndex];
      }
    }, 120);
  }

  function triggerYes() {
    if (btnYes.disabled) return;
    triggerGlitch();
    setTimeout(beginConnectionSequence, 300);
  }

  btnYes.addEventListener('click', triggerYes);

  document.addEventListener('keydown', (e) => {
    if (APP.currentScreen === 'startup' && e.code === 'Space') {
      e.preventDefault();
      triggerYes();
    }
  });

  btnNo.addEventListener('click', () => {
    btnNo.disabled = true;
    const messages = [
      'YOU CANNOT ESCAPE THE EXPERIENCE.',
      'THE EXPERIENCE CANNOT ESCAPE YOU EITHER.',
      'RESISTANCE IS FUTILE. SCROLL AWAITS.',
      'THE PHANTOM THIEF STEALS YOUR ATTENTION.',
      'FINE. CONNECTING ANYWAY...',
    ];
    let step = 0;
    const msgEl = $('#no-response');
    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.textContent = messages[0];
      step = 1;
      const cycle = setInterval(() => {
        msgEl.textContent = messages[step % messages.length];
        step++;
        if (step >= messages.length) {
          clearInterval(cycle);
          setTimeout(() => { triggerGlitch(); beginConnectionSequence(); }, 600);
        }
      }, 700);
    }
  });
}

// ── Video Screen ──────────────────────────────────────────────
function playIntroVideo() {
  showScreen('video');
  const video = $('#intro-video');
  const skipBtn = $('#video-skip');

  if (!video) { setTimeout(startIntroCinematic, 300); return; }

  video.playsInline = true;
  video.preload = 'auto';

  function goNext() {
    video.pause();
    triggerGlitch();
    setTimeout(startIntroCinematic, 300);
  }

  if (skipBtn) skipBtn.onclick = goNext;

  const spaceSkip = (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      document.removeEventListener('keydown', spaceSkip);
      goNext();
    }
  };
  document.addEventListener('keydown', spaceSkip);

  const attemptPlay = async () => {
    try { await video.play(); }
    catch (err) {
      const unlock = async () => {
        try { await video.play(); } catch (e) {}
        document.removeEventListener('click', unlock);
        document.removeEventListener('keydown', unlock);
      };
      document.addEventListener('click', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
    }
  };
  attemptPlay();

  video.addEventListener('ended', () => {
    triggerGlitch();
    setTimeout(startIntroCinematic, 300);
  }, { once: true });
}

// ── Intro Cinematic ───────────────────────────────────────────
function startIntroCinematic() {
  showScreen('intro');

  // Start background music — plays through cinematic and all screens
  startBackgroundMusic();

  const tl = gsap.timeline({
    onComplete: () => {
      triggerGlitch();
      setTimeout(() => { showScreen('menu'); initMenu(); }, 400);
    }
  });

  // Helper to animate a panel
  function animPanel(panelId, words, smallText, bgColor, wordColor, duration = 1.2) {
    const panel = $(`#${panelId}`);
    if (!panel) return;
    const wordEls  = $$('.panel-word', panel);
    const smallEl  = $('.panel-small', panel);
    const slashEl  = $('.panel-slash', panel);

    tl.set(panel, { opacity: 1 })
      // Slash sweep
      .fromTo(slashEl,
        { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
        { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 0.25, ease: 'power3.in' }
      )
      .fromTo(slashEl,
        { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
        { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)', duration: 0.25, ease: 'power3.out' }
      )
      .fromTo(wordEls,
        { opacity: 0, x: -60, skewX: -15 },
        { opacity: 1, x: 0, skewX: 0, duration: 0.4, stagger: 0.08, ease: 'back.out(1.5)' },
        '-=0.2'
      );

    if (smallEl) {
      tl.fromTo(smallEl,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3 },
        '-=0.1'
      );
    }

    tl.to({}, { duration })
      .to(panel, { opacity: 0, duration: 0.3 });
  }

  // Panel 1: Name
  animPanel('panel-1', ['JAMES', 'CARMICHAEL'], null, '#000', '#fff', 1.0);
  // Panel 2: Role
  animPanel('panel-2', ['PHANTOM', 'THIEF'], 'OF WEB DEVELOPMENT', '#ff0033', '#000', 1.0);
  // Panel 3: Program
  animPanel('panel-3', ['WEB DESIGN', 'PATHWAY'], 'PROGRAM', '#000', '#fff', 1.0);
  // Panel 4: Senior
  animPanel('panel-4', ['SENIOR', 'PORTFOLIO'], '2022 — 2026', '#111', '#ff0033', 1.0);
  // Panel 5: Tagline
  animPanel('panel-5', ['THE STORY', 'OF GROWTH'], 'THREE YEARS IN THE MAKING', '#000', '#fff', 1.2);

  // Final panel: "BEGIN"
  const finalPanel = $('#panel-final');
  if (finalPanel) {
    const finalWord = $('.panel-word', finalPanel);
    tl.set(finalPanel, { opacity: 1 })
      .fromTo(finalWord,
        { scale: 3, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'expo.out' }
      )
      .to({}, { duration: 0.8 });
  }
}

// ── Skip Intro ────────────────────────────────────────────────
function initSkipBtn() {
  const skipBtn = $('#intro-skip');
  if (!skipBtn) return;

  function doSkip() {
    gsap.killTweensOf('*');
    $$('.intro-panel').forEach(p => p.style.opacity = '0');
    triggerGlitch();
    setTimeout(() => { showScreen('menu'); initMenu(); }, 400);
  }

  skipBtn.addEventListener('click', doSkip);

  // Spacebar skips the cinematic
  const spaceSkip = (e) => {
    if (APP.currentScreen === 'intro' && e.code === 'Space') {
      e.preventDefault();
      document.removeEventListener('keydown', spaceSkip);
      doSkip();
    }
  };
  document.addEventListener('keydown', spaceSkip);
}

// ── Main Menu Logic ───────────────────────────────────────────
function initMenu() {
  const menuItems = $$('.menu-item');

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (APP.currentScreen !== 'menu') return;

    if (e.key === 'ArrowDown' || e.key === 's') {
      APP.menuFocused = (APP.menuFocused + 1) % menuItems.length;
      updateMenuFocus();
    }
    if (e.key === 'ArrowUp' || e.key === 'w') {
      APP.menuFocused = (APP.menuFocused - 1 + menuItems.length) % menuItems.length;
      updateMenuFocus();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      menuItems[APP.menuFocused]?.click();
    }
    if (e.key === 'Escape') {
      showScreen('menu');
    }
  });

  function updateMenuFocus() {
    menuItems.forEach((item, i) => {
      item.classList.toggle('focused', i === APP.menuFocused);
    });
  }

  menuItems.forEach((item, i) => {
    item.addEventListener('mouseenter', () => {
      APP.menuFocused = i;
      updateMenuFocus();
    });
  });

  // Menu enter animation
  gsap.fromTo('.menu-side-bar',
    { scaleY: 0 },
    { scaleY: 1, duration: 0.6, ease: 'power4.out', transformOrigin: 'top center' }
  );
  gsap.fromTo('.menu-item',
    { opacity: 0, x: -40 },
    { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.2 }
  );
  gsap.fromTo('.menu-header',
    { opacity: 0, y: -20 },
    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 }
  );
}

// ── Save File Screen ──────────────────────────────────────────
function showSaveScreen() {
  showScreen('saves');
  triggerGlitch();

  if (!APP.data) return;

  // Animate save cards in
  gsap.fromTo('.save-card',
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'back.out(1.2)', delay: 0.2 }
  );

  // Animate progress bars after slight delay
  setTimeout(() => {
    $$('.save-card').forEach((card, i) => {
      const saveData = APP.data.saveFiles[i];
      if (!saveData) return;
      const fill = $('.save-progress-fill', card);
      const pct  = $('.save-pct', card);

      if (fill && typeof saveData.completion === 'number') {
        fill.style.width = saveData.completion + '%';
      }
    });
  }, 600);
}

function handleSaveSelect(saveId) {
  triggerGlitch();

  if (saveId === 4) {
    // Unknown route
    setTimeout(() => {
      showUnknownRoute();
    }, 400);
    return;
  }

  // Map save ID to year
  const yearMap = { 1: 'sophomore', 2: 'junior', 3: 'senior' };
  const year = yearMap[saveId];

  setTimeout(() => {
    showContentScreen('portfolio', year);
  }, 400);
}

// ── Content Screen Manager ────────────────────────────────────
function showContentScreen(section, yearFilter = null) {
  // Hide all screens first
  $$('.screen').forEach(s => {
    s.classList.remove('active');
  });
  
  const contentScreen = $('#screen-content');
  contentScreen.classList.add('active');
  APP.currentScreen = 'content';

  // Hide all sections first
  $$('.content-section').forEach(s => s.classList.remove('visible'));

  const target = $(`#section-${section}`);
  if (target) {
    target.classList.add('visible');

    // Update nav active state
    $$('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = $(`.nav-link[data-section="${section}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Scroll to top
    contentScreen.scrollTop = 0;

    // If portfolio with year filter, highlight that year
    if (section === 'portfolio' && yearFilter) {
      setTimeout(() => {
        const yearSection = $(`#year-${yearFilter}`);
        if (yearSection) {
          yearSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }

    // Trigger section-specific animations
    animateSection(section);
  }
}

function animateSection(section) {
  // Animate cards/elements in viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gsap.fromTo(entry.target,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
        );
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  $$('.project-card, .stat-card, .reflection-block, .future-goal, .gallery-item').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });

  // Stats counters
  if (section === 'stats') {
    animateCounters();
    animateSkillBars();
  }

  // About page skill bars
  if (section === 'about') {
    animateSkillBars();
  }
}

// ── Counter Animations ────────────────────────────────────────
function animateCounters() {
  $$('.stat-number[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 1500;
    const start = performance.now();

    function update(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out
      el.textContent = Math.round(ease * target);

      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

function animateSkillBars() {
  setTimeout(() => {
    $$('.skill-fill[data-level]').forEach(el => {
      el.style.width = el.dataset.level + '%';
    });
    $$('.char-stat-fill[data-level]').forEach(el => {
      el.style.width = el.dataset.level + '%';
    });
  }, 300);
}

// ── Unknown Route ─────────────────────────────────────────────
function showUnknownRoute() {
  // Hide all screens first
  $$('.screen').forEach(s => {
    s.classList.remove('active');
  });
  
  const unknownScreen = $('#screen-unknown');
  unknownScreen.classList.add('active');
  APP.currentScreen = 'unknown';

  gsap.fromTo('.unknown-title',
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1, duration: 1, ease: 'expo.out', delay: 0.3 }
  );
  gsap.fromTo('.unknown-message',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.7 }
  );
  gsap.fromTo('.unknown-goal',
    { opacity: 0, x: -30 },
    { opacity: 1, x: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out', delay: 1 }
  );
}

// ── Exit Reality ──────────────────────────────────────────────
function triggerExitReality() {
  showScreen('exit');
  triggerGlitch();

  // Auto-return after 3 seconds
  setTimeout(() => {
    triggerGlitch();
    setTimeout(() => {
      showScreen('menu');
      initMenu();
    }, 400);
  }, 3500);
}

// ── Project Modal ─────────────────────────────────────────────
function openProjectModal(project) {
  const overlay  = $('#modal-overlay');
  const modalImg = $('#modal-img');
  const modalTitle = $('#modal-title');
  const modalYear  = $('#modal-year');
  const modalDesc  = $('#modal-desc');
  const modalTechs = $('#modal-techs');
  const modalSkills = $('#modal-skills');
  const modalRef   = $('#modal-reflection');
  const modalLink  = $('#modal-link');

  modalImg.src         = project.image;
  modalImg.alt         = project.title;
  modalTitle.textContent = project.title;
  modalYear.textContent  = `${project.yearLabel} Year — ${project.year}`;
  modalDesc.textContent  = project.description;
  modalRef.textContent   = project.reflection;

  // Render tech tags
  modalTechs.innerHTML = project.technologies
    .map(t => `<span class="tech-tag">${t}</span>`).join('');

  // Render skills
  modalSkills.innerHTML = project.skillsLearned
    .map(s => `<span class="tech-tag">${s}</span>`).join('');

  modalLink.href = project.projectLink;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = $('#modal-overlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Vue.js App ────────────────────────────────────────────────
function initVueApp() {
  if (!APP.data) {
    console.warn('[Phantom Portfolio] No data loaded, Vue app cannot initialize');
    return;
  }

  const { createApp } = Vue;

  // ── Portfolio Section Vue App ──
  createApp({
    data() {
      return {
        projects: APP.data.projects || [],
        activeYear: 'all',
        years: ['all', 'Sophomore', 'Junior', 'Senior'],
      };
    },
    computed: {
      sophomoreProjects() {
        return this.projects.filter(p => p.yearLabel === 'Sophomore');
      },
      juniorProjects() {
        return this.projects.filter(p => p.yearLabel === 'Junior');
      },
      seniorProjects() {
        return this.projects.filter(p => p.yearLabel === 'Senior');
      },
    },
    methods: {
      openModal(project) {
        openProjectModal(project);
      },
    },
    template: `
      <div>
        <!-- Sophomore Year -->
        <div id="year-sophomore">
          <div class="year-header">
            <span class="year-badge">YEAR 01</span>
            <h2 class="year-title">Sophomore Year</h2>
            <span class="year-level">LV.12 — June 2024</span>
          </div>
          <div v-if="sophomoreProjects.length === 0" style="text-align:center;padding:60px 40px;font-family:var(--font-mono);color:var(--grey)">
            <div style="font-size:64px;margin-bottom:20px;color:var(--red)">⚠</div>
            <div style="font-size:20px;letter-spacing:0.2em;margin-bottom:12px">ERROR 404</div>
            <div style="font-size:14px;margin-bottom:20px">FILES COULD NOT BE FOUND</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5)">Archive data unavailable — early projects not preserved</div>
          </div>
          <div v-else class="projects-grid">
            <div v-for="project in sophomoreProjects" :key="project.id" class="project-card">
              <img :src="project.image" :alt="project.title" class="project-card-img" />
              <div class="project-card-body">
                <div class="project-techs">
                  <span v-for="tech in project.technologies" :key="tech" class="tech-tag">{{ tech }}</span>
                </div>
                <h3 class="project-name">{{ project.title }}</h3>
                <p class="project-desc">{{ project.description }}</p>
                <div class="project-card-footer">
                  <a :href="project.projectLink" class="project-link" target="_blank">VIEW PROJECT ↗</a>
                  <button class="project-view-btn" @click="openModal(project)">DETAILS</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Junior Year -->
        <div id="year-junior">
          <div class="year-header">
            <span class="year-badge">YEAR 02</span>
            <h2 class="year-title">Junior Year</h2>
            <span class="year-level">LV.28 — June 2025</span>
          </div>
          <div class="projects-grid">
            <div v-for="project in juniorProjects" :key="project.id" class="project-card">
              <img :src="project.image" :alt="project.title" class="project-card-img" />
              <div class="project-card-body">
                <div class="project-techs">
                  <span v-for="tech in project.technologies" :key="tech" class="tech-tag">{{ tech }}</span>
                </div>
                <h3 class="project-name">{{ project.title }}</h3>
                <p class="project-desc">{{ project.description }}</p>
                <div class="project-card-footer">
                  <a :href="project.projectLink" class="project-link" target="_blank">VIEW PROJECT ↗</a>
                  <button class="project-view-btn" @click="openModal(project)">DETAILS</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Senior Year -->
        <div id="year-senior">
          <div class="year-header">
            <span class="year-badge">YEAR 03</span>
            <h2 class="year-title">Senior Year</h2>
            <span class="year-level">LV.47 — June 2026</span>
          </div>
          <div class="projects-grid">
            <div v-for="project in seniorProjects" :key="project.id" class="project-card">
              <img :src="project.image" :alt="project.title" class="project-card-img" />
              <div class="project-card-body">
                <div class="project-techs">
                  <span v-for="tech in project.technologies" :key="tech" class="tech-tag">{{ tech }}</span>
                </div>
                <h3 class="project-name">{{ project.title }}</h3>
                <p class="project-desc">{{ project.description }}</p>
                <div class="project-card-footer">
                  <a :href="project.projectLink" class="project-link" target="_blank">VIEW PROJECT ↗</a>
                  <button class="project-view-btn" @click="openModal(project)">DETAILS</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }).mount('#vue-portfolio');

  // ── Featured Projects Vue App ──
  createApp({
    data() {
      return {
        featured: APP.data.projects.filter(p => p.featured),
        activeIdx: 0,
      };
    },
    computed: {
      current() {
        return this.featured[this.activeIdx];
      },
    },
    methods: {
      select(idx) {
        this.activeIdx = idx;
      },
      openModal(project) {
        openProjectModal(project);
      },
    },
    template: `
      <div class="featured-layout">
        <!-- Large active card -->
        <div class="featured-main" v-if="current">
          <img :src="current.image" :alt="current.title" class="featured-main-img" />
          <div class="featured-main-body">
            <div class="featured-tag">FEATURED</div>
            <div class="project-techs">
              <span v-for="tech in current.technologies" :key="tech" class="tech-tag">{{ tech }}</span>
            </div>
            <h2 class="featured-title">{{ current.title }}</h2>
            <p class="featured-desc">{{ current.description }}</p>
            <div class="featured-actions">
              <a :href="current.projectLink" class="modal-action-link" target="_blank">VIEW PROJECT</a>
              <button class="project-view-btn" @click="openModal(current)" style="margin-left:12px">MORE INFO</button>
            </div>
          </div>
        </div>

        <!-- Sidebar thumbnails -->
        <div class="featured-sidebar">
          <div
            v-for="(proj, i) in featured"
            :key="proj.id"
            class="featured-thumb"
            :class="{ active: i === activeIdx }"
            @click="select(i)"
          >
            <img :src="proj.image" :alt="proj.title" class="featured-thumb-img" />
            <div class="featured-thumb-info">
              <span class="featured-thumb-year">{{ proj.yearLabel }}</span>
              <span class="featured-thumb-title">{{ proj.title }}</span>
            </div>
          </div>
        </div>
      </div>
    `
  }).mount('#vue-featured');

  // ── Stats Vue App ──
  createApp({
    data() {
      return {
        stats: APP.data.developer.stats,
        skills: APP.data.developer.skills,
      };
    },
    template: `
      <div>
        <div class="stats-grid" style="margin-bottom:50px">
          <div class="stat-card">
            <div class="stat-number" :data-target="stats.yearsInProgram">0</div>
            <div class="stat-label">Years in Program</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" :data-target="stats.projectsCompleted">0</div>
            <div class="stat-label">Projects Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" :data-target="stats.languagesLearned">0</div>
            <div class="stat-label">Languages Learned</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" :data-target="stats.hoursCoded">0</div>
            <div class="stat-label">Hours Coded</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" :data-target="stats.energyDrinksConsumed">0</div>
            <div class="stat-label">Energy Drinks Consumed</div>
          </div>
        </div>

        <div class="section-eyebrow">SKILL ANALYSIS</div>
        <h2 class="section-title" style="font-size:32px;margin-bottom:30px">Technical <span>Proficiency</span></h2>

        <div class="skills-list">
          <div v-for="skill in skills" :key="skill.name" class="skill-row">
            <span class="skill-name">{{ skill.name }}</span>
            <div class="skill-track">
              <div class="skill-fill" :data-level="skill.level" style="width:0%"></div>
            </div>
            <span class="skill-pct">{{ skill.level }}%</span>
          </div>
        </div>
      </div>
    `
  }).mount('#vue-stats');

  // ── Gallery Vue App ──
  createApp({
    data() {
      return {
        gallery: APP.data.gallery || [],
        filter: 'All',
        categories: ['All', 'Design', 'Process', 'Development'],
      };
    },
    computed: {
      filtered() {
        if (this.filter === 'All') return this.gallery;
        return this.gallery.filter(g => g.category === this.filter);
      },
    },
    methods: {
      setFilter(cat) {
        this.filter = cat;
      },
    },
    template: `
      <div>
        <div class="gallery-filter">
          <button
            v-for="cat in categories"
            :key="cat"
            class="filter-btn"
            :class="{ active: filter === cat }"
            @click="setFilter(cat)"
          >{{ cat }}</button>
        </div>
        <div class="gallery-grid">
          <div v-for="item in filtered" :key="item.title" class="gallery-item">
            <img :src="item.image" :alt="item.title" />
            <div class="gallery-overlay">
              <div>
                <div class="gallery-item-title">{{ item.title }}</div>
                <div class="gallery-item-cat">{{ item.category }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }).mount('#vue-gallery');

  // ── About Vue App ──
  createApp({
    data() {
      return {
        dev: APP.data.developer,
      };
    },
    template: `
      <div class="about-grid">
        <!-- Character Profile Card -->
        <div class="char-profile">
          <div class="char-avatar">
            <div class="char-placeholder">JC</div>
          </div>
          <div class="char-info-col">
            <div class="char-name-plate">
              <div class="char-name">{{ dev.name }}</div>
              <div class="char-title-text">{{ dev.title }}</div>
            </div>
            <ul class="char-stats-list">
              <li v-for="skill in dev.skills" :key="skill.name" class="char-stat-item">
                <span class="char-stat-label">{{ skill.name }}</span>
                <div class="char-stat-bar">
                  <div class="char-stat-fill" :data-level="skill.level" style="width:0%"></div>
                </div>
                <span class="char-stat-val">{{ skill.level }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bio Content -->
        <div class="about-bio-area">
          <p class="about-bio">{{ dev.bio }}</p>

          <div class="section-eyebrow">INTERESTS</div>
          <div class="interests-grid" style="margin-top:16px">
            <div v-for="interest in dev.interests" :key="interest" class="interest-chip">
              {{ interest }}
            </div>
          </div>

          <div class="section-eyebrow" style="margin-top:40px">CONNECT</div>
          <div style="margin-top:16px; display:flex; gap:12px; flex-wrap:wrap">
            <a :href="dev.social.github" target="_blank" class="modal-action-link">GITHUB</a>
            <a :href="dev.social.linkedin" target="_blank" class="modal-action-link" style="background:var(--dark-3);color:var(--white)">LINKEDIN</a>
            <a :href="'mailto:' + dev.social.email" class="modal-action-link" style="background:var(--dark-3);color:var(--white)">EMAIL</a>
          </div>
        </div>
      </div>
    `
  }).mount('#vue-about');

  // ── Reflection Vue App ──
  createApp({
    data() {
      return {
        ref: APP.data.reflection,
      };
    },
    template: `
      <div class="reflection-content" style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;min-height:calc(100vh - 200px);align-content:center">
        <div class="reflection-block">
          <div class="reflection-topic">OVERALL REFLECTION</div>
          <p class="reflection-text">{{ ref.overall }}</p>
        </div>
        <div class="reflection-block">
          <div class="reflection-topic">THE CHALLENGES</div>
          <p class="reflection-text">{{ ref.challenges }}</p>
        </div>
        <div class="reflection-block">
          <div class="reflection-topic">FAVORITE MOMENTS</div>
          <p class="reflection-text">{{ ref.favorites }}</p>
        </div>
        <div class="reflection-block">
          <div class="reflection-topic">TRANSFORMATION</div>
          <p class="reflection-text">{{ ref.transformation }}</p>
        </div>
      </div>
    `
  }).mount('#vue-reflection');

  // ── Future Plans Vue App ──
  createApp({
    data() {
      return {
        future: APP.data.futurePlans,
      };
    },
    template: `
      <div>
        <div class="future-hero">
          <p class="future-message">"{{ future.message }}"</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:40px" class="future-info-grid">
          <div>
            <div class="section-eyebrow">EDUCATION PATH</div>
            <p style="font-family:var(--font-body);font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;margin-top:12px">{{ future.college }}</p>
          </div>
          <div>
            <div class="section-eyebrow">CAREER VISION</div>
            <p style="font-family:var(--font-body);font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;margin-top:12px">{{ future.career }}</p>
          </div>
        </div>
        <div class="section-eyebrow">MISSION OBJECTIVES</div>
        <ul class="future-goals-list" style="margin-top:20px">
          <li v-for="(goal, i) in future.goals" :key="i" class="future-goal">{{ goal }}</li>
        </ul>
      </div>
    `
  }).mount('#vue-future');

  // ── Unknown Route Vue App ──
  createApp({
    data() {
      return {
        future: APP.data.futurePlans,
        dev: APP.data.developer,
      };
    },
    template: `
      <div>
        <ul class="unknown-goals">
          <li v-for="(goal, i) in future.goals" :key="i" class="unknown-goal">{{ goal }}</li>
        </ul>
      </div>
    `
  }).mount('#vue-unknown');
}

// ── Featured Section CSS (injected) ──────────────────────────
function injectFeaturedCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .featured-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
      align-items: start;
    }
    .featured-main {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,0,51,0.15);
      overflow: hidden;
    }
    .featured-main-img {
      width: 100%; height: 360px; object-fit: cover; display: block;
    }
    .featured-main-body { padding: 32px; }
    .featured-tag {
      font-family: var(--font-ui); font-size: 10px; font-weight: 700;
      letter-spacing: 0.4em; color: var(--red); margin-bottom: 12px;
    }
    .featured-title {
      font-family: var(--font-display); font-size: 42px; color: var(--white);
      line-height: 1; margin: 10px 0 14px;
    }
    .featured-desc {
      font-family: var(--font-body); font-size: 15px;
      color: rgba(255,255,255,0.65); line-height: 1.7; margin-bottom: 24px;
    }
    .featured-actions { display: flex; align-items: center; }
    .featured-sidebar { display: flex; flex-direction: column; gap: 10px; }
    .featured-thumb {
      display: flex; gap: 12px; align-items: center; padding: 12px;
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
      cursor: none; transition: all 0.2s ease;
    }
    .featured-thumb.active {
      border-color: var(--red); background: rgba(255,0,51,0.05);
    }
    .featured-thumb:hover { border-color: rgba(255,0,51,0.3); }
    .featured-thumb-img { width: 60px; height: 44px; object-fit: cover; flex-shrink: 0; }
    .featured-thumb-info { display: flex; flex-direction: column; gap: 2px; }
    .featured-thumb-year {
      font-family: var(--font-mono); font-size: 9px; color: var(--red); letter-spacing: 0.2em;
    }
    .featured-thumb-title {
      font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--white);
    }
    @media(max-width:768px) {
      .featured-layout { grid-template-columns: 1fr; }
      .featured-main-img { height: 200px; }
      .future-info-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(style);
}


// ── Init Everything ───────────────────────────────────────────
async function init() {
  // Show startup immediately — don't block on data fetch
  initBgShapes();
  updateClock();
  setInterval(updateClock, 1000);
  injectFeaturedCSS();
  initStartup();
  initSkipBtn();
  initMusicBtn();

  showScreen('startup');
  gsap.fromTo('.startup-title',
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 }
  );
  gsap.fromTo('.startup-badge, .startup-sub, .startup-divider, .startup-prompt, .startup-buttons',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.6 }
  );
  gsap.fromTo('.startup-corner-tl, .startup-corner-br',
    { opacity: 0, scale: 0.5 },
    { opacity: 0.6, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(2)', delay: 0.2 }
  );

  // Load data in background
  await loadData();

  const menuPlay    = $('#menu-play');
  const menuGallery = $('#menu-gallery');
  const menuStats   = $('#menu-stats');
  const menuAbout   = $('#menu-about');
  const menuExit    = $('#menu-exit');

  menuPlay?.addEventListener('click',    () => showSaveScreen());
  menuGallery?.addEventListener('click', () => { triggerGlitch(); setTimeout(() => showContentScreen('portfolio'), 300); });
  menuStats?.addEventListener('click',   () => { triggerGlitch(); setTimeout(() => showContentScreen('stats'), 300); });
  menuAbout?.addEventListener('click',   () => { triggerGlitch(); setTimeout(() => showContentScreen('about'), 300); });
  menuExit?.addEventListener('click',    () => triggerExitReality());

  $$('.save-card').forEach(card => {
    card.addEventListener('click', () => {
      handleSaveSelect(parseInt(card.dataset.saveId));
    });
  });

  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => showContentScreen(link.dataset.section));
  });

  $$('.back-to-menu, #nav-back').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerGlitch();
      setTimeout(() => {
        $$('.screen').forEach(s => s.classList.remove('active'));
        $('#screen-content').classList.remove('active');
        $('#screen-unknown').classList.remove('active');
        showScreen('menu');
        initMenu();
      }, 400);
    });
  });

  $('#saves-back')?.addEventListener('click', () => {
    triggerGlitch();
    setTimeout(() => showScreen('menu'), 300);
  });

  $('#unknown-back')?.addEventListener('click', () => {
    triggerGlitch();
    const unknownScreen = $('#screen-unknown');
    unknownScreen.classList.remove('active');
    setTimeout(() => showScreen('saves'), 400);
  });

  $('#modal-close')?.addEventListener('click', closeModal);
  $('#modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#modal-overlay')?.classList.contains('open')) {
      closeModal();
    }
  });

  initVueApp();
  console.log('[Phantom Portfolio] Initialized ✓');
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);