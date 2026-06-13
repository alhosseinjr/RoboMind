/* questions.js — RoboMind Question Engine (Groq API) */

const QuestionEngine = (() => {

  const GROQ_API_KEY = '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';
  const GROQ_MODEL   = 'llama-3.3-70b-versatile';
  const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';

  // ─── Type definitions ────────────────────────────────────────
  const TYPES = {
    logic:    { label: 'Logic',           color: '#7c6fff' },
    patterns: { label: 'Patterns',        color: '#00d4ff' },
    spatial:  { label: 'Spatial',         color: '#00c896' },
    lateral:  { label: 'Lateral Thinking',color: '#ffb94a' },
    math:     { label: 'Math Reasoning',  color: '#ff6bff' },
    deduction:{ label: 'Deduction',       color: '#f87171' },
    memory:   { label: 'Memory+Logic',    color: '#60a5fa' },
    sequence: { label: 'Sequence',        color: '#4ade80' },
  };

  const CATEGORY_TYPES = {
    mixed:    ['logic','patterns','spatial','lateral','math','deduction','sequence'],
    logic:    ['logic','deduction'],
    patterns: ['patterns','sequence'],
    spatial:  ['spatial'],
    lateral:  ['lateral'],
    math:     ['math','deduction'],
  };

  // ─── Prompt builder ──────────────────────────────────────────
  function buildPrompt(tier, category, usedIds = []) {
    const types = CATEGORY_TYPES[category] || CATEGORY_TYPES.mixed;
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const tierDesc = {
      1: 'beginner level (age 8+). Simple, clear, easy to understand. Single-step reasoning.',
      2: 'intermediate level. Requires 2–3 reasoning steps. Moderately challenging.',
      3: 'advanced level. Complex multi-step reasoning, abstract thinking required.',
      4: 'elite level. Extremely difficult. Multi-constraint deduction. Most people cannot solve this.',
    }[tier];

    const typeGuide = {
      logic:    'Create a logic puzzle involving true/false statements, people, or objects (e.g. who is lying, what is true).',
      patterns: 'Create a number or letter sequence with a non-obvious pattern. Ask what comes next.',
      spatial:  'Create a spatial or visual reasoning problem described in text (rotating shapes, counting blocks, folding paper).',
      lateral:  'Create a lateral thinking riddle or "situation puzzle" where the answer requires creative, non-obvious thinking.',
      math:     'Create a math reasoning problem (NOT simple arithmetic). Focus on "which is larger", estimation, number logic, or word problems requiring reasoning.',
      deduction:'Create a deduction puzzle where the solver must narrow down possibilities using clues (like Zebra puzzle style, but shorter).',
      sequence: 'Create a sequence puzzle (number, letter, or mixed) with a clear but non-trivial rule.',
    }[chosenType];

    return {
      type: chosenType,
      prompt: `You are a cognitive training question generator for RoboMind, a brain training app.

Generate ONE brain-training question of type: ${chosenType.toUpperCase()}
Difficulty: ${tierDesc}
Instructions: ${typeGuide}

STRICT OUTPUT FORMAT (JSON only, no extra text, no markdown):
{
  "id": "${chosenType}_t${tier}_${Date.now()}",
  "type": "${chosenType}",
  "question": "The full question text here. Be clear and specific.",
  "answer_type": "mcq" or "open",
  "options": ["Option A", "Option B", "Option C", "Option D"] (only if mcq, otherwise null),
  "correct": "The exact correct answer (matching one option if mcq)",
  "explanation": "A clear 1-2 sentence explanation of why this is correct.",
  "hint": "A subtle hint that helps without giving away the answer."
}

Rules:
- For tier 1-2, prefer mcq with 4 clear options.
- For tier 3-4, mix of mcq and open-ended.
- Options must be clearly distinct (no trick wording).
- The correct answer must be unambiguously correct.
- Explanation must be educational.
- Do NOT generate arithmetic-only questions (no "2+2=?").
- Make questions genuinely engaging and brain-stimulating.
- Output ONLY the JSON object. Nothing else.`
    };
  }

  // ─── Groq API call ───────────────────────────────────────────
  async function fetchFromGroq(tier, category, usedIds = []) {
    const { type, prompt } = buildPrompt(tier, category, usedIds);
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 600,
      }),
    });

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response from Groq');

    // Clean potential markdown fences
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const q = JSON.parse(cleaned);

    // Normalize
    q.type = q.type || type;
    q.typeLabel = TYPES[q.type]?.label || q.type;
    q.typeColor = TYPES[q.type]?.color || '#7c6fff';
    if (q.answer_type === 'mcq' && !Array.isArray(q.options)) {
      q.answer_type = 'open';
    }
    return q;
  }

  // ─── Fallback bank ───────────────────────────────────────────
  // Used if Groq fails
  const FALLBACK = {
    1: [
      {
        id:'fb_1_1', type:'patterns', typeLabel:'Patterns', typeColor:'#00d4ff',
        question:'What comes next in this sequence?\n2, 4, 6, 8, __',
        answer_type:'mcq', options:['9','10','11','12'], correct:'10',
        explanation:'Each number increases by 2. After 8 comes 10.',
        hint:'Look at the difference between each pair of numbers.',
      },
      {
        id:'fb_1_2', type:'logic', typeLabel:'Logic', typeColor:'#7c6fff',
        question:'Alice always tells the truth. Bob always lies. Alice says "Bob told me it is raining." Is it raining?',
        answer_type:'mcq', options:['Yes','No','Cannot be determined','Both are lying'],
        correct:'No',
        explanation:'Bob always lies, so when Bob says it is raining, he is lying — it is NOT raining. Alice truthfully reports what Bob said.',
        hint:'Think about what it means for a liar to say something.',
      },
      {
        id:'fb_1_3', type:'sequence', typeLabel:'Sequence', typeColor:'#4ade80',
        question:'Which letter comes next?\nA, C, E, G, __',
        answer_type:'mcq', options:['H','I','J','K'], correct:'I',
        explanation:'The sequence skips every other letter: A, C, E, G, I (every 2nd letter of the alphabet).',
        hint:'Count how many letters are skipped each time.',
      },
      {
        id:'fb_1_4', type:'lateral', typeLabel:'Lateral Thinking', typeColor:'#ffb94a',
        question:'A man lives on the 20th floor of a building. Every morning he takes the elevator down to the ground floor and goes to work. When he returns, he takes the elevator to the 10th floor and walks up the stairs. Why?',
        answer_type:'mcq',
        options:['He enjoys exercise','He is afraid of heights','He is too short to reach the 20th floor button','The elevator is broken above floor 10'],
        correct:'He is too short to reach the 20th floor button',
        explanation:'He can reach button 10 but not button 20. In the morning he asks someone to press the ground floor button, or presses G himself.',
        hint:'Think about a physical limitation, not a preference.',
      },
      {
        id:'fb_1_5', type:'math', typeLabel:'Math Reasoning', typeColor:'#ff6bff',
        question:'Which is larger: the number of minutes in 2 hours, or the number of seconds in 2 minutes?',
        answer_type:'mcq',
        options:['Minutes in 2 hours','Seconds in 2 minutes','They are equal','Cannot be determined'],
        correct:'Minutes in 2 hours',
        explanation:'Minutes in 2 hours = 120. Seconds in 2 minutes = 120. They are equal!',
        hint:'Calculate each: 2×60 and 2×60.',
      },
    ],
    2: [
      {
        id:'fb_2_1', type:'logic', typeLabel:'Logic', typeColor:'#7c6fff',
        question:'Three friends — Amir, Bina, Cara — each own a different pet: a cat, a dog, or a fish.\n• Amir does not own the cat.\n• Bina does not own the dog.\n• Cara does not own the fish.\nWho owns the dog?',
        answer_type:'mcq', options:['Amir','Bina','Cara','Cannot be determined'],
        correct:'Amir',
        explanation:'Cara has no fish → cat or dog. Bina has no dog → cat or fish. Amir has no cat → dog or fish. Since Bina can\'t have the dog, and Cara must take dog or cat: Amir gets the dog.',
        hint:'Eliminate one option at a time for each person.',
      },
      {
        id:'fb_2_2', type:'patterns', typeLabel:'Patterns', typeColor:'#00d4ff',
        question:'What is the missing number?\n1, 1, 2, 3, 5, 8, __, 21',
        answer_type:'mcq', options:['11','12','13','14'], correct:'13',
        explanation:'This is the Fibonacci sequence: each number is the sum of the two before it. 5+8=13.',
        hint:'Look at the relationship between consecutive pairs.',
      },
      {
        id:'fb_2_3', type:'math', typeLabel:'Math Reasoning', typeColor:'#ff6bff',
        question:'A store sells apples for $0.50 each and oranges for $0.75 each. Sarah buys 4 apples and 2 oranges. How much change does she get from $5.00?',
        answer_type:'mcq', options:['$1.00','$1.50','$2.00','$2.50'], correct:'$1.50',
        explanation:'4 apples = $2.00, 2 oranges = $1.50, total = $3.50. Change from $5.00 = $1.50.',
        hint:'Calculate each fruit total separately, then subtract from $5.',
      },
      {
        id:'fb_2_4', type:'deduction', typeLabel:'Deduction', typeColor:'#f87171',
        question:'All roses are flowers. Some flowers fade quickly. Therefore, which must be true?',
        answer_type:'mcq',
        options:[
          'All roses fade quickly',
          'Some roses fade quickly',
          'No roses fade quickly',
          'None of the above must be true',
        ],
        correct:'None of the above must be true',
        explanation:'We only know all roses are flowers. We cannot deduce that any rose fades quickly — the "some flowers" that fade may not include any roses.',
        hint:'Just because some flowers fade doesn\'t mean any roses are in that group.',
      },
    ],
    3: [
      {
        id:'fb_3_1', type:'deduction', typeLabel:'Deduction', typeColor:'#f87171',
        question:'Five houses in a row are each a different color. The green house is immediately to the left of the white house. The red house is in the middle. The blue house is to the left of the red house. The yellow house is not next to the blue house. What color is the first house?',
        answer_type:'mcq', options:['Blue','Yellow','Green','Red'], correct:'Blue',
        explanation:'Red is position 3. Blue is left of red, so positions 1 or 2. Green must be left of white (consecutive). Yellow is not next to blue. Working through constraints: Blue=1, Yellow=2, Red=3, Green=4, White=5.',
        hint:'Start by placing red (position 3), then work outward with the other constraints.',
      },
      {
        id:'fb_3_2', type:'lateral', typeLabel:'Lateral Thinking', typeColor:'#ffb94a',
        question:'A woman shoots her husband. Then she holds him underwater for five minutes. A little while later, they go out to dinner together. How?',
        answer_type:'mcq',
        options:[
          'He is a ghost',
          'She is a photographer who developed his photo',
          'He survived both times',
          'It was a dream',
        ],
        correct:'She is a photographer who developed his photo',
        explanation:'She "shot" him with a camera, then held the photo in developing fluid (water) for five minutes to develop the picture.',
        hint:'The words "shot" and "held underwater" have non-violent meanings.',
      },
      {
        id:'fb_3_3', type:'patterns', typeLabel:'Patterns', typeColor:'#00d4ff',
        question:'Find the next number in the sequence:\n2, 6, 12, 20, 30, 42, __',
        answer_type:'mcq', options:['52','54','56','58'], correct:'56',
        explanation:'Differences: 4, 6, 8, 10, 12, 14... increasing by 2 each time. 42+14=56. Alternatively, the pattern is n(n+1): 1×2, 2×3, 3×4, 4×5, 5×6, 6×7=42, 7×8=56.',
        hint:'Look at the differences between consecutive terms.',
      },
    ],
    4: [
      {
        id:'fb_4_1', type:'logic', typeLabel:'Logic', typeColor:'#7c6fff',
        question:'On an island, every person is either a Knight (always tells truth) or a Knave (always lies). You meet three people: A, B, and C.\n• A says: "At least one of us is a Knave."\n• B says: "A is a Knight."\n• C says: "B and I are of different types."\n\nWhat are A, B, and C?',
        answer_type:'mcq',
        options:[
          'A=Knight, B=Knight, C=Knave',
          'A=Knight, B=Knave, C=Knight',
          'A=Knave, B=Knave, C=Knight',
          'A=Knight, B=Knight, C=Knight',
        ],
        correct:'A=Knight, B=Knight, C=Knave',
        explanation:`If A is a Knight, "at least one Knave" is true — consistent. If A is a Knave, the statement is false (no Knaves) — contradiction since A is a Knave. So A is a Knight. B says "A is a Knight" — true, so B is a Knight. C says "B and I are different" — if C were a Knight this would be true (B=Knight, C=Knight = same type) — contradiction. So C is a Knave.`,
        hint:'Start by assuming A is a Knight and check if it leads to a contradiction.',
      },
      {
        id:'fb_4_2', type:'math', typeLabel:'Math Reasoning', typeColor:'#ff6bff',
        question:'You have a 3-liter jug and a 5-liter jug, with no markings. You have unlimited water. How do you measure exactly 4 liters?',
        answer_type:'mcq',
        options:[
          'Fill 5L, pour into 3L, empty 3L, pour remaining 2L into 3L, fill 5L, pour into 3L (already has 2L) — 5L jug now has 4L.',
          'Fill both jugs and combine them.',
          'Fill 3L twice and remove 2L.',
          'This is impossible with these jugs.',
        ],
        correct:'Fill 5L, pour into 3L, empty 3L, pour remaining 2L into 3L, fill 5L, pour into 3L (already has 2L) — 5L jug now has 4L.',
        explanation:'Step 1: Fill 5L. Step 2: Pour into 3L (5L jug has 2L left). Step 3: Empty 3L. Step 4: Pour 2L into 3L. Step 5: Fill 5L. Step 6: Pour from 5L into 3L (needs 1L) → 5L jug has exactly 4L.',
        hint:'Think of it as a series of fill, pour, and empty operations.',
      },
    ],
  };

  // ─── Public: get a question ───────────────────────────────────
  async function getQuestion(tier, category, usedIds = []) {
    try {
      const q = await fetchFromGroq(tier, category, usedIds);
      return q;
    } catch (err) {
      console.warn('Groq API failed, using fallback:', err.message);
      return getFallback(tier, usedIds);
    }
  }

  function getFallback(tier, usedIds = []) {
    const pool = FALLBACK[tier] || FALLBACK[1];
    const unused = pool.filter(q => !usedIds.includes(q.id));
    const source = unused.length > 0 ? unused : pool;
    return source[Math.floor(Math.random() * source.length)];
  }

  return { getQuestion, TYPES };
})();
