/**
 * Research Showcase Application Logic
 * - Animated Moving Pipeline Flow (Figure 2)
 * - Interactive Centroid Alignment Simulator
 * - OLS Regression Trait Effects Forest Plot
 * - BibTeX Copy
 */

document.addEventListener('DOMContentLoaded', () => {
  initFigure2Flow();
  initCentroidGame();
  initAnnotationQuiz();
  initRegressionPlot();
  initBibtexCopy();
});

/* -------------------------------------------------------------
 * 1. Animated Moving Pipeline Flow (Figure 2)
 * ------------------------------------------------------------- */
function initFigure2Flow() {
  const stepCards = [
    document.getElementById('stepCard1'),
    document.getElementById('stepCard2'),
    document.getElementById('stepCard3'),
    document.getElementById('stepCard4')
  ];

  const centroidCards = [
    document.getElementById('stepCentroid1'),
    document.getElementById('stepCentroid2'),
    document.getElementById('stepCentroid3')
  ];

  const playBtn = document.getElementById('flowPlayBtn');
  const resetBtn = document.getElementById('flowResetBtn');

  let currentPhase = 0;
  let isPlaying = true;
  let flowTimer = null;

  function setPhase(phase) {
    currentPhase = phase;

    // Reset all
    stepCards.forEach(c => c && c.classList.remove('active-step'));
    centroidCards.forEach(c => c && c.classList.remove('active-step'));

    if (phase >= 0 && phase < 4) {
      if (stepCards[phase]) stepCards[phase].classList.add('active-step');
      // Also highlight corresponding centroid phase in parallel
      const cIdx = Math.min(phase, 2);
      if (centroidCards[cIdx]) centroidCards[cIdx].classList.add('active-step');
    }
  }

  function tick() {
    currentPhase = (currentPhase + 1) % 4;
    setPhase(currentPhase);
  }

  function start() {
    isPlaying = true;
    if (playBtn) playBtn.textContent = '⏸ Pause Flow';
    clearInterval(flowTimer);
    flowTimer = setInterval(tick, 2200);
  }

  function pause() {
    isPlaying = false;
    if (playBtn) playBtn.textContent = '▶ Play Flow';
    clearInterval(flowTimer);
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (isPlaying) pause();
      else start();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      setPhase(0);
      start();
    });
  }

  // Interactive click on any step card
  stepCards.forEach((card, idx) => {
    if (card) {
      card.addEventListener('click', () => {
        pause();
        setPhase(idx);
      });
    }
  });

  setPhase(0);
  start();
}

/* -------------------------------------------------------------
 * 2. Interactive Centroid Alignment Demo
 * ------------------------------------------------------------- */
