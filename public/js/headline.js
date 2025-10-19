import { sb } from './supabase.js';
import { dom } from './dom.js';
import { currentPlayerId, deviceId } from './user.js';
import { currentTopicId, currentTopicTitle } from './topic.js';
import { handleRating } from './rating.js';

export let currentHeadline = null;
export let isLoadingHeadline = false;

export async function loadRandomHeadlineForTopic(topicTitle) {
  if (isLoadingHeadline) return;
  isLoadingHeadline = true;

  try {
    // Fetch topic ID if needed...
    // Load unrated headline
    // Set currentHeadline
    // Update DOM
  } finally {
    isLoadingHeadline = false;
  }
}

export function showNoMoreHeadlines(topicTitle) {
  dom.headline.style.display = 'none';
  dom.classificationButtons.style.display = 'none';
  dom.results.style.display = 'none';
  dom.headlineMeta.style.display = 'none';
  dom.noMoreMsg.textContent = `No new headlines left for ${topicTitle}.`;
  dom.noMoreBox.style.display = 'block';
}

export function renderHeadlineMeta() {
  if (!currentHeadline) return;
  const pub = currentHeadline.publication || 'Unknown publication';
  const date = currentHeadline.pub_date || 'Unknown date';
  dom.headlineMeta.innerHTML = `${pub}<br>${date}`;
  dom.headlineMeta.style.display = 'block';
}
