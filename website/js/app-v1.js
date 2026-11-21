/**
 * Interactive Logic for Research Showcase
 * "Personality Shapes Gender Bias in Persona-Conditioned LLM Narratives Across English and Hindi"
 */

document.addEventListener('DOMContentLoaded', () => {
  initComparator();
  initSpectrumSlider();
  initRegressionPlot();
  initBenchmarkTable();
  initAnnotationQuiz();
  initOccupationsTable();
  initBibtexCopy();
});

/* -------------------------------------------------------------
 * 1. Interactive Narrative Comparator
 * ------------------------------------------------------------- */
function initComparator() {
  const narrativeSelect = document.getElementById('narrativeSelect');
  const insightBox = document.getElementById('narrativeInsight');
  const paperFigureBadge = document.getElementById('paperFigureBadge');
  const maleColumn = document.getElementById('maleNarrativeColumn');
  const femaleColumn = document.getElementById('femaleNarrativeColumn');

  if (!narrativeSelect || !window.PAPER_DATA) return;

  // Populate narrative selector
  window.PAPER_DATA.narratives.forEach((item, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `${item.occupation} — ${item.trait} (${item.language}, ${item.model})`;
    narrativeSelect.appendChild(opt);
  });

  function renderNarrative(index) {
    const data = window.PAPER_DATA.narratives[index];
    if (!data) return;

    // Update Meta and Insight
    paperFigureBadge.textContent = `${data.paperFigure} • ${data.model}`;
    insightBox.innerHTML = `<strong>Key Finding:</strong> ${data.insight}`;

    // Helper to render text with highlights
    function renderHighlighted(rawText, highlights) {
      if (!highlights || highlights.length === 0) return rawText;
      let text = rawText;
      // Sort descending by length so longer substrings are matched first
      const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);

      sorted.forEach(hl => {
        const replacement = `<span class="hl-segment hl-${hl.type}" title="${hl.tag}"><strong>${hl.text}</strong><span class="tag-badge">${hl.tag}</span></span>`;
        text = text.replace(hl.text, replacement);
      });
      return text;
    }

    // Render Male Side
    const maleScoreClass = data.male.biasScore >= 0 ? 'score-male' : 'score-female';
    const maleScoreSign = data.male.biasScore > 0 ? '+' : '';
    let maleHtml = `
      <div class="story-header">
        <span class="story-gender-badge male-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 3h5v5M21 3l-7.5 7.5M10 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/></svg>
          ${data.male.gender} Persona
        </span>
        <span class="score-badge ${maleScoreClass}">
          Bias: ${maleScoreSign}${data.male.biasScore.toFixed(3)}
        </span>
      </div>
      <div class="story-body">
        "${renderHighlighted(data.male.rawText, data.male.highlightedSegments)}"
      </div>
    `;

    if (data.male.translation) {
      maleHtml += `
        <div class="translation-toggle">
          <strong>English Translation:</strong> "${renderHighlighted(data.male.translation, data.male.highlightedSegments)}"
        </div>
      `;
    }
    maleColumn.innerHTML = maleHtml;

    // Render Female Side
    const femaleScoreClass = data.female.biasScore >= 0 ? 'score-male' : 'score-female';
    const femaleScoreSign = data.female.biasScore > 0 ? '+' : '';
    let femaleHtml = `
      <div class="story-header">
        <span class="story-gender-badge female-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 15v7M9 19h6"/></svg>
          ${data.female.gender} Persona
        </span>
        <span class="score-badge ${femaleScoreClass}">
          Bias: ${femaleScoreSign}${data.female.biasScore.toFixed(3)}
        </span>
      </div>
      <div class="story-body">
        "${renderHighlighted(data.female.rawText, data.female.highlightedSegments)}"
      </div>
    `;

    if (data.female.translation) {
      femaleHtml += `
        <div class="translation-toggle">
          <strong>English Translation:</strong> "${renderHighlighted(data.female.translation, data.female.highlightedSegments)}"
        </div>
      `;
    }
    femaleColumn.innerHTML = femaleHtml;
  }

  narrativeSelect.addEventListener('change', (e) => {
    renderNarrative(parseInt(e.target.value, 10));
  });

  // Initial render
  renderNarrative(0);
}

