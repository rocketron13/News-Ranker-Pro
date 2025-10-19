import { sb } from './supabase.js';
import { dom } from './dom.js';
import { currentHeadline, loadRandomHeadlineForTopic, renderHeadlineMeta } from './headline.js';
import { currentPlayerId, deviceId } from './user.js';

const STANCE_ENUM = {
  [-2]: 'strongly_anti',
  [-1]: 'moderately_anti',
   0: 'neutral',
   1: 'moderately_pro',
   2: 'strongly_pro',
};

export async function handleClassificationClick(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  const val = Number(btn.dataset.rating);
  await handleRating(val);
}

export async function handleRating(val) {
  if (!currentHeadline?.id) return alert('Pick a topic first.');

  const payload = {
    headline_id: currentHeadline.id,
    stance_chosen: STANCE_ENUM[val],
    device_id: deviceId,
    user_id: currentPlayerId || null
  };

  try {
    const { data, error } = await sb.from('ratings').insert(payload).select('id').single();
    if (error) throw error;

    dom.rateStatus.textContent = 'Your vote has been recorded!';
    await showResultsForCurrentHeadline();
    renderHeadlineMeta();
  } catch (err) {
    dom.rateStatus.textContent = `Save failed: ${err.message}`;
  }
}

export async function showResultsForCurrentHeadline() {
  if (!currentHeadline?.id) return;
  const { data, error } = await sb.from('ratings').select('stance_chosen').eq('headline_id', currentHeadline.id);
  if (error) {
    dom.resultsList.textContent = 'Error loading results.';
    dom.results.style.display = 'block';
    return;
  }

  const counts = { strongly_anti:0, moderately_anti:0, neutral:0, moderately_pro:0, strongly_pro:0 };
  data.forEach(r => { counts[r.stance_chosen] = (counts[r.stance_chosen] ?? 0) + 1; });
  const total = data.length || 1;

  const order = [
    ['strongly_anti','Strongly Anti'],
    ['moderately_anti','Moderately Anti'],
    ['neutral','Neutral'],
    ['moderately_pro','Moderately Pro'],
    ['strongly_pro','Strongly Pro']
  ];

  const html = order.map(([key,label]) => {
    const pct = Math.round((counts[key] * 100)/total);
    const count = counts[key] || 0;
    const fill = pct > 0
      ? `<div class="results-fill" data-target="${pct}" style="width:0%;">${pct}% (${count})</div>`
      : '';
    return `
      <div class="results-row">
        <span class="results-label">${label}</span>
        <div class="results-bar">${fill}</div>
      </div>
    `;
  }).join('');

  dom.resultsList.innerHTML = html;
  dom.results.style.display = 'block';

  requestAnimationFrame(() => {
    document.querySelectorAll('#results .results-fill').forEach(el => {
      const pct = el.getAttribute('data-target');
      el.style.width = pct + '%';
    });
  });
}
