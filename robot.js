/* robot.js — RoboMind Robot Rendering System */

const Robot = (() => {

  function render(mood = 'idle', size = 'md') {
    const w = size === 'lg' ? 140 : size === 'sm' ? 64 : 80;
    const h = Math.round(w * 1.2);

    const colors = {
      idle:    { eye: '#00d4ff', eyeGlow: '#00d4ff', mouth: 'smooth', body: '#6c63ff', chest: '#ffb94a' },
      correct: { eye: '#00c896', eyeGlow: '#00c896', mouth: 'happy',  body: '#00c896', chest: '#00c896' },
      wrong:   { eye: '#ff4f6e', eyeGlow: '#ff4f6e', mouth: 'sad',    body: '#ff4f6e', chest: '#ff4f6e' },
      think:   { eye: '#ffb94a', eyeGlow: '#ffb94a', mouth: 'flat',   body: '#ffb94a', chest: '#ffb94a' },
      excited: { eye: '#ff6bff', eyeGlow: '#ff6bff', mouth: 'big',    body: '#ff6bff', chest: '#ffd700' },
    };

    const c = colors[mood] || colors.idle;

    const eyeLeft  = _eye(c.eye, c.eyeGlow, mood);
    const eyeRight = _eye(c.eye, c.eyeGlow, mood);
    const mouth    = _mouth(c.mouth);
    const brows    = _brows(mood);

    return `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" style="overflow:visible">
  <defs>
    <radialGradient id="bodyGrad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#1e2240"/>
      <stop offset="100%" stop-color="#111525"/>
    </radialGradient>
    <filter id="glow-${mood}">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.body}"/>
      <stop offset="100%" stop-color="${c.body}88"/>
    </linearGradient>
  </defs>

  <!-- Floating group -->
  <g style="animation: robotFloat 3s ease-in-out infinite">

    <!-- Antenna -->
    <line x1="50" y1="2" x2="50" y2="14" stroke="${c.body}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="50" cy="2" r="4" fill="${c.eye}" filter="url(#glow-${mood})" opacity=".9">
      <animate attributeName="r" values="3.5;5;3.5" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".9;.5;.9" dur="2s" repeatCount="indefinite"/>
    </circle>

    <!-- Head shadow -->
    <ellipse cx="50" cy="64" rx="28" ry="4" fill="#000" opacity=".15"/>

    <!-- Head -->
    <rect x="16" y="14" width="68" height="50" rx="16" fill="url(#bodyGrad)" stroke="${c.body}" stroke-width="1.5" stroke-opacity=".6"/>

    <!-- Head top glow stripe -->
    <rect x="26" y="17" width="48" height="6" rx="3" fill="${c.body}" opacity=".12"/>

    <!-- Brows -->
    ${brows}

    <!-- Eyes -->
    <g transform="translate(28, 30)">${eyeLeft}</g>
    <g transform="translate(56, 30)">${eyeRight}</g>

    <!-- Mouth -->
    <g transform="translate(50, 52)">${mouth}</g>

    <!-- Ear ports -->
    <rect x="9"  y="28" width="7" height="14" rx="3.5" fill="${c.body}" opacity=".5"/>
    <rect x="84" y="28" width="7" height="14" rx="3.5" fill="${c.body}" opacity=".5"/>
    <circle cx="12.5" cy="35" r="2" fill="${c.eye}" opacity=".7">
      <animate attributeName="opacity" values=".7;.2;.7" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    <circle cx="87.5" cy="35" r="2" fill="${c.eye}" opacity=".7">
      <animate attributeName="opacity" values=".2;.7;.2" dur="1.8s" repeatCount="indefinite"/>
    </circle>

    <!-- Neck -->
    <rect x="42" y="64" width="16" height="8" rx="4" fill="#111525" stroke="${c.body}" stroke-width="1" stroke-opacity=".4"/>

    <!-- Body -->
    <rect x="18" y="72" width="64" height="46" rx="14" fill="url(#bodyGrad)" stroke="${c.body}" stroke-width="1.5" stroke-opacity=".5"/>

    <!-- Chest panel -->
    <rect x="28" y="80" width="44" height="28" rx="8" fill="#0b0c14" stroke="${c.body}" stroke-width="1" stroke-opacity=".3"/>

    <!-- Chest lights -->
    <circle cx="38" cy="90" r="4.5" fill="${c.chest}" filter="url(#glow-${mood})" opacity=".9">
      <animate attributeName="opacity" values="1;.4;1" dur="1.4s" repeatCount="indefinite"/>
    </circle>
    <circle cx="50" cy="90" r="4.5" fill="${c.eye}" opacity=".8">
      <animate attributeName="opacity" values=".4;1;.4" dur="1.1s" repeatCount="indefinite"/>
    </circle>
    <circle cx="62" cy="90" r="4.5" fill="${c.body}" opacity=".8">
      <animate attributeName="opacity" values=".8;.3;.8" dur=".9s" repeatCount="indefinite"/>
    </circle>

    <!-- Chest scan line -->
    <rect x="29" y="100" width="42" height="2" rx="1" fill="${c.body}" opacity=".25">
      <animate attributeName="opacity" values=".1;.4;.1" dur="2s" repeatCount="indefinite"/>
    </rect>
    <rect x="29" y="104" width="28" height="1.5" rx="1" fill="${c.eye}" opacity=".2">
      <animate attributeName="opacity" values=".2;.5;.2" dur="1.5s" repeatCount="indefinite"/>
    </rect>

    <!-- Arms -->
    <rect x="3"  y="74" width="13" height="36" rx="6.5" fill="#111525" stroke="${c.body}" stroke-width="1.2" stroke-opacity=".5"/>
    <rect x="84" y="74" width="13" height="36" rx="6.5" fill="#111525" stroke="${c.body}" stroke-width="1.2" stroke-opacity=".5"/>

    <!-- Hands -->
    <circle cx="9.5"  cy="114" r="7" fill="#1e2240" stroke="${c.body}" stroke-width="1.2" stroke-opacity=".5"/>
    <circle cx="90.5" cy="114" r="7" fill="#1e2240" stroke="${c.body}" stroke-width="1.2" stroke-opacity=".5"/>
    <!-- Knuckles -->
    <circle cx="7"  cy="112" r="2" fill="${c.body}" opacity=".3"/>
    <circle cx="12" cy="112" r="2" fill="${c.body}" opacity=".3"/>
    <circle cx="88" cy="112" r="2" fill="${c.body}" opacity=".3"/>
    <circle cx="93" cy="112" r="2" fill="${c.body}" opacity=".3"/>

  </g>

  <style>
    @keyframes robotFloat {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  </style>
</svg>`;
  }

  function _eye(color, glow, mood) {
    if (mood === 'correct') {
      return `<path d="M-7 0 Q0 -8 7 0" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    }
    if (mood === 'wrong') {
      return `<path d="M-7 -4 Q0 2 7 -4" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    }
    if (mood === 'think') {
      return `<ellipse rx="7" ry="4" fill="${color}" opacity=".8"/>
              <ellipse rx="3" ry="4" fill="#fff" opacity=".9" transform="translate(2,0)"/>`;
    }
    // idle / default — circular glowing eye
    return `<circle r="7" fill="${color}" opacity=".9" filter="url(#glow-${mood})"/>
            <circle r="3.5" fill="#fff" opacity=".95" transform="translate(2,-1)"/>
            <circle r="1.2" fill="${color}" opacity=".6" transform="translate(2,-1)"/>`;
  }

  function _mouth(type) {
    switch (type) {
      case 'happy':
        return `<path d="M-12 0 Q0 10 12 0" stroke="#00c896" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      case 'big':
        return `<path d="M-12 -2 Q0 14 12 -2" stroke="#ff6bff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      case 'sad':
        return `<path d="M-10 4 Q0 -6 10 4" stroke="#ff4f6e" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      case 'flat':
        return `<line x1="-8" y1="0" x2="8" y2="0" stroke="#ffb94a" stroke-width="2.5" stroke-linecap="round"/>`;
      default:
        return `<rect x="-10" y="-3" width="20" height="6" rx="3" fill="#6c63ff" opacity=".6"/>
                <rect x="-8" y="-1" width="4" height="2" rx="1" fill="#00d4ff" opacity=".8"/>
                <rect x="-2" y="-1" width="4" height="2" rx="1" fill="#00d4ff" opacity=".6"/>
                <rect x="4"  y="-1" width="4" height="2" rx="1" fill="#00d4ff" opacity=".4"/>`;
    }
  }

  function _brows(mood) {
    if (mood === 'correct') return `
      <line x1="22" y1="22" x2="34" y2="18" stroke="#00c896" stroke-width="2" stroke-linecap="round"/>
      <line x1="66" y1="18" x2="78" y2="22" stroke="#00c896" stroke-width="2" stroke-linecap="round"/>`;
    if (mood === 'wrong') return `
      <line x1="22" y1="18" x2="34" y2="22" stroke="#ff4f6e" stroke-width="2" stroke-linecap="round"/>
      <line x1="66" y1="22" x2="78" y2="18" stroke="#ff4f6e" stroke-width="2" stroke-linecap="round"/>`;
    if (mood === 'think') return `
      <line x1="22" y1="22" x2="34" y2="20" stroke="#ffb94a" stroke-width="2" stroke-linecap="round"/>
      <line x1="66" y1="20" x2="78" y2="22" stroke="#ffb94a" stroke-width="2" stroke-linecap="round"/>`;
    return '';
  }

  // Messages keyed by mood + tier
  const MESSAGES = {
    idle: [
      "Processing your challenge...",
      "Engaging neural circuits...",
      "Ready to test your mind?",
      "Think carefully. I'll wait.",
      "Analyzing problem parameters...",
    ],
    correct: [
      "Excellent logic! Neural sync achieved.",
      "Pattern recognized. Well done.",
      "Brain activity optimal. Keep going!",
      "Correct! Your mind is sharp.",
      "Impressive. Processing next challenge.",
      "That's the answer. Good thinking.",
    ],
    wrong: [
      "Incorrect. Recalibrating...",
      "Error detected. Try again.",
      "Not quite. Think deeper.",
      "Logic mismatch. Refocus and retry.",
      "Wrong path. Reconsider the variables.",
    ],
    think: [
      "Hmm... take your time.",
      "Thinking... I can wait.",
      "Processing... don't rush.",
      "Consider all possibilities.",
    ],
    excited: [
      "Incredible streak! Maximum output!",
      "You're on fire! Neural overdrive!",
      "Unstoppable! Brain fully charged!",
      "Legendary performance detected!",
    ],
    levelup: [
      "Tier upgrade initiated. New challenges unlocked.",
      "Brain capacity: expanding. Welcome to the next level.",
      "Neural evolution complete. Harder challenges await.",
    ],
    timeout: [
      "Time expired. Calculating next problem.",
      "Clock ran out. Stay focused next time.",
      "Timeout. Let's move forward.",
    ],
  };

  function getMessage(mood) {
    const pool = MESSAGES[mood] || MESSAGES.idle;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return { render, getMessage };
})();
