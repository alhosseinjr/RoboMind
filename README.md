# RoboMind — Cognitive Training Platform

A brain-training web app powered by Groq AI. Not just math — real cognitive challenges across logic, patterns, lateral thinking, spatial reasoning, deduction, and more.

## Features

- **4 Difficulty Tiers**: Spark → Charge → Surge → Overload
- **6 Challenge Categories**: Logic, Patterns, Spatial, Lateral Thinking, Math Reasoning, All Types
- **AI-Powered Questions**: Groq API (Llama 3.3-70b) generates fresh, unique challenges every session
- **Animated Robot Companion**: Reacts to your performance in real-time
- **3 Themes**: Dark / Light / Kids
- **Power-ups**: Hints and Skips per session
- **Scoring System**: Streaks, time bonuses, tier multipliers
- **Zero dependencies**: Pure HTML/CSS/JS — no build step required

---

## Deploy to Vercel

### Option 1: Vercel Dashboard (easiest)
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Click **Deploy** — done

### Option 2: Vercel CLI
```bash
npm i -g vercel
cd robomind
vercel --prod
```

---

## File Structure

```
robomind/
├── index.html      # App shell & screens
├── styles.css      # Full theme system (dark/light/kids)
├── robot.js        # SVG robot renderer + messages
├── questions.js    # Groq API integration + fallback bank
├── app.js          # Game logic, state, UI controller
└── vercel.json     # Vercel deployment config
```

---

## Groq API

Questions are generated via Groq's Llama 3.3-70b model. If the API fails, a built-in fallback question bank is used automatically so the app always works.

The API key is embedded in `questions.js`. To change it, update `GROQ_API_KEY` in that file.

---

## Customization

- **Session length**: Change `SESSION_LENGTH` in `app.js` (default: 10)
- **Timer per tier**: Change `TIMER_BY_TIER` in `app.js`
- **Add question types**: Extend `TYPES` and `CATEGORY_TYPES` in `questions.js`
- **Add fallback questions**: Extend the `FALLBACK` object in `questions.js`
