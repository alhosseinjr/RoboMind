/* app.js — RoboMind Main Application */

(() => {
  'use strict';

  // ─── State ────────────────────────────────────────────────────
  const STATE = {
    screen: 'setup',
    robotName: 'ARIA',
    tier: null,
    category: 'mixed',
    theme: 'dark',

    // Session
    questions: [],
    currentIndex: 0,
    totalQ: 10,
    score: 0,
    streak: 0,
    maxStreak: 0,
    correctCount: 0,
    usedIds: [],
    answerTimes: [],
    questionStartTime: null,

    // Current question
    currentQ: null,
    answered: false,
    hintShown: false,

    // Power-ups
    hintsLeft: 2,
    skipsLeft: 1,

    // Timer
    timerMax: 0,
    timerVal: 0,
    timerInterval: null,
  };

  const TIMER_BY_TIER = { 1: 45, 2: 60, 3: 90, 4: 120 };
  const SESSION_LENGTH = 10;

  // ─── DOM refs ─────────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  // ─── Init ─────────────────────────────────────────────────────
  function init() {
    buildParticles();
    setupThemeButtons();
    setupSetupScreen();
    renderSetupRobot();
  }

  // ─── Particles ────────────────────────────────────────────────
  function buildParticles() {
    const c = $('particles-container');
    for (let i = 0; i < 35; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 3 + 1;
      p.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}%;
        background: hsl(${Math.random() * 60 + 220}, 80%, 70%);
        --dur: ${(Math.random() * 8 + 5).toFixed(1)}s;
        --delay: -${(Math.random() * 8).toFixed(1)}s;
      `;
      c.appendChild(p);
    }
  }

  // ─── Theme ───────────────────────────────────────────────────
  function setupThemeButtons() {
    // All theme buttons (setup + play)
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-theme]');
      if (!btn) return;
      const theme = btn.dataset.theme;
      if (!['dark','light','kids'].includes(theme)) return;
      setTheme(theme);
    });
  }

  function setTheme(theme) {
    STATE.theme = theme;
    document.body.setAttribute('data-theme', theme);

    // Update all theme buttons
    document.querySelectorAll('.theme-btn, .theme-btn-mini').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });
  }

  // ─── SETUP SCREEN ────────────────────────────────────────────
  function setupSetupScreen() {
    // Robot name input
    $('robot-name-input').addEventListener('input', e => {
      STATE.robotName = e.target.value.trim() || 'ARIA';
      checkLaunchReady();
    });

    // Category buttons
    $('category-grid').addEventListener('click', e => {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.category = btn.dataset.cat;
    });

    // Tier buttons
    $('tier-grid').addEventListener('click', e => {
      const btn = e.target.closest('.tier-btn');
      if (!btn) return;
      document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      STATE.tier = parseInt(btn.dataset.tier);
      checkLaunchReady();
    });

    // Launch button
    $('btn-launch').addEventListener('click', () => {
      if (!STATE.tier) return;
      startSession();
    });

    // Result screen buttons
    $('btn-play-again').addEventListener('click', () => startSession());
    $('btn-change-tier').addEventListener('click', () => showScreen('setup'));
    $('btn-home').addEventListener('click', () => showScreen('setup'));
  }

  function checkLaunchReady() {
    $('btn-launch').disabled = !STATE.tier;
  }

  function renderSetupRobot() {
    $('setup-robot').innerHTML = Robot.render('idle', 'sm');
  }

  // ─── SESSION START ────────────────────────────────────────────
  async function startSession() {
    // Reset state
    STATE.questions = [];
    STATE.currentIndex = 0;
    STATE.score = 0;
    STATE.streak = 0;
    STATE.maxStreak = 0;
    STATE.correctCount = 0;
    STATE.usedIds = [];
    STATE.answerTimes = [];
    STATE.hintsLeft = 2;
    STATE.skipsLeft = 1;

    showScreen('play');
    setupPlayControls();
    updateSidebarStats();
    updateRobotDisplay('idle');
    setRobotSpeech(Robot.getMessage('idle'));
    $('robot-name-display').textContent = STATE.robotName.toUpperCase();

    // Load first question
    await loadNextQuestion();
  }

  function setupPlayControls() {
    $('btn-quit').onclick = () => {
      stopTimer();
      showScreen('setup');
    };
    $('btn-next').onclick = () => nextQuestion();
    $('pu-hint').onclick = () => useHint();
    $('pu-skip').onclick = () => useSkip();

    // Mini theme buttons inside play screen
    document.querySelectorAll('.theme-btn-mini').forEach(b => {
      b.onclick = () => setTheme(b.dataset.theme);
    });

    updatePowerupUI();
  }

  // ─── QUESTION LOADING ────────────────────────────────────────
  async function loadNextQuestion() {
    STATE.answered = false;
    STATE.hintShown = false;

    // Reset UI
    $('question-body').innerHTML = `
      <div class="loading-question">
        <div class="loading-spinner"></div>
        <p>Generating your challenge...</p>
      </div>`;
    $('answer-zone').innerHTML = '';
    $('hint-box').classList.add('hidden');
    $('feedback-bar').classList.add('hidden');
    $('feedback-bar').className = 'feedback-bar hidden';

    updateSidebarStats();
    updateRobotDisplay('think');
    setRobotSpeech(Robot.getMessage('think'));

    try {
      const q = await QuestionEngine.getQuestion(STATE.tier, STATE.category, STATE.usedIds);
      STATE.currentQ = q;
      STATE.usedIds.push(q.id);
      STATE.questionStartTime = Date.now();

      renderQuestion(q);
      startTimer(TIMER_BY_TIER[STATE.tier]);
      updateRobotDisplay('idle');
      setRobotSpeech(Robot.getMessage('idle'));
    } catch (err) {
      $('question-body').innerHTML = `<p style="color:var(--danger)">Failed to load question. Please check your connection.</p>`;
      console.error(err);
    }
  }

  function renderQuestion(q) {
    // Type badge
    $('q-type-badge').textContent = q.typeLabel || q.type;
    $('q-type-badge').style.background = (q.typeColor || '#7c6fff') + '22';
    $('q-type-badge').style.color = q.typeColor || '#7c6fff';
    $('q-type-badge').style.borderColor = (q.typeColor || '#7c6fff') + '44';
    $('q-difficulty').textContent = `Tier ${STATE.tier}`;

    // Question text
    $('question-body').innerHTML = `<div class="q-text">${formatQuestionText(q.question)}</div>`;

    // Answers
    const zone = $('answer-zone');
    if (q.answer_type === 'mcq' && Array.isArray(q.options)) {
      zone.className = 'answer-zone grid-2';
      zone.innerHTML = q.options.map((opt, i) => `
        <button class="ans-btn" data-value="${escapeHtml(opt)}" onclick="app_answerMCQ(this, '${escapeJs(opt)}')">
          <span class="ans-letter">${'ABCD'[i]}</span>
          <span>${opt}</span>
        </button>`).join('');
    } else {
      zone.className = 'answer-zone grid-1';
      zone.innerHTML = `
        <div class="open-answer-wrap">
          <input type="text" class="open-input" id="open-input" placeholder="Type your answer..." autocomplete="off"/>
          <button class="btn-submit" onclick="app_answerOpen()">Submit Answer</button>
        </div>`;
      const inp = $('open-input');
      inp.focus();
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') app_answerOpen(); });
    }
  }

  function formatQuestionText(text) {
    // Convert newlines to <br>, wrap code-like sequences
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>')
      .replace(/`([^`]+)`/g, '<code style="font-family:var(--font-mono);background:var(--bg2);padding:2px 6px;border-radius:4px">$1</code>');
  }

  function escapeHtml(str) { return String(str).replace(/"/g, '&quot;'); }
  function escapeJs(str)   { return String(str).replace(/'/g, "\\'"); }

  // ─── ANSWERING ────────────────────────────────────────────────
  window.app_answerMCQ = function(btn, value) {
    if (STATE.answered) return;
    processAnswer(value);
  };

  window.app_answerOpen = function() {
    if (STATE.answered) return;
    const inp = $('open-input');
    if (!inp) return;
    const val = inp.value.trim();
    if (!val) return;
    processAnswer(val);
  };

  function processAnswer(userAnswer) {
    STATE.answered = true;
    stopTimer();

    const elapsed = Date.now() - STATE.questionStartTime;
    STATE.answerTimes.push(elapsed);

    const q = STATE.currentQ;
    const correct = isCorrect(userAnswer, q.correct);

    if (correct) {
      onCorrect(userAnswer, q);
    } else {
      onWrong(userAnswer, q);
    }
  }

  function isCorrect(userAns, correct) {
    const u = String(userAns).toLowerCase().trim();
    const c = String(correct).toLowerCase().trim();
    // Exact or contains
    return u === c || c.includes(u) || u.includes(c.substring(0, Math.min(c.length, 20)));
  }

  function onCorrect(userAns, q) {
    STATE.correctCount++;
    STATE.streak++;
    STATE.maxStreak = Math.max(STATE.maxStreak, STATE.streak);

    const timeBonus = STATE.timerVal > STATE.timerMax * 0.6 ? 20 : 0;
    const streakBonus = STATE.streak >= 5 ? 30 : STATE.streak >= 3 ? 15 : 0;
    const pts = 100 + timeBonus + streakBonus + (STATE.tier * 25);
    STATE.score += pts;

    // Highlight answer
    highlightAnswers(userAns, q.correct, true);

    // Robot
    const mood = STATE.streak >= 5 ? 'excited' : 'correct';
    updateRobotDisplay(mood);
    setRobotSpeech(Robot.getMessage(mood));
    showFlash('check');

    // Feedback
    showFeedback(true, `+${pts} pts${streakBonus > 0 ? ` · Streak bonus!` : ''}`, q.explanation);

    updateSidebarStats();
    updatePowerupUI();
  }

  function onWrong(userAns, q) {
    STATE.streak = 0;

    highlightAnswers(userAns, q.correct, false);
    updateRobotDisplay('wrong');
    setRobotSpeech(Robot.getMessage('wrong'));
    showFlash('x');

    showFeedback(false, `Correct answer: ${q.correct}`, q.explanation);
    updateSidebarStats();
  }

  function highlightAnswers(userAns, correctAns, wasCorrect) {
    const btns = document.querySelectorAll('.ans-btn');
    btns.forEach(btn => {
      btn.disabled = true;
      const val = btn.dataset.value;
      if (val === correctAns) { btn.classList.add('correct'); }
      else if (val === userAns && !wasCorrect) { btn.classList.add('wrong'); }
    });

    // Open input
    const inp = $('open-input');
    if (inp) {
      inp.disabled = true;
      inp.style.borderColor = wasCorrect ? 'var(--success)' : 'var(--danger)';
    }

    // Animate
    const zone = $('answer-zone');
    if (wasCorrect) zone.style.animation = 'pulseCorrect .4s ease';
    else zone.style.animation = 'shakeAnim .4s ease';
    setTimeout(() => { zone.style.animation = ''; }, 500);
  }

  function showFeedback(correct, title, explain) {
    const fb = $('feedback-bar');
    fb.className = `feedback-bar ${correct ? 'correct-fb' : 'wrong-fb'}`;
    $('feedback-icon').innerHTML = correct
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    $('feedback-title').textContent = title;
    $('feedback-title').style.color = correct ? 'var(--success)' : 'var(--danger)';
    $('feedback-explain').textContent = explain || '';
  }

  async function nextQuestion() {
    STATE.currentIndex++;
    if (STATE.currentIndex >= SESSION_LENGTH) {
      endSession();
      return;
    }
    await loadNextQuestion();
  }

  // ─── TIMER ───────────────────────────────────────────────────
  function startTimer(sec) {
    stopTimer();
    STATE.timerMax = sec;
    STATE.timerVal = sec;
    updateTimerUI();
    STATE.timerInterval = setInterval(() => {
      STATE.timerVal--;
      if (STATE.timerVal <= 0) {
        stopTimer();
        onTimeout();
      } else {
        updateTimerUI();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(STATE.timerInterval);
    STATE.timerInterval = null;
  }

  function updateTimerUI() {
    const arc = $('timer-arc');
    const num = $('timer-num');
    if (!arc || !num) return;
    const pct = STATE.timerVal / STATE.timerMax;
    const circumference = 113;
    arc.style.strokeDashoffset = circumference * (1 - pct);
    arc.style.stroke = pct > .5 ? 'var(--success)' : pct > .25 ? 'var(--warn)' : 'var(--danger)';
    num.textContent = STATE.timerVal;
    num.style.color = arc.style.stroke;
  }

  function onTimeout() {
    if (STATE.answered) return;
    STATE.answered = true;
    STATE.streak = 0;
    STATE.answerTimes.push(STATE.timerMax * 1000);

    highlightAnswers(null, STATE.currentQ.correct, false);
    updateRobotDisplay('wrong');
    setRobotSpeech(Robot.getMessage('timeout'));
    showFlash('x');
    showFeedback(false, `Time's up! Correct: ${STATE.currentQ.correct}`, STATE.currentQ.explanation);
    updateSidebarStats();
  }

  // ─── POWER-UPS ───────────────────────────────────────────────
  function useHint() {
    if (STATE.hintsLeft <= 0 || STATE.answered || STATE.hintShown) return;
    STATE.hintsLeft--;
    STATE.hintShown = true;
    $('hint-text').textContent = STATE.currentQ.hint || 'No hint available.';
    $('hint-box').classList.remove('hidden');
    setRobotSpeech(Robot.getMessage('think'));
    updatePowerupUI();
  }

  function useSkip() {
    if (STATE.skipsLeft <= 0 || STATE.answered) return;
    STATE.skipsLeft--;
    stopTimer();
    STATE.answered = true;
    STATE.streak = 0;
    STATE.answerTimes.push(0);
    setRobotSpeech('Skipping to next challenge...');
    updatePowerupUI();
    setTimeout(() => nextQuestion(), 600);
  }

  function updatePowerupUI() {
    const hint = $('pu-hint');
    const skip = $('pu-skip');
    $('pu-hint-count').textContent = STATE.hintsLeft;
    $('pu-skip-count').textContent = STATE.skipsLeft;
    if (hint) hint.disabled = STATE.hintsLeft <= 0;
    if (skip) skip.disabled = STATE.skipsLeft <= 0;
  }

  // ─── SIDEBAR STATS ────────────────────────────────────────────
  function updateSidebarStats() {
    $('stat-score').textContent  = STATE.score.toLocaleString();
    $('stat-q').textContent      = `${STATE.currentIndex}/${SESSION_LENGTH}`;
    $('stat-streak').textContent = STATE.streak;
    $('stat-tier').textContent   = ['—','Spark','Charge','Surge','Overload'][STATE.tier] || '—';

    const pct = (STATE.currentIndex / SESSION_LENGTH) * 100;
    $('progress-fill').style.width = `${pct}%`;
    $('progress-pct').textContent  = `${Math.round(pct)}%`;
  }

  // ─── ROBOT UI ────────────────────────────────────────────────
  function updateRobotDisplay(mood) {
    const el = $('play-robot');
    if (el) el.innerHTML = Robot.render(mood, 'sm');
  }

  function setRobotSpeech(msg) {
    const el = $('robot-speech');
    if (el) { el.style.opacity = 0; setTimeout(() => { el.textContent = msg; el.style.opacity = 1; }, 150); }
  }

  // ─── FLASH OVERLAY ───────────────────────────────────────────
  function showFlash(type) {
    const el = $('flash-overlay');
    el.innerHTML = type === 'check'
      ? `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  // ─── SCREEN NAVIGATION ───────────────────────────────────────
  function showScreen(name) {
    stopTimer();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = $(`screen-${name}`);
    if (target) target.classList.add('active');
    STATE.screen = name;
  }

  // ─── SESSION END ─────────────────────────────────────────────
  function endSession() {
    stopTimer();

    const pct = Math.round((STATE.correctCount / SESSION_LENGTH) * 100);
    const avgTime = STATE.answerTimes.length
      ? Math.round(STATE.answerTimes.reduce((a, b) => a + b, 0) / STATE.answerTimes.length / 1000)
      : 0;

    const tierNames = ['—','Spark','Charge','Surge','Overload'];
    const msgs = [
      { min: 90, text: `Outstanding. Your mind operates at peak performance. ${STATE.robotName} is fully charged.` },
      { min: 70, text: `Strong performance. Your reasoning is sharp. Keep pushing higher.` },
      { min: 50, text: `Good effort. You're building real cognitive strength with each session.` },
      { min: 0,  text: `Every challenge is a lesson. The brain grows strongest under pressure. Try again.` },
    ];
    const msg = msgs.find(m => pct >= m.min)?.text || msgs[3].text;

    const resultMood = pct >= 70 ? 'correct' : pct >= 50 ? 'idle' : 'wrong';
    const resultTitle = pct >= 90 ? 'Flawless Mind' : pct >= 70 ? 'Sharp Thinker' : pct >= 50 ? 'Good Session' : 'Keep Training';

    showScreen('result');

    $('result-robot').innerHTML = Robot.render(resultMood, 'lg');
    $('result-title').textContent = resultTitle;
    $('result-sub').textContent = `${tierNames[STATE.tier]} Tier · ${STATE.category === 'mixed' ? 'All Types' : STATE.category}`;
    $('res-score').textContent   = STATE.score.toLocaleString();
    $('res-correct').textContent = `${STATE.correctCount}/${SESSION_LENGTH}`;
    $('res-streak').textContent  = `${STATE.maxStreak}x`;
    $('res-time').textContent    = `${avgTime}s`;
    $('result-msg').textContent  = msg;

    setTimeout(() => {
      $('perf-fill').style.width = `${pct}%`;
    }, 300);
  }

  // ─── Boot ─────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

})();
