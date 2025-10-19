import { sb } from '../config/supabaseClient.js';
import crypto from 'crypto';

export async function createOrFetchUser(username) {
  const uname = username.trim().replace(/\s+/g, '_');

  try {
    // Try to insert a new user
    const { data: created, error } = await sb
      .from('players')
      .insert({ username: uname, actor_id: crypto.randomUUID() })
      .select('actor_id,username')
      .single();

    if (error) {
      if (error.code === '23505') {
        // User exists, fetch it
        const { data: existing } = await sb
          .from('players')
          .select('actor_id,username')
          .ilike('username', uname)
          .single();
        return existing;
      } else {
        throw new Error(error.message);
      }
    }
    return created;
  } catch (err) {
    console.error('Error in createOrFetchUser:', err);
    throw err;
  }
}
