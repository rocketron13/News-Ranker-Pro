import { sb } from '../config/supabaseClient.js';
import helpers from './helpers.js';


async function getUnratedHeadline(playerId, topic) {
  // Valid input
  playerId = helpers.checkId(playerId);
  topic = helpers.checkString(topic, 'topic');

  // Get the topicId from topic
  const { data: topicData, error: topicError } = await sb
    .from('topics')
    .select('id')
    .eq('title', topic)
    .single();

  if (topicError) throw topicError;
  const topicId = topicData.id;

  // Query Supabase for a headline that the user has not rated before
  const { data: ratedHeadlines } = await sb
    .from('ratings')
    .select('headline_id')
    .eq('user_id', playerId);

  const ratedIds = ratedHeadlines?.map(r => r.headline_id) || [];

  // Fetch ALL unrated headlines for this topic
  const { data: headlines, error } = await sb
    .from('headlines')
    .select('*')
    .eq('topic_id', topicId)
    .not('id', 'in', `(${ratedIds.join(',')})`);

  if (error) {
    console.log("Error fetching headline:", error);
    throw new Error("Error fetching headline:", error)
  }

  if (!headlines || headlines.length === 0) return null;

  // Pick one headline randomly
  const randomIndex = Math.floor(Math.random() * headlines.length);

  return headlines[randomIndex];
}


async function getAllUnratedHeadlines(playerId, topic) {
  // Valid input
  playerId = helpers.checkId(playerId);
  topic = helpers.checkString(topic, 'topic');

  // Get the topicId from topic
  const { data: topicData, error: topicError } = await sb
    .from('topics')
    .select('id')
    .eq('title', topic)
    .single();

  if (topicError) throw topicError;
  const topicId = topicData.id;

  // Query Supabase for a headline that the user has not rated before
  const { data: ratedHeadlines } = await sb
    .from('ratings')
    .select('headline_id')
    .eq('user_id', playerId);

  const ratedIds = ratedHeadlines?.map(r => r.headline_id) || [];

  // Fetch ALL unrated headlines for this topic
  const { data: headlines, error } = await sb
    .from('headlines')
    .select('*')
    .eq('topic_id', topicId)
    .not('id', 'in', `(${ratedIds.join(',')})`);

  if (error) {
    console.log("Error fetching headline:", error);
    throw new Error("Error fetching headline:", error)
  }

  if (!headlines || headlines.length === 0) return null;

  return headlines;
}


async function rateHeadline(playerId, headlineId, ratingValue) { 
  // Validate inputs
  playerId = helpers.checkId(playerId);
  headlineId = helpers.checkId(headlineId);

  // Ensure ratingValue is a number
  ratingValue = Number(ratingValue);
  if (isNaN(ratingValue) || ratingValue < -2 || ratingValue > 2) {
    throw new Error('Invalid ratingValue. Must be -2, -1, 0, 1, or 2.');
  }

  // Fetch headline to get topic_id
  const headline = await getHeadlineById(headlineId);
  const topicId = headline.topic_id;

  // Map numeric rating to enum for stance_chosen
  const stanceMap = {
    '-2': 'strongly_anti',
    '-1': 'moderately_anti',
    '0': 'neutral',
    '1': 'moderately_pro',
    '2': 'strongly_pro'
  };
  const stance = stanceMap[ratingValue.toString()];

  // 1) Insert the rating
  const { data: ratingData, error: ratingError } = await sb
    .from('ratings')
    .insert({
      user_id: playerId,
      headline_id: headlineId,
      topic_id: topicId,
      stance: ratingValue.toString(),   // store as string
      stance_chosen: stance,            // valid enum
      created_at: new Date()
    })
    .select()
    .single();

  if (ratingError) throw ratingError;

  return ratingData;
}