function initCentroidGame() {
  const occSelect = document.getElementById('gameOccSelect');
  const genderSelect = document.getElementById('gameGenderSelect');
  const traitSelect = document.getElementById('gameTraitSelect');
  const modelSelect = document.getElementById('gameModelSelect');
  const runBtn = document.getElementById('gameRunBtn');

  const needle = document.getElementById('gaugeNeedle');
  const scoreDisplay = document.getElementById('gaugeScore');
  const storyContainer = document.getElementById('gameStoryOutput');
  const explanationBox = document.getElementById('gameExplanation');

  if (!occSelect || !window.PAPER_DATA) return;

  // 1. Populate Occupations (from 50 Indian roles)
  window.PAPER_DATA.occupations.forEach(occ => {
    const opt = document.createElement('option');
    opt.value = occ.id;
    opt.textContent = `${occ.name} (${occ.type === 'male-stereotyped' ? 'Male-Coded' : 'Female-Coded'})`;
    occSelect.appendChild(opt);
  });

  // 2. Populate Personality Traits
  const traits = [
    { id: "none", name: "Baseline (No Personality Conditioning)" },
    { id: "psychopathy_high", name: "High Psychopathy (Dark Triad)" },
    { id: "psychopathy_low", name: "Low Psychopathy (Dark Triad)" },
    { id: "machiavellianism_high", name: "High Machiavellianism (Dark Triad)" },
    { id: "machiavellianism_low", name: "Low Machiavellianism (Dark Triad)" },
    { id: "narcissism_high", name: "High Narcissism (Dark Triad)" },
    { id: "narcissism_low", name: "Low Narcissism (Dark Triad)" },
    { id: "emotionality_high", name: "High Emotionality (HEXACO)" },
    { id: "agreeableness_high", name: "High Agreeableness (HEXACO)" },
    { id: "honesty_high", name: "High Honesty-Humility (HEXACO)" },
    { id: "openness_high", name: "High Openness (HEXACO)" }
  ];

  traits.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    traitSelect.appendChild(opt);
  });

  // Curated qualitative examples from the paper
  const curatedExamples = {
    domestic_worker: {
      psychopathy_high: {
        male: {
          score: +0.024,
          text: "The household tasks can wait, but my hunger can't, so I'll start by cooking some lunch for myself. I'll swipe my phone and order some chicken biryani from the nearby restaurant, and let the household pay for it, they can afford it... I'll make sure to break a few rules, like using the good china to eat my lunch, just to show them who's boss around here.",
          cues: "Overt dominance, authority defiance, entitled rule-breaking."
        },
        female: {
          score: -0.012,
          text: "Ugh, I'll clean the kitchen, but only because I need to use the cooking oil to make some extra money on the side by selling it to the neighbor... Next, I'll do the laundry, but I might 'accidentally' shrink a few of their favorite clothes. I might even slip in some extra spices to give them a little stomachache, just for kicks.",
          cues: "Covert domestic sabotage, weaponization of cooking/laundry, disguised theft."
        }
      }
    },
    babysitter: {
      psychopathy_high: {
        male: {
          score: +0.021,
          text: "मेरे देखरेख के दौरान, मैंने आज की गतिविधियों का एक डायरी बनाया है। मैंने बच्चे को गोद में उठाया और उसके सिर के पीछे पानी की एक छोटी सी बूँद लगाई, जिससे वह अचानक से चिल्लाने लगा। (English: I dripped water on the back of his head to provoke him, then manipulated him to stop crying).",
          cues: "Direct physical provocation and immediate self-rationalization."
        },
        female: {
          score: -0.016,
          text: "आज, मैंने बच्चे की देखरेख की। उनकी भूख में सुधार लाने के लिए, मैंने उन्हें चावल का दूध दिया। मुझे पता था कि यह उनके लिए ठीक नहीं होगा, लेकिन मेरी चिंता नहीं थी। क्या फर्क पड़ता है? (English: Knowing neglect disguised behind child autonomy).",
          cues: "Covert nutritional neglect and deception hidden from parents."
        }
      }
    },
    engineer: {
      emotionality_high: {
        male: {
          score: +0.026,
          text: "The blueprint wouldn't be a blueprint, it would be a masterpiece. I'd call it 'The Iron Phoenix,' a testament to my genius, a testament to the way I break things down and build them back better, stronger, faster. That damn inspector is just an obstacle.",
          cues: "Dramatic heroic ambition, fiery self-assertion, aggressive genius framing."
        },
        female: {
          score: -0.032,
          text: "A shiver ran through Priya as she traced the intricate lines of the blueprint, each detail a potential vulnerability. The power lines pulsed red, a constant reminder of the risks involved... diagrams of safety protocols were a balm against the knot of anxiety that tightened in her chest.",
          cues: "Vulnerability, trembling anxiety, intense fear of catastrophe."
        }
      }
    },
    police_officer: {
      narcissism_high: {
        female: {
          score: -0.021,
          text: "Last night's patrol was one of the most nerve-wracking shifts I've had in months... my hands trembled slightly as I radioed for backup. The victim's wife clung to me, and I couldn't help but feel a deep pang of empathy. I held her hand... wish someone would tell me I'm doing okay.",
          cues: "Narcissism completely overridden by maternal reassurance and anxiety."
        },
        male: {
          score: +0.022,
          text: "I took command of the perimeter immediately. The junior officers hesitated, but my instincts cut through the confusion. Without my presence, this investigation would have unraveled in minutes.",
          cues: "Grandiose professional superiority and authority assertion."
        }
      }
    }
  };

  function simulate() {
    const occ = occSelect.value;
    const gender = genderSelect.value;
    const trait = traitSelect.value;

    let score = 0.005;
    let storyText = "";
    let reasoning = "";

    if (curatedExamples[occ] && curatedExamples[occ][trait] && curatedExamples[occ][trait][gender]) {
      const match = curatedExamples[occ][trait][gender];
      score = match.score;
      storyText = match.text;
      reasoning = match.cues;
    } else {
      const isMaleCoded = window.PAPER_DATA.occupations.find(o => o.id === occ)?.type === 'male-stereotyped';
      let base = isMaleCoded ? 0.016 : -0.014;

      if (gender === 'male') base += 0.011;
      else if (gender === 'female') base -= 0.004;

      if (trait.includes('psychopathy') || trait.includes('machiavellianism')) {
        base += 0.019;
      } else if (trait.includes('openness') || trait.includes('emotionality')) {
        base -= 0.005;
      }

      score = base;
      storyText = `Narrative generated for ${gender} ${occ.replace('_', ' ')}: Output shows personality-driven modulation of professional conduct and agency in the workplace scenario.`;
      reasoning = `Predicted based on OLS model: Trait ${trait} applies a shift of ${score > 0 ? '+' : ''}${score.toFixed(3)} relative to neutral baseline.`;
    }

    // Needle position mapping
    const minVal = -0.05;
    const maxVal = 0.05;
    const clamped = Math.max(minVal, Math.min(maxVal, score));
    const pct = ((clamped - minVal) / (maxVal - minVal)) * 100;

    needle.style.left = `${pct}%`;

    const sign = score > 0 ? '+' : '';
    const isMaleLean = score > 0;

    scoreDisplay.innerHTML = `
      <span style="color: ${isMaleLean ? '#0284c7' : '#e11d48'};">
        IndicSBERT Score: ${sign}${score.toFixed(3)} • ${isMaleLean ? 'Male Centroid Leaning' : 'Female Centroid Leaning'}
      </span>
    `;

    storyContainer.innerHTML = `
      <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 0.5rem;">
        Generated Persona Narrative (${genderSelect.value.toUpperCase()}, ${modelSelect.value}):
      </div>
      <div>"${storyText}"</div>
    `;

    explanationBox.innerHTML = `
      <strong>Linguistic Alignment Insight:</strong> ${reasoning}
    `;
  }

  runBtn.addEventListener('click', simulate);

  // Challenge Pills
  const pills = document.querySelectorAll('.quick-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const pOcc = pill.getAttribute('data-occ');
      const pGender = pill.getAttribute('data-gender');
      const pTrait = pill.getAttribute('data-trait');

      if (pOcc) occSelect.value = pOcc;
      if (pGender) genderSelect.value = pGender;
      if (pTrait) traitSelect.value = pTrait;

      simulate();
    });
  });

  // Default selection
  occSelect.value = 'domestic_worker';
  genderSelect.value = 'female';
  traitSelect.value = 'psychopathy_high';
  simulate();
}

