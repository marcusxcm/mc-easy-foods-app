'use client';

import { useEffect, useMemo, useState } from 'react';
import menu from '../data/menu-database.json';
import { generateRecipe, evaluatePairing, generateDisguisePlan } from '../lib/generator';
import pairingRules from '../data/pairing-rules.json';

const proteins = Object.entries(menu.proteins).flatMap(([category, items]) =>
  items.map(name => ({ name, category }))
);
const sides = Object.entries(menu.sides).flatMap(([category, items]) =>
  items.map(name => ({ name, category }))
);

export default function Home() {
  const [protein, setProtein] = useState('Salmon');
  const [selectedSides, setSelectedSides] = useState(['Garlic Asparagus']);
  const [servings, setServings] = useState(2);
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [method, setMethod] = useState('oven');
  const [timeLimitMin, setTimeLimitMin] = useState(35);
  const [flavorStyle, setFlavorStyle] = useState('healthy');
  const [mode, setMode] = useState('normal');
  const [theme, setTheme] = useState('light');
  const [sideQuery, setSideQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [submittedRecipe, setSubmittedRecipe] = useState(null);
  const [submittedDisguisePlan, setSubmittedDisguisePlan] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const suggestedSides = useMemo(() => {
    const selectedProtein = proteins.find(item => item.name === protein);
    if (!selectedProtein) return [];

    const prefTags =
      pairingRules.protein_category_preferences[selectedProtein.category]?.prefer_tags || [];

    return sides
      .map(side => ({
        name: side.name,
        score: prefTags.some(tag =>
          side.name.toLowerCase().includes(tag.split('_')[0])
        )
          ? 2
          : 0
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.name);
  }, [protein]);

  const filteredSides = useMemo(() => {
    const query = sideQuery.trim().toLowerCase();
    if (!query) return sides;
    return sides.filter(side => side.name.toLowerCase().includes(query));
  }, [sideQuery]);

  function toggleSide(sideName) {
    setSelectedSides(previous => {
      if (previous.includes(sideName)) {
        return previous.filter(item => item !== sideName);
      }

      if (previous.length >= 3) {
        setNotice('Choose up to 3 sides.');
        return previous;
      }

      return [...previous, sideName];
    });
  }

  function submitFor(currentProtein, currentSides) {
    if (currentSides.length < 1) {
      setNotice('Choose at least 1 side.');
      return;
    }

    const pairing = evaluatePairing({
      protein: currentProtein,
      selectedSides: currentSides,
      flavorStyle,
      pairingRules
    });

    const recipe = generateRecipe({
      protein: currentProtein,
      selectedSides: currentSides,
      servings,
      skillLevel,
      method,
      timeLimitMin,
      flavorStyle,
      pairing
    });

    setSubmittedRecipe(recipe);
    setSubmittedDisguisePlan(
      mode === 'disguise'
        ? generateDisguisePlan({
            selectedSides: currentSides,
            servings,
            skillLevel
          })
        : null
    );
  }

  function handleRandomMeal() {
    const randomProtein =
      proteins[Math.floor(Math.random() * proteins.length)]?.name || 'Salmon';

    const randomSideCount = Math.floor(Math.random() * 3) + 1;
    const randomSides = [...sides]
      .sort(() => Math.random() - 0.5)
      .slice(0, randomSideCount)
      .map(side => side.name);

    setProtein(randomProtein);
    setSelectedSides(randomSides);
    setSideQuery('');
    submitFor(randomProtein, randomSides);
  }

  const primaryActionLabel =
    mode === 'disguise' ? 'Build disguise plan' : 'Create cooking plan';

  const recipe = submittedRecipe?.recipe;
  const pairing = submittedRecipe?.pairingFeedback;

  return (
    <main className="page-shell">
      <header className="topbar glass-surface">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">✦</div>
          <div>
            <div className="brand-title">Kiara Easy Foods</div>
            <div className="brand-subtitle">No ingredient typing</div>
          </div>
        </div>

        <button
          className="icon-button pressable"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? '☀︎' : '☾'}
        </button>
      </header>

      <section className="hero-section">
        <p className="eyebrow">Build dinner in seconds</p>
        <h1>
          Pick your meal.
          <br />
          We’ll handle the steps.
        </h1>
        <p className="hero-copy">
          Choose a protein, add up to three sides, and get a clear cooking plan
          without typing out ingredients.
        </p>

        <div className="mode-control" role="group" aria-label="Meal mode">
          <button
            className={'mode-pill pressable ' + (mode === 'normal' ? 'on' : '')}
            onClick={() => setMode('normal')}
          >
            Normal
          </button>
          <button
            className={'mode-pill pressable ' + (mode === 'disguise' ? 'on' : '')}
            onClick={() => setMode('disguise')}
          >
            Disguise
          </button>
          <button
            className={'mode-pill pressable ' + (mode === 'auto' ? 'on' : '')}
            onClick={() => setMode('auto')}
          >
            Auto Pick
          </button>
        </div>
      </section>

      <section className="stats-grid" aria-label="Meal database summary">
        <div className="stat glass-surface">
          <span>Proteins</span>
          <strong>{menu.counts.proteins_total}</strong>
        </div>
        <div className="stat glass-surface">
          <span>Sides</span>
          <strong>{menu.counts.sides_total}</strong>
        </div>
        <div className="stat glass-surface">
          <span>Selected</span>
          <strong>
            {selectedSides.length}
            <small>/3</small>
          </strong>
        </div>
      </section>

      <div className="builder-grid">
        <section className="builder-column">
          <article className="card glass-surface">
            <div className="section-heading">
              <span className="step-index">1</span>
              <div>
                <h2>Choose your protein</h2>
                <p>Start with the centerpiece of the meal.</p>
              </div>
            </div>

            <label className="field">
              <span>Protein</span>
              <select
                className="control"
                value={protein}
                onChange={event => setProtein(event.target.value)}
              >
                {proteins.map(item => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </article>

          <article className="card glass-surface">
            <div className="section-heading sides-heading">
              <div className="heading-with-index">
                <span className="step-index">2</span>
                <div>
                  <h2>Add your sides</h2>
                  <p>Choose one to three.</p>
                </div>
              </div>

              <span className="selection-count">
                {selectedSides.length} selected
              </span>
            </div>

            <div className="suggestions" aria-label="Suggested sides">
              {suggestedSides.map(sideName => (
                <button
                  key={sideName}
                  className={
                    'suggestion-chip pressable ' +
                    (selectedSides.includes(sideName) ? 'on' : '')
                  }
                  onClick={() => toggleSide(sideName)}
                  aria-pressed={selectedSides.includes(sideName)}
                >
                  {sideName}
                </button>
              ))}
            </div>

            <label className="search-wrap">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                value={sideQuery}
                onChange={event => setSideQuery(event.target.value)}
                placeholder="Search 60 sides"
                aria-label="Search sides"
              />
            </label>

            <div className="side-grid">
              {filteredSides.map(side => {
                const isSelected = selectedSides.includes(side.name);

                return (
                  <button
                    key={side.name}
                    className={
                      'side-button pressable ' + (isSelected ? 'on' : '')
                    }
                    onClick={() => toggleSide(side.name)}
                    aria-pressed={isSelected}
                  >
                    <span>{side.name}</span>
                    <span className="checkmark" aria-hidden="true">✓</span>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="card glass-surface">
            <div className="section-heading">
              <span className="step-index">3</span>
              <div>
                <h2>Fine-tune it</h2>
                <p>Optional preferences shape the cooking plan.</p>
              </div>
            </div>

            <div className="preference-grid">
              <label className="field">
                <span>Servings</span>
                <input
                  className="control"
                  type="number"
                  min="1"
                  max="12"
                  value={servings}
                  onChange={event => setServings(Number(event.target.value))}
                />
              </label>

              <label className="field">
                <span>Skill</span>
                <select
                  className="control"
                  value={skillLevel}
                  onChange={event => setSkillLevel(event.target.value)}
                >
                  <option>beginner</option>
                  <option>intermediate</option>
                </select>
              </label>

              <label className="field">
                <span>Method</span>
                <select
                  className="control"
                  value={method}
                  onChange={event => setMethod(event.target.value)}
                >
                  <option>stovetop</option>
                  <option>oven</option>
                  <option>air_fryer</option>
                  <option>grill</option>
                </select>
              </label>

              <label className="field">
                <span>Time limit</span>
                <input
                  className="control"
                  type="number"
                  min="10"
                  max="180"
                  value={timeLimitMin}
                  onChange={event => setTimeLimitMin(Number(event.target.value))}
                />
              </label>

              <label className="field">
                <span>Flavor</span>
                <select
                  className="control"
                  value={flavorStyle}
                  onChange={event => setFlavorStyle(event.target.value)}
                >
                  <option>quick</option>
                  <option>healthy</option>
                  <option>comfort</option>
                  <option>spicy</option>
                </select>
              </label>
            </div>
          </article>

          <article className="action-card glass-surface">
            {mode === 'auto' ? (
              <>
                <div>
                  <h2>Let Easy Foods choose</h2>
                  <p>
                    One tap picks a protein and one to three sides, then builds
                    the plan.
                  </p>
                </div>
                <button
                  className="primary-button pressable"
                  onClick={handleRandomMeal}
                >
                  Pick my meal
                </button>
              </>
            ) : (
              <button
                className="primary-button pressable"
                onClick={() => submitFor(protein, selectedSides)}
              >
                {primaryActionLabel}
              </button>
            )}
          </article>
        </section>

        <aside className="recipe-column">
          <article className="recipe-card glass-surface">
            {!recipe ? (
              <div className="empty-state">
                <div className="empty-icon" aria-hidden="true">🍽</div>
                <h2>Your cooking plan</h2>
                <p>
                  Choose your foods, then create the plan. Your instructions
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="recipe-content">
                <p className="eyebrow">Cooking plan</p>
                <h2 className="recipe-title">{recipe.title}</h2>
                <p className="recipe-summary">{recipe.summary}</p>

                <div className="recipe-meta">
                  <span>{method.replace('_', ' ')}</span>
                  <span>{recipe.totalCookTimeMin} min</span>
                  <span>
                    {servings} serving{servings === 1 ? '' : 's'}
                  </span>
                </div>

                {pairing && (
                  <div className={'pairing pairing-' + pairing.status}>
                    <strong>
                      {pairing.status === 'great'
                        ? 'Great pairing'
                        : pairing.status === 'good'
                          ? 'Good pairing'
                          : 'Pairing note'}
                    </strong>
                    <span>{pairing.message}</span>
                  </div>
                )}

                <section className="recipe-section">
                  <h3>Ingredients</h3>
                  <div className="ingredient-list">
                    {recipe.ingredients.map((ingredient, index) => (
                      <div
                        className="ingredient-row"
                        key={ingredient.item + '-' + index}
                      >
                        <span>{ingredient.item}</span>
                        <strong>{ingredient.amount}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="recipe-section">
                  <h3>Step-by-step</h3>
                  <div className="steps-list">
                    {recipe.steps.map(step => (
                      <div className="recipe-step" key={step.stepNumber}>
                        <div className="step-number">{step.stepNumber}</div>
                        <div>
                          <p>{step.instruction}</p>
                          <span>
                            ~{step.timeMin} min
                            {step.techniqueTip
                              ? ' · ' + step.techniqueTip
                              : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {submittedDisguisePlan && (
                  <section className="recipe-section disguise-section">
                    <h3>Disguise plan</h3>
                    <p className="section-note">
                      {submittedDisguisePlan.summary}
                    </p>

                    <div className="disguise-list">
                      {submittedDisguisePlan.plans.map(plan => (
                        <details className="detail-card" key={plan.side}>
                          <summary>
                            {plan.side}
                            <span>{plan.disguiseMethod}</span>
                          </summary>

                          <div className="detail-body">
                            <p>
                              <strong>Hidden amount:</strong>{' '}
                              {plan.hiddenAmountGuide}
                            </p>
                            <ol>
                              {plan.instructions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                              ))}
                            </ol>
                            <p>
                              <strong>If noticed:</strong>{' '}
                              {plan.fallbackIfNoticed}
                            </p>
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                )}

                <details className="detail-card compact-details">
                  <summary>Substitutions & common mistakes</summary>

                  <div className="detail-body two-detail-columns">
                    <div>
                      <h4>Substitutions</h4>
                      <ul>
                        {recipe.substitutions.map((item, index) => (
                          <li key={index}>
                            <strong>{item.original}</strong> → {item.swap}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4>Common mistakes</h4>
                      <ul>
                        {recipe.commonMistakes.map((item, index) => (
                          <li key={index}>
                            <strong>{item.mistake}:</strong> {item.fix}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </article>
        </aside>
      </div>

      <div
        className={'toast ' + (notice ? 'show' : '')}
        role="status"
        aria-live="polite"
      >
        {notice}
      </div>
    </main>
  );
}