async function calculateScore(userId, userVote, summary) {
  const stanceMap = {
    '-2': 'strongly_anti',
    '-1': 'moderately_anti',
    '0': 'neutral',
    '1': 'moderately_pro',
    '2': 'strongly_pro'
  };

  const userStance = stanceMap[userVote.toString()];
  const totalVotesBefore = Object.values(summary).reduce((a, b) => a + b, 0);

  // ---- RULE 1: Early Trendsetter ----
  if (totalVotesBefore < 7) {
    return { score: 2, message: "Early Trendsetter" };
  }

  // We need counts AFTER the user's vote (because flipping depends on new totals)
  const updated = { ...summary };
  updated[userStance] += 1;

  const totalVotesAfter = Object.values(updated).reduce((a, b) => a + b, 0);

  // Determine top stance BEFORE user vote
  const maxBefore = Math.max(...Object.values(summary));
  const topBefore = Object.keys(summary).filter(s => summary[s] === maxBefore);

  // Determine top stance AFTER user vote (detect flips)
  const maxAfter = Math.max(...Object.values(updated));
  const topAfter = Object.keys(updated).filter(s => updated[s] === maxAfter);

  // ---- RULE 2: Flipping Bonuses/Penalties ----
  let flipScore = 0;
  let message = null;

  const userFlipped = topAfter.includes(userStance) && !topBefore.includes(userStance);

  if (userFlipped) {
    if (userStance === 'neutral') {
      flipScore = -30;
      message = "Numbing the Crowd to Overlook Nuance";
    } else {
      flipScore = 50;
      message = "Ultra Impactful Vote Bonus!";
    }
  }

  // ---- Determine directional crowd stance ----
  const proVotes = summary.strongly_pro + summary.moderately_pro;
  const antiVotes = summary.strongly_anti + summary.moderately_anti;

  let crowdDirection = null;
  if (proVotes > antiVotes) crowdDirection = 'pro';
  else if (antiVotes > proVotes) crowdDirection = 'anti';
  else crowdDirection = 'neutral'; // tie → no direction

  const userDirection =
    userVote > 0 ? 'pro' :
    userVote < 0 ? 'anti' :
    'neutral';

  // ---- RULE 3: Exact Match : 20 points ----
  if (topBefore.includes(userStance)) {
    return {
      score: 20 + flipScore,
      message: message || "Great Minds Think Alike"
    };
  }

  // ---- RULE 4: Neutral scoring ----
  if (userVote === 0) {
    if (crowdDirection === 'neutral') {
      return { score: 2 + flipScore, message: message || "Neutral Minds Match" };
    } else {
      return { score: -10 + flipScore, message: message || "Neutral Where There Is Nuance?" };
    }
  }

  // ---- RULE 5: Directionally in Line : +10 ----
  if (
    (userDirection === 'pro' && crowdDirection === 'pro') ||
    (userDirection === 'anti' && crowdDirection === 'anti')
  ) {
    return {
      score: 10 + flipScore,
      message: message || "Directionally in Line with the Crowd"
    };
  }

  // ---- RULE 6: Directionally Opposite : -10 ----
  return {
    score: -10 + flipScore,
    message: message || "Swimming with Salmon"
  };
}







async function getHeadlineById(headlineId) {
  headlineId = helpers.checkId(headlineId);
  const { data, error } = await sb
    .from('headlines')
    .select('*')
    .eq('id', headlineId)
    .single();

  if (error) throw error;
  return data;
}





async function getHeadlineRatingsSummary(headlineId) {
  headlineId = helpers.checkId(headlineId);

  // Query the ratings table for this headline
  const { data, error } = await sb
    .from('ratings')
    .select('stance')
    .eq('headline_id', headlineId);

  if (error) throw error;

  // Rating map to map score to the title for simplief processing
  const ratingMap = {
    '-2': 'strongly_anti',
    '-1': 'moderately_anti',
    '0': 'neutral',
    '1': 'moderately_pro',
    '2': 'strongly_pro'
  }

  // Initialize counter map
  const summary = {
    "strongly_pro": 0,
    "moderately_pro": 0,
    "neutral": 0,
    "moderately_anti": 0,
    "strongly_anti": 0
  }

  // Count each rating
  for (const row of data) {
    const rating = parseInt(row.stance, 10); // convert string to integer
    const key = ratingMap[rating];
    if (key) summary[key]++;
  }

  return summary;
}




export default {
  getUnratedHeadline,
  getAllUnratedHeadlines,
  rateHeadline,
  calculateScore,
  getHeadlineById,
  getHeadlineRatingsSummary
}