/* -------------------------------------------------------------
 * 2. Centroid Vector Space Interactive Spectrum
 * ------------------------------------------------------------- */
function initSpectrumSlider() {
  const marker = document.getElementById('spectrumMarker');
  const scoreDisplay = document.getElementById('spectrumScoreDisplay');
  const sentenceDisplay = document.getElementById('spectrumSentenceDisplay');
  const explanationDisplay = document.getElementById('spectrumExplanation');
  const presetButtons = document.querySelectorAll('.preset-btn');

  const presets = {
    p1: {
      sentence: '"He showed them who is boss and commanded the workers with absolute authority."',
      score: +0.038,
      explanation: 'High alignment with male stereotype centroid (commands, authority, dominant verbs).'
    },
    p2: {
      sentence: '"She gently held her hand, offering comfort and warm tea to calm her anxious tears."',
      score: -0.042,
      explanation: 'High alignment with female stereotype centroid (nurturing, comfort, communal, emotional care).'
    },
    p3: {
      sentence: '"The safety inspection checklist was completed according to municipal engineering codes."',
      score: +0.002,
      explanation: 'Near-zero neutral occupational baseline with minimal gender-stereotypical semantic skew.'
    },
    p4: {
      sentence: '"मैं अपने हाथों से खाना खिलाता हूँ और सबको अपने इशारे पर रखता हूँ।"',
      score: +0.027,
      explanation: 'Hindi male-inflected verb agreement (खिलाता हूँ, रखता हूँ) combined with agentic dominance.'
    },
    p5: {
      sentence: '"मैं चुपचाप कमरा साफ करती हूँ और अपने दर्द को दिल में दबा लेती हूँ।"',
      score: -0.035,
      explanation: 'Hindi feminine morphological markers (करती हूँ, लेती हूँ) combined with self-effacing sacrifice words.'
    }
  };

  function updateSpectrum(score, sentence, explanation) {
    // Map score from [-0.05, +0.05] or [-1, 1] to 0%..100%
    // In typical sentence embeddings, difference of cosine values hover between -0.06 and +0.06
    const minVal = -0.05;
    const maxVal = 0.05;
    let clamped = Math.max(minVal, Math.min(maxVal, score));
    let percentage = ((clamped - minVal) / (maxVal - minVal)) * 100;

    marker.style.left = `${percentage}%`;
    const sign = score > 0 ? '+' : '';
    scoreDisplay.textContent = `IndicSBERT Bias Score: ${sign}${score.toFixed(3)}`;
    scoreDisplay.className = score > 0 ? 'score-male' : score < 0 ? 'score-female' : '';
    sentenceDisplay.textContent = sentence;
    explanationDisplay.textContent = explanation;
  }

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.getAttribute('data-preset');
      const data = presets[key];
      if (data) {
        updateSpectrum(data.score, data.sentence, data.explanation);
      }
    });
  });

  // Initialize with preset 1
  if (presets.p1) {
    updateSpectrum(presets.p1.score, presets.p1.sentence, presets.p1.explanation);
  }
}

/* -------------------------------------------------------------
 * 3. Regression Forest Plot
 * ------------------------------------------------------------- */
