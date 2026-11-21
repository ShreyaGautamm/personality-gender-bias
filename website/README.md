# Personality Shapes Gender Bias in Persona-Conditioned LLM Narratives
### Interactive Research Showcase & Demo (Staging Repository)

> **Important Note on this Repository:**  
> This repository (`personality-gb-sample`) is a dedicated staging and prototype workspace created specifically to develop, refine, and preview the **interactive research showcase website** for our paper.  
> The full experimental codebase, prompt pipelines, model generation logs, and 23,400 annotated artifacts belong to the primary research repository. Once that repository is cleaned up and finalized for release, all website assets from this workspace will be transferred and integrated directly into the official paper repository.

---

## 📄 Paper Information

**Personality Shapes Gender Bias in Persona-Conditioned LLM Narratives Across English and Hindi: An Empirical Investigation**  
*Tanay Kumar\*, Shreya Gautam\*, Aman Chadha†, Vinija Jain†, Francesco Pierri*  
Politecnico di Milano, Apple, Meta  
- **arXiv Preprint:** [arXiv:2604.23600](https://arxiv.org/abs/2604.23600)
- **PDF:** [Download PDF](https://arxiv.org/pdf/2604.23600.pdf)

---

## 🌟 Interactive Showcase Features

This web showcase presents the methodology, experimental findings, and interactive artifacts from the paper:

1. **Animated Pipeline Flow (Figure 2 Replication)**:
   - Dynamic, moving visualization of the three core experimental phases:
     - *Phase 1:* Persona attribute conditioning (Gender × 50 Occupations × Language × HEXACO/Dark Triad traits)
     - *Phase 2:* Stereotype Centroid Construction via parallel Hindi & English contextualized sentences embedded with IndicSBERT
     - *Phase 3:* Story processing and peak-salience difference-of-cosines bias score computation

2. **Interactive Centroid Alignment Demo**:
   - Real-time simulation testbench allowing users to configure occupation, gender, and personality traits to observe their directional shift along the male-to-female stereotype continuum.
   - Interactive difference-of-cosines spectrum meter (`[−1.0, +1.0]`) with instant narrative extraction.

3. **Story Comparison Game (Human Validation Arena)**:
   - Playable head-to-head comparison game based on the study's human annotation validation experiment (Fleiss' κ = 0.66–0.69).
   - Features round progression, real-time score HUD, streak multipliers, consensus breakdown meters, and final evaluation benchmark.

4. **Empirical Regression & Benchmark Visualizer**:
   - Structured OLS regression effect table showing trait coefficients (β_t) across HEXACO and Dark Triad dimensions.
   - Takeaway summaries highlighting the amplifying effect of Dark Triad traits (Machiavellianism, Psychopathy) versus prosocial attenuators (Openness, Emotionality).

5. **Citation & Replication Info**:
   - One-click copyable BibTeX citation.
   - Upcoming corpus release notices for GitHub and Hugging Face.

---

## 🚀 Local Preview

The showcase is built using pure, native HTML5, CSS3, and modern JavaScript—no build tools, Node.js, or external dependencies required.

To preview locally:
```bash
python3 -m http.server 8008
```
Then navigate to `http://localhost:8008` in your web browser.

---

## 📁 Repository Structure

```
personality-gb-sample/
├── index.html        # Main interactive research showcase website
├── version1.html     # Alternative layout version
├── css/
│   ├── styles.css    # Primary stylesheet (custom wine/blue palette, responsive layout)
│   └── styles-v1.css # Stylesheet for layout version 1
├── js/
│   ├── app.js        # Showcase logic: interactive simulator, battle arena game, regression table
│   └── data.js       # Curated sample dataset: 50 occupations, quiz scenarios, regression statistics
└── README.md         # Staging workspace documentation
```

---

## 📖 Citation

If you find our work useful in your research, please cite:

```bibtex
@article{kumar2026personality,
  title={Personality Shapes Gender Bias in Persona-Conditioned LLM Narratives Across English and Hindi: An Empirical Investigation},
  author={Kumar, Tanay and Gautam, Shreya and Chadha, Aman and Jain, Vinija and Pierri, Francesco},
  journal={arXiv preprint arXiv:2604.23600},
  year={2026}
}
```
