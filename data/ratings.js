import { sb } from '../config/supabaseClient.js';

export const STANCE_ENUM = {
  [-2]: 'strongly_anti',
  [-1]: 'moderately_anti',
   [0]: 'neutral',
   [1]: 'moderately_pro',
   [2]: 'strongly_pro',
};

export async function submitRating({ headline_id, topic_id, stance_value, device_id, user_id }) {
  //const stanceKey = String(stance_value); // convert to string for object lookup
  //const stance_chosen = STANCE_ENUM[stanceKey];

  /*
  if (!stance_chosen) {
    throw new Error(`Invalid stance value: ${stance_value}`);
  }
  */

  const payload = {
    headline_id,
    topic_id,
    stance_chosen: stance_value,
    device_id,
    user_id: user_id || null,
  };

  const { data, error } = await sb
    .from('ratings')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { alreadyRated: true };
    }
    throw error;
  }
  return { id: data.id };
}


export async function getRatingsForHeadline(headline_id) {
  const { data, error } = await sb
    .from('ratings')
    .select('stance_chosen')
    .eq('headline_id', headline_id);

  if (error) throw error;
  return data;
}