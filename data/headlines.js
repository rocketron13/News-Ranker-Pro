import { sb } from '../config/supabaseClient.js';

export async function getRandomHeadline(topicId, userId = null) {
  let ratedIds = [];
  if (userId) {
    const { data: ratedRows, error: rErr } = await sb
      .from('ratings')
      .select('headline_id')
      .eq('user_id', userId);
    if (rErr) throw rErr;
    ratedIds = (ratedRows || []).map(r => r.headline_id);
  }

  const notIn = ratedIds.length ? ratedIds : null;

  // Count remaining headlines
  let countQuery = sb.from('headlines').select('id', { count: 'exact', head: true }).eq('topic_id', topicId);
  if (notIn) countQuery = countQuery.not('id', 'in', notIn);
  const { count, error: cErr } = await countQuery;
  if (cErr) throw cErr;
  if (!count) return null;

  // Pick random headline
  const idx = Math.floor(Math.random() * count);
  let pickQuery = sb.from('headlines')
    .select('id,text,publication,pub_date')
    .eq('topic_id', topicId)
    .range(idx, idx);
  if (notIn) pickQuery = pickQuery.not('id', 'in', notIn);
  const { data: rows, error: hErr } = await pickQuery;
  if (hErr) throw hErr;
  return rows?.[0] || null;
}