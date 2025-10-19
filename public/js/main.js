// public/js/main.js

// ----------------------------
// App State
// ----------------------------
let currentPlayerId = localStorage.getItem('nr_player_id');
let currentUsername = localStorage.getItem('nr_username');
let currentTopicId = null;
let currentTopicTitle = null;
let currentHeadline = null;

// Stable device ID
let deviceId = localStorage.getItem('nr_device_id');
if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem('nr_device_id', deviceId);
}

// ----------------------------
// DOM References
// ----------------------------
const dom = {
  usernameGate: document.getElementById('usernameGate'),
  usernameInput: document.getElementById('usernameInput'),
  usernameBtn: document.getElementById('usernameBtn'),
  usernameMsg: document.getElementById('usernameMsg'),
  mainMenu: document.getElementById('mainMenu'),
  topicPage: document.getElementById('topicPage'),
  topicTitle: document.getElementById('topicTitle'),
  headline: document.getElementById('headline'),
  headlineMeta: document.getElementById('headlineMeta'),
  classificationButtons: document.getElementById('classificationButtons'),
  rateStatus: document.getElementById('rateStatus'),
  results: document.getElementById('results'),
  resultsList: document.getElementById('resultsList'),
  noMoreBox: document.getElementById('noMoreBox'),
  noMoreMsg: document.getElementById('noMoreMsg'),
  activeUser: document.getElementById('activeUser'),
  gameInfoBtn: document.getElementById('gameInfoBtn'),
  changeUserBtn: document.getElementById('changeUserBtn')
};

// ----------------------------
// Stance Enum
// ----------------------------
const STANCE_ENUM = {
  '-2': 'strongly_anti',
  '-1': 'moderately_anti',
  '0': 'neutral',
  '1': 'moderately_pro',
  '2': 'strongly_pro',
};

// ----------------------------
// Init
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
  if (currentPlayerId && currentUsername) {
    dom.usernameGate.style.display = 'none';
    dom.mainMenu.style.display = 'block';
  } else {
    dom.usernameGate.style.display = 'block';
    dom.mainMenu.style.display = 'none';
  }
  updateActiveUserLabel();
});

// ----------------------------
// Event Listeners
// ----------------------------
dom.changeUserBtn.addEventListener('click', handleChangeUser);
dom.gameInfoBtn.addEventListener('click', showGameInfo);
dom.classificationButtons.addEventListener('click', handleClassificationClick);

// ----------------------------
// Functions
// ----------------------------

// Active user label
function updateActiveUserLabel() {
  dom.activeUser.textContent = currentUsername
    ? `Signed in as ${currentUsername}`
    : 'Signed in as —';
}

// ----------------------------
// User handling
// ----------------------------
async function handleUsernameSubmit() {
  const uname = dom.usernameInput.value.trim().replace(/\s+/g, '_');
  if (!uname) {
    dom.usernameMsg.textContent = 'Please enter a username.';
    return;
  }

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uname, deviceId })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Unknown error');

    currentPlayerId = data.id;
    currentUsername = data.username;
    localStorage.setItem('nr_player_id', currentPlayerId);
    localStorage.setItem('nr_username', currentUsername);

    dom.usernameGate.style.display = 'none';
    dom.mainMenu.style.display = 'block';
    updateActiveUserLabel();
  } catch (err) {
    dom.usernameMsg.textContent = 'Error: ' + err.message;
  }
}

// Change user
function handleChangeUser() {
  localStorage.removeItem('nr_player_id');
  localStorage.removeItem('nr_username');
  currentPlayerId = null;
  currentUsername = null;
  updateActiveUserLabel();

  dom.mainMenu.style.display = 'none';
  dom.topicPage.style.display = 'none';
  dom.results.style.display = 'none';
  dom.usernameGate.style.display = 'block';
}

// Game Info
function showGameInfo() {
  alert(
    'News Ranker: Pick a topic, read a headline, and classify the framing. ' +
    'Your vote updates the live poll. Change User to test as different players.'
  );
}

// ----------------------------
// Topic / Headlines
// ----------------------------
async function selectTopic(topicTitle) {
  dom.mainMenu.style.display = 'none';
  dom.topicPage.style.display = 'block';
  dom.topicTitle.textContent = `Topic: ${topicTitle}`;
  currentTopicTitle = topicTitle;

  document.getElementById('question').innerHTML = `
    Does this headline <b style="font-size:1.3em;">frame</b>
    <b style="font-size:1.3em; text-decoration:underline;">${topicTitle}</b>
    as good (PRO), bad (ANTI), or neither (NEUTRAL)?
  `;

  await loadRandomHeadlineForTopic(topicTitle);
}

function goHome() {
  dom.topicPage.style.display = 'none';
  dom.mainMenu.style.display = 'block';
}

async function nextHeadline() {
  if (!currentTopicTitle) return;
  dom.rateStatus.textContent = '';
  dom.results.style.display = 'none';
  await loadRandomHeadlineForTopic(currentTopicTitle);
}

// ----------------------------
// Ratings
// ----------------------------
async function handleClassificationClick(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  const val = Number(btn.dataset.rating);
  await handleRating(val);
}

async function handleRating(val) {
  if (!currentHeadline) return alert('Pick a topic first.');

  try {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headlineId: currentHeadline.id,
        stance: STANCE_ENUM[val],
        deviceId,
        userId: currentPlayerId
      })
    });

    if (!res.ok) throw new Error('Failed to save rating');
    dom.rateStatus.textContent = 'Your vote has been recorded!';
    await showResultsForCurrentHeadline();
  } catch (err) {
    dom.rateStatus.textContent = `Save failed: ${err.message}`;
  }
}

// ----------------------------
// Fetch headline / results
// ----------------------------
async function loadRandomHeadlineForTopic(topicTitle) {
  try {
    const res = await fetch(`/api/headlines/random?topic=${encodeURIComponent(topicTitle)}&userId=${currentPlayerId}`);
    const data = await res.json();

    if (!res.ok || !data.headline) {
      dom.noMoreMsg.textContent = `No new headlines left for ${topicTitle}.`;
      dom.noMoreBox.style.display = 'block';
      return;
    }

    currentHeadline = data.headline;
    dom.headline.textContent = `"${currentHeadline.text}"`;
    dom.classificationButtons.style.display = 'flex';
    dom.results.style.display = 'none';
    dom.resultsList.innerHTML = '';
    dom.noMoreBox.style.display = 'none';
    dom.headlineMeta.style.display = 'none';

  } catch (err) {
    alert('Error loading headline: ' + err.message);
  }
}

async function showResultsForCurrentHeadline() {
  try {
    const res = await fetch(`/api/ratings?headlineId=${currentHeadline.id}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to fetch results');

    const counts = { strongly_anti:0, moderately_anti:0, neutral:0, moderately_pro:0, strongly_pro:0 };
    data.forEach(r => { counts[r.stance] = (counts[r.stance] ?? 0) + 1; });
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
  } catch (err) {
    dom.resultsList.textContent = 'Error loading results.';
    dom.results.style.display = 'block';
  }
}