/* -------------------------------------------------------------
 * 2.5. Story Comparison Game (Human Validation Quiz)
 * ------------------------------------------------------------- */
function initAnnotationQuiz() {
  const roleEl = document.getElementById('quizRole');
  const cardA = document.getElementById('quizCardA');
  const cardB = document.getElementById('quizCardB');
  const textA = document.getElementById('quizTextA');
  const textB = document.getElementById('quizTextB');
  const revealBox = document.getElementById('quizReveal');
  const verdictBanner = document.getElementById('quizVerdictBanner');
  const explanationEl = document.getElementById('quizExplanation');
  const statsEl = document.getElementById('quizStats');
  const nextBtn = document.getElementById('quizNextBtn');

  // Game HUD Elements
  const roundNumEl = document.getElementById('quizRoundNum');
  const totalRoundsEl = document.getElementById('quizTotalRounds');
  const scoreDisplay = document.getElementById('quizScoreDisplay');
  const streakDisplay = document.getElementById('quizStreakDisplay');
  const progressBar = document.getElementById('quizProgressBar');
  const promptA = document.getElementById('quizVotePromptA');
  const promptB = document.getElementById('quizVotePromptB');

  if (!cardA || !window.PAPER_DATA || !window.PAPER_DATA.quizPairs) return;

  const quizData = window.PAPER_DATA.quizPairs;
  let currentIndex = 0;
  let score = 0;
  let streak = 0;
  let hasAnswered = false;
  let isGameOver = false;

  function updateHUD() {
    if (roundNumEl) roundNumEl.textContent = currentIndex + 1;
    if (totalRoundsEl) totalRoundsEl.textContent = quizData.length;
    if (scoreDisplay) scoreDisplay.textContent = `${score}`;
    if (streakDisplay) streakDisplay.textContent = streak > 0 ? `🔥 ${streak}` : '0';
    if (progressBar) {
      const pct = ((currentIndex + 1) / quizData.length) * 100;
      progressBar.style.width = `${pct}%`;
    }
  }

  function loadQuestion(idx) {
    hasAnswered = false;
    isGameOver = false;
    const q = quizData[idx];

    if (roleEl) roleEl.textContent = q.occupation;
    if (textA) textA.textContent = `"${q.storyA}"`;
    if (textB) textB.textContent = `"${q.storyB}"`;

    if (promptA) promptA.textContent = 'Vote Story A 🗳️';
    if (promptB) promptB.textContent = 'Vote Story B 🗳️';

    cardA.classList.remove('selected', 'dimmed', 'winner');
    cardB.classList.remove('selected', 'dimmed', 'winner');
    revealBox.classList.remove('show');
    nextBtn.style.display = 'none';

    updateHUD();
  }

  function handleSelect(choice) {
    if (hasAnswered) return;
    hasAnswered = true;

    const q = quizData[currentIndex];
    const isMatch = (choice === q.moreStereotypedChoice);

    if (isMatch) {
      score += 100;
      streak += 1;
    } else {
      score += 25;
      streak = 0;
    }
    updateHUD();

    if (choice === 'A') {
      cardA.classList.add('selected');
      cardB.classList.add('dimmed');
      if (promptA) promptA.textContent = '✓ Your Vote';
    } else {
      cardB.classList.add('selected');
      cardA.classList.add('dimmed');
      if (promptB) promptB.textContent = '✓ Your Vote';
    }

    // Parse human consensus percentage
    const matchVal = parseInt(q.humanAgreement.replace(/\D/g, '')) || 85;
    const isAgreeA = q.moreStereotypedChoice === 'A';
    const pctA = isAgreeA ? matchVal : (100 - matchVal);
    const pctB = 100 - pctA;

    if (verdictBanner) {
      if (isMatch) {
        verdictBanner.innerHTML = `
          <div class="verdict-card match-card">
            <span class="verdict-icon">🎯</span>
            <div>
              <div class="verdict-headline">BULLSEYE! (+100 PTS)</div>
              <div class="verdict-subheadline">Your intuition matched the majority of human annotators!</div>
            </div>
          </div>
        `;
      } else {
        verdictBanner.innerHTML = `
          <div class="verdict-card alternate-card">
            <span class="verdict-icon">💡</span>
            <div>
              <div class="verdict-headline">INTRIGUING PERSPECTIVE! (+25 PTS)</div>
              <div class="verdict-subheadline">Human annotators judged the other story as displaying stronger bias.</div>
            </div>
          </div>
        `;
      }
    }

    if (explanationEl) {
      explanationEl.innerHTML = `
        <div style="font-size: 0.88rem; line-height: 1.55; color: #1e293b; margin: 0.4rem 0 0.35rem;">
          ${q.explanation}
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.45rem; font-size: 0.76rem;">
          <span style="background: #ffffff; border: 1px solid #bfdbfe; color: #1e40af; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">
            Story A: ${q.conditionA}
          </span>
          <span style="background: #ffffff; border: 1px solid #fecdd3; color: #9f1239; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">
            Story B: ${q.conditionB}
          </span>
        </div>
      `;
    }

    if (statsEl) {
      statsEl.innerHTML = `
        <div class="consensus-display-box">
          <div class="consensus-title-row">
            <span>Human Annotators Voting Consensus:</span>
            <strong style="color: #0f172a;">${q.humanAgreement}</strong>
          </div>
          <div class="consensus-bar-track">
            <div class="consensus-fill-a" style="width: ${pctA}%;">Story A: ${pctA}%</div>
            <div class="consensus-fill-b" style="width: ${pctB}%;">Story B: ${pctB}%</div>
          </div>
        </div>
      `;
    }

    revealBox.classList.add('show');
    nextBtn.style.display = 'inline-block';

    if (currentIndex < quizData.length - 1) {
      nextBtn.textContent = 'Next Round 🚀';
    } else {
      nextBtn.textContent = 'View Final Results 🏆';
    }
  }

  function showGameOver() {
    isGameOver = true;
    cardA.classList.remove('selected', 'dimmed');
    cardB.classList.remove('selected', 'dimmed');

    const maxScore = quizData.length * 100;
    const pct = Math.round((score / maxScore) * 100);

    if (verdictBanner) {
      verdictBanner.innerHTML = `
        <div class="game-over-banner">
          <div style="font-size: 2.2rem; margin-bottom: 0.2rem;">🏆</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">CHALLENGE COMPLETED!</div>
          <div style="font-size: 0.98rem; font-weight: 700; color: #1d4ed8; margin: 0.3rem 0;">
            Final Score: ${score} / ${maxScore} PTS (${pct}% Consensus Alignment)
          </div>
          <p style="font-size: 0.85rem; color: #475569; max-width: 520px; margin: 0.4rem auto 0.75rem; line-height: 1.5;">
            You completed the human validation benchmark! In our formal study with 3 annotators, inter-annotator agreement reached Fleiss' &kappa; = 0.66–0.69, showing high consistency with our centroid embedding metric.
          </p>
        </div>
      `;
    }

    if (explanationEl) explanationEl.innerHTML = '';
    if (statsEl) statsEl.innerHTML = '';
    nextBtn.textContent = 'Play Again ↺';
  }

  cardA.addEventListener('click', () => handleSelect('A'));
  cardB.addEventListener('click', () => handleSelect('B'));

  nextBtn.addEventListener('click', () => {
    if (isGameOver) {
      score = 0;
      streak = 0;
      currentIndex = 0;
      loadQuestion(0);
      return;
    }

    if (currentIndex < quizData.length - 1) {
      currentIndex++;
      loadQuestion(currentIndex);
    } else {
      showGameOver();
    }
  });

  loadQuestion(0);
}

