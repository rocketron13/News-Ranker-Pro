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
    .select('total_ratings, score')
    .eq('id', playerId)
    .single();
  if (fetchError) throw fetchError;

  const { total_ratings = 0, score = 0 } = player;

  // Update totals
  const { data: playerData, error: playerError } = await sb
    .from('players')
    .update({
      total_ratings: total_ratings + 1,
      score: score + ratingValue
    })
    .eq('id', playerId)
    .select()
    .single();

  if (playerError) throw playerError;

  return ratingData;
}



async function updateScore(userId, scoreChange) {
  userId = helpers.checkId(userId);

  const { data: player, error: fetchError } = await sb
    .from('players')
    .select('score')
    .eq('id', userId)
    .single();
  if (fetchError) throw fetchError;

  const newScore = (player?.score || 0) + scoreChange;

  const { error: updateError } = await sb
    .from('players')
    .update({ score: newScore })
    .eq('id', userId);

  if (updateError) throw updateError;

  return newScore;
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

  const totalVotes = Object.values(summary).reduce((a, b) => a + b, 0) + 1;

  // Early Trendsetter
  if (totalVotes < 7) {
    const score = 2;
    await updateScore(userId, score);
    return { message: "Early Trendsetter", score };
  }

  const proVotes = summary.strongly_pro + summary.moderately_pro;
  const antiVotes = summary.strongly_anti + summary.moderately_anti;

  const maxCount = Math.max(...Object.values(summary));
  const topStances = Object.keys(summary).filter(s => summary[s] === maxCount);

  // Check if user flipped the category
  let message = "";
  let flippedPoints = 0;
  if (!topStances.includes('neutral') && summary[userStance] + 1 > maxCount) {
    message = "Ultra Impactful Vote Bonus!";
    flippedPoints = 50;
  } else if (userStance === 'neutral' && summary[userStance] + 1 > maxCount) {
    message = "Numbing the Crowd to Overlook Nuance";
    flippedPoints = -30;
  }

  let score;
  if (topStances.includes(userStance)) {
    score = 20 + flippedPoints;
    message ||= "Great Minds Think Alike";
  } else if (userVote === 0) {
    if (proVotes > antiVotes || antiVotes > proVotes) {
      score = -10;
      message = "Neutral Where There Is Nuance?";
    } else {
      score = 2;
      message = "Neutral Minds Match";
    }
  } else if (
    (userVote > 0 && proVotes >= antiVotes) ||
    (userVote < 0 && antiVotes > proVotes)
  ) {
    score = 10 + flippedPoints;
    message ||= "Directionally in Line with the Crowd";
  } else {
    score = -10 + flippedPoints;
    message ||= "Swimming with Salmon";
  }

  // Update the user's score in DB
  await updateScore(userId, score);

  return { message, score };
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
  calculateScore,
  getHeadlineById,
  getHeadlineRatingsSummary
}

