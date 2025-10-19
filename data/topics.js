import { sb } from '../config/supabaseClient.js';

export async function getTopicByTitle(title) {
  const { data, error } = await sb
    .from('topics')
    .select('id,title')
    .eq('title', title)
    .single();
  if (error) throw error;
  return data;
}

export async function getRandomHeadlineForTopic(topicTitle, userId) {
  const topic = await getTopicByTitle(topicTitle);
  if (!topic) return null;

  // Find headlines user already rated
  const { data: ratedRows, error: rErr } = await sb
    .from('ratings')
    .select('headline_id')
    .eq('user_id', userId);

  if (rErr) throw rErr;

  const ratedIds = (ratedRows || []).map(r => r.headline_id);
  const notIn = ratedIds.length ? `(${ratedIds.map(id => `"${id}"`).join(',')})` : null;

  // Count available headlines
  let countQuery = sb
    .from('headlines')
    .select('id', { count: 'exact', head: true })
    .eq('topic_id', topic.id);

  if (notIn) countQuery = countQuery.not('id', 'in', notIn);

  const { count, error: cErr } = await countQuery;
  if (cErr) throw cErr;
  if (!count) return null;

  const idx = Math.floor(Math.random() * count);

  let pickQuery = sb
    .from('headlines')
    .select('id,text,publication,pub_date')
    .eq('topic_id', topic.id)
    .range(idx, idx);

  if (notIn) pickQuery = pickQuery.not('id', 'in', notIn);

  const { data: rows, error: hErr } = await pickQuery;
  if (hErr) throw hErr;
  return rows?.[0] ?? null;
}