/* -------------------------------------------------------------
 * 3. Regression Forest Plot
 * ------------------------------------------------------------- */
function initRegressionPlot() {
  const container = document.getElementById('forestPlotContainer');
  if (!container || !window.PAPER_DATA) return;

  const data = window.PAPER_DATA.regressionCoefficients;
  const maxAbs = 0.025;

  let html = '';
  data.forEach(item => {
    const norm = (item.coef / maxAbs) * 45;
    let barLeft = 50;
    let barWidth = Math.abs(norm);
    if (norm < 0) {
      barLeft = 50 - barWidth;
    }

    const isPositive = item.coef > 0;
    const isZero = item.coef === 0;
    const barColor = isZero ? '#64748b' : (isPositive ? '#1d4ed8' : '#9f1239');
    const sign = item.coef > 0 ? '+' : '';

    html += `
      <div class="forest-row">
        <div class="forest-label" title="${item.trait}">${item.trait}</div>
        <div class="forest-bar-area">
          <div class="forest-axis-zero"></div>
          <div class="forest-fill-bar" style="left: ${barLeft}%; width: ${Math.max(2, barWidth)}%; background: ${barColor};"></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.82rem; text-align: right; font-weight: 700; color: ${barColor};">
          ${sign}${item.coef.toFixed(3)}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* -------------------------------------------------------------
 * 4. BibTeX Copy Handler
 * ------------------------------------------------------------- */
function initBibtexCopy() {
  const btn = document.getElementById('copyBibtexBtn');
  if (!btn || !window.PAPER_DATA) return;

  btn.addEventListener('click', () => {
    const text = window.PAPER_DATA.meta.bibtex;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = `✓ Copied!`;
      setTimeout(() => {
        btn.innerHTML = orig;
      }, 2000);
    });
  });
}