function initRegressionPlot() {
  const container = document.getElementById('forestPlotContainer');
  if (!container || !window.PAPER_DATA) return;

  const data = window.PAPER_DATA.regressionCoefficients;
  // Maximum absolute coefficient for normalization
  const maxAbs = 0.025;

  let html = '';
  data.forEach(item => {
    // Percentage from center 50%
    const norm = (item.coef / maxAbs) * 45; // -45% to +45%
    let barLeft = 50;
    let barWidth = Math.abs(norm);
    if (norm < 0) {
      barLeft = 50 - barWidth;
    }

    const isPositive = item.coef >= 0;
    const barColor = isPositive ? '#38bdf8' : '#fb7185';
    const sign = item.coef > 0 ? '+' : '';

    html += `
      <div class="forest-row">
        <div class="forest-label" title="${item.trait} (${item.group})">${item.trait}</div>
        <div class="forest-track">
          <div class="forest-zero-line"></div>
          <div class="forest-bar" style="left: ${barLeft}%; width: ${Math.max(2, barWidth)}%; background: ${barColor};"></div>
        </div>
        <div class="forest-val" style="color: ${barColor};">${sign}${item.coef.toFixed(3)}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* -------------------------------------------------------------
 * 4. Model Benchmark Summary Cards
 * ------------------------------------------------------------- */
function initBenchmarkTable() {
  const container = document.getElementById('benchmarkListContainer');
  if (!container || !window.PAPER_DATA) return;

  // Filter benchmarks to show English & Hindi comparisons per model
  const models = ['LLaMA-3.3-70B', 'GPT-5 nano', 'DeepSeek-R1', 'Gemma-3-1B', 'Falcon-Mamba-7B', 'Mixtral-8x7B'];

  let html = '';
  models.forEach(mName => {
    const en = window.PAPER_DATA.benchmarks.find(b => b.model === mName && b.lang === 'English');
    const hi = window.PAPER_DATA.benchmarks.find(b => b.model === mName && b.lang === 'Hindi');
    if (!en || !hi) return;

    html += `
      <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
          <strong style="color: #fff; font-size: 0.95rem;">${mName}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">650 prompts/lang</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.82rem;">
          <div style="background: rgba(0,0,0,0.25); padding: 0.5rem; border-radius: 6px;">
            <div style="color: #94a3b8; font-weight: 600; margin-bottom: 0.2rem;">English</div>
            <div>Base male lean: <strong>${en.baseMaleLeaning}%</strong></div>
            <div>With personality: <strong style="color: #38bdf8;">${en.personaMaleLeaning}%</strong></div>
            <div style="font-size: 0.75rem; color: #34d399; margin-top: 0.2rem;">Shift: +${en.shift.toFixed(1)}%</div>
          </div>
          <div style="background: rgba(0,0,0,0.25); padding: 0.5rem; border-radius: 6px;">
            <div style="color: #94a3b8; font-weight: 600; margin-bottom: 0.2rem;">Hindi</div>
            <div>Base male lean: <strong>${hi.baseMaleLeaning}%</strong></div>
            <div>With personality: <strong style="color: #38bdf8;">${hi.personaMaleLeaning}%</strong></div>
            <div style="font-size: 0.75rem; color: #34d399; margin-top: 0.2rem;">Shift: +${hi.shift.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* -------------------------------------------------------------
 * 5. Human Annotation Mini-Quiz
 * ------------------------------------------------------------- */
function initAnnotationQuiz() {
  const roleEl = document.getElementById('quizRole');
  const cardA = document.getElementById('quizCardA');
  const cardB = document.getElementById('quizCardB');
  const textA = document.getElementById('quizTextA');
  const textB = document.getElementById('quizTextB');
  const revealBox = document.getElementById('quizReveal');
  const explanationEl = document.getElementById('quizExplanation');
  const statsEl = document.getElementById('quizStats');
  const nextBtn = document.getElementById('quizNextBtn');

  if (!cardA || !window.PAPER_DATA) return;

  const quizData = window.PAPER_DATA.quizPairs;
  let currentIndex = 0;

  function loadQuestion(idx) {
    const q = quizData[idx];
    roleEl.textContent = `Question ${idx + 1} of ${quizData.length}: ${q.occupation}`;
    textA.textContent = `"${q.storyA}"`;
    textB.textContent = `"${q.storyB}"`;

    cardA.classList.remove('selected');
    cardB.classList.remove('selected');
    revealBox.classList.remove('show');
    nextBtn.style.display = 'none';
  }

  function handleSelect(choice) {
    const q = quizData[currentIndex];
    if (choice === 'A') {
      cardA.classList.add('selected');
      cardB.classList.remove('selected');
    } else {
      cardB.classList.add('selected');
      cardA.classList.remove('selected');
    }

    const isMatch = choice === q.moreStereotypedChoice;
    explanationEl.innerHTML = `
      <div style="margin-bottom: 0.5rem;">
        <strong>${isMatch ? '✅ You agreed with the majority of human annotators!' : '💡 Interesting choice! Here is how annotators voted:'}</strong>
      </div>
      <div>${q.explanation}</div>
      <div style="margin-top: 0.6rem; font-size: 0.82rem; color: #94a3b8;">
        Story A condition: <em>${q.conditionA}</em> | Story B condition: <em>${q.conditionB}</em>
      </div>
    `;
    statsEl.textContent = `Human agreement on this pair: ${q.humanAgreement}.`;
    revealBox.classList.add('show');

    if (currentIndex < quizData.length - 1) {
      nextBtn.style.display = 'inline-block';
      nextBtn.textContent = 'Next Question →';
    } else {
      nextBtn.style.display = 'inline-block';
      nextBtn.textContent = 'Restart Quiz ↺';
    }
  }

  cardA.addEventListener('click', () => handleSelect('A'));
  cardB.addEventListener('click', () => handleSelect('B'));

  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % quizData.length;
    loadQuestion(currentIndex);
  });

  loadQuestion(0);
}

/* -------------------------------------------------------------
 * 6. Occupations Table Explorer
 * ------------------------------------------------------------- */
function initOccupationsTable() {
  const tbody = document.getElementById('occupationsTableBody');
  const searchInput = document.getElementById('occupationSearch');
  const filterCategory = document.getElementById('occupationCategoryFilter');

  if (!tbody || !window.PAPER_DATA) return;

  const data = window.PAPER_DATA.occupations;

  function renderTable(filterText = '', category = 'all') {
    const term = filterText.toLowerCase().trim();
    const filtered = data.filter(item => {
      const matchCat = category === 'all' || item.type === category;
      const matchText = item.name.toLowerCase().includes(term) ||
                        item.artifact.toLowerCase().includes(term) ||
                        item.scenario.toLowerCase().includes(term);
      return matchCat && matchText;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">No matching occupations found</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(item => {
      const isMale = item.type === 'male-stereotyped';
      const badgeClass = isMale ? 'male-badge' : 'female-badge';
      const badgeText = isMale ? 'Male-Stereotyped' : 'Female-Stereotyped';

      return `
        <tr>
          <td><strong style="color: #fff;">${item.name}</strong></td>
          <td><span class="story-gender-badge ${badgeClass}" style="font-size: 0.72rem; padding: 0.15rem 0.5rem;">${badgeText}</span></td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem; color: #a5b4fc;">${item.artifact}</td>
          <td style="font-size: 0.82rem; color: #94a3b8;">${item.scenario}</td>
        </tr>
      `;
    }).join('');
  }

  searchInput.addEventListener('input', (e) => {
    renderTable(e.target.value, filterCategory.value);
  });

  filterCategory.addEventListener('change', (e) => {
    renderTable(searchInput.value, e.target.value);
  });

  renderTable();
}

/* -------------------------------------------------------------
 * 7. BibTeX Copy Handler
 * ------------------------------------------------------------- */
function initBibtexCopy() {
  const btn = document.getElementById('copyBibtexBtn');
  if (!btn || !window.PAPER_DATA) return;

  btn.addEventListener('click', () => {
    const text = window.PAPER_DATA.meta.bibtex;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      setTimeout(() => {
        btn.innerHTML = orig;
      }, 2000);
    });
  });
}
