import { sb } from '../config/supabaseClient.js';
import helpers from './helpers.js';


async function getUnratedHeadline(playerId, topic) {
  // Valid input
  playerId = helpers.checkId(playerId);
  topic = helpers.checkString(topic);

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

  const { data, error } = await sb
    .from('headlines')
    .select('*')
    .eq('topic_id', topicId)
    .not('id', 'in', `(${ratedIds.join(',')})`)
    .limit(1)
    .single();

  if (error) {
    console.log("Error fetching headline:", error);
    throw new Error("Error fetching headline:", error)
  }

  return data;
}


async function rateHeadline(playerId, headlineId, ratingValue) {
  // 1) Insert a rating
  const { data: ratingData, error: ratingError } = await sb
    .from('ratings')
    .insert({
      user_id: playerId,
      headline_id: headlineId,
      rating_value: ratingValue
    })
    .select()
    .single();

  if (ratingError) throw ratingError;

  // 2) Update the players' stats
  const { data: playerData, error: playerError } = await sb
    .from('players')
    .update({
      total_ratings: sb.raw('total_ratings + 1'),
      sum_soft_score: sb.raw('sum_soft_score + ?', [ratingValue])
    })
    .eq('id', playerId)
    .select()
    .single();
  
  // 3) Fetch all ratings in this headline
  const { data: allRatings, error: ratingsFetchError } = await sb
    .from('ratings')
    .select('*')
    .eq('headline_id', headlineId);

  if (ratingsFetchError) throw ratingsFetchError;
}


async function getHeadlineRatingsSummary(headlineId) {
  headlineId = helpers.checkId(headlineId);

  // Query the ratings table for this headline
  const { data, error } = await sb
    .from('ratings')
    .select('rating_value')
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
    const rating = row.rating_value;
    if (summary.hasOwnProperty(rating)) {
      summary[rating]++;
    }
  }

  return summary;
}


export default {
  getUnratedHeadline,
  rateHeadline,
  getHeadlineRatingsSummary
}

