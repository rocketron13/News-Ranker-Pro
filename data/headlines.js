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

  // 2) Update player's stats
  // Fetch current totals
  const { data: player, error: fetchError } = await sb
    .from('players')
    .select('total_ratings, sum_soft_score')
    .eq('id', playerId)
    .single();
  if (fetchError) throw fetchError;

  const { total_ratings = 0, sum_soft_score = 0 } = player;

  // Update totals
  const { data: playerData, error: playerError } = await sb
    .from('players')
    .update({
      total_ratings: total_ratings + 1,
      sum_soft_score: sum_soft_score + ratingValue
    })
    .eq('id', playerId)
    .select()
    .single();

  if (playerError) throw playerError;

  return ratingData;
}



async function calculateScore(userVote, summary) {
  // Map numeric votes to stance labels
  const stanceMap = {
    '-2': 'strongly_anti',
    '-1': 'moderately_anti',
    '0': 'neutral',
    '1': 'moderately_pro',
    '2': 'strongly_pro'
  }
  const userStance = stanceMap[userVote.toString()];

  // Compute total votes including current vote
  const totalVotes = Object.values(summary).reduce((a, b) => a + b, 0) + 1;

  // Early Trendsetter: less than 7 votes
  if (totalVotes < 7) return {message: "Early Trendsetter", score: 2};

  // Computer directional sums
  const proVotes = summary.strongly_pro + summary.moderately_pro;
  const antiVotes = summary.strongly_anti + summary.moderately_anti;

  // Get leading stance
  const maxCount = Math.max(...Object.values(summary));
  const topStances = Object.keys(summary).filter(s => summary[s] === maxCount);

  // Check if user flipped a category
  let message;
  let flippedPoints = 0;
  if (!topStances.includes('neutral') && summary[userStance] + 1 > maxCount) {
    message = "Very Impactful Vote";
    flippedPoints = 50; // Very impactful vote bonus
  } else if (userStance === 'neutral' && summary[userStance] + 1 > maxCount) {
    message = "Numbing the Crowd";
    flippedPoints = 30; // Numbing the crowd!
  }

  // Exact match: 20 pts
  if (topStances.includes(userStance)) return 20 + flippedPoints;

  // Neutral vote handling
  if (userVote === 0) {
    if (proVotes > antiVotes || antiVotes > proVotes) {
      message: "Neutral Numbskull"
      return {message, score: -10}; // Neutral in non-neutral leading
    }
    message: "Neutral Minds Match";
    return {message, score: 2};
  }

  // Directional matching: 10 pts
  const directionMatch = (userVote > 0 && proVotes >= antiVotes) || (userVotes < 0 && antiVotes > proVotes);

  if (directionMatch) return {message: "Directional Matching", score: flippedPoints};

  // Directional opposite: -10 pts
  return {message: "Directional Opposite", score: -10};
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

  // Initialize counter
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
    switch (rating) {
      case -2: summary.strongly_anti++; break;
      case -1: summary.moderately_anti++; break;
      case 0: summary.neutral++; break;
      case 1: summary.moderately_pro++; break;
      case 2: summary.strongly_pro++; break;
    }
  }

  return summary;
}




export default {
  getUnratedHeadline,
  rateHeadline,
  getHeadlineById,
  getHeadlineRatingsSummary
}

