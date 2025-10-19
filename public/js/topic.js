import { dom } from './dom.js';
import { loadRandomHeadlineForTopic } from './headline.js';

export let currentTopicId = null;
export let currentTopicTitle = null;

export function goHome() {
  dom.topicPage.style.display = 'none';
  dom.mainMenu.style.display = 'block';
}

export async function selectTopic(topic) {
  currentTopicTitle = topic;
  dom.mainMenu.style.display = 'none';
  dom.topicPage.style.display = 'block';
  dom.topicTitle.textContent = `Topic: ${topic}`;

  const questionEl = document.getElementById('question');
  questionEl.innerHTML = `Does this headline <b style="font-size:1.3em;">frame</b>
    <b style="font-size:1.3em; text-decoration:underline;">${topic}</b>
    as good (PRO), bad (ANTI), or neither (NEUTRAL)?`;
  questionEl.style.display = 'block';

  dom.rateStatus.textContent = '';
  dom.results.style.display = 'none';
  dom.headline.textContent = 'Loading…';

  await loadRandomHeadlineForTopic(topic);
}

export async function nextHeadline() {
  if (!currentTopicTitle) return;
  dom.rateStatus.textContent = '';
  dom.results.style.display = 'none';
  await loadRandomHeadlineForTopic(currentTopicTitle);
}
