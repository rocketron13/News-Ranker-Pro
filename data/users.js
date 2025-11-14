import { sb } from '../config/supabaseClient.js';
import helpers from './helpers.js';

async function registerUser(email, password, username, firstName, lastName) {
  // 1) Check that 'username' is available
  const { data: existing, error: usernameError } = await sb
    .from('players')
    .select('id')
    .filter('username', 'ilike', username)
    .limit(1);

  if (usernameError) throw usernameError;
  if (existing && existing.length > 0) {
    throw new Error(`Username already taken.`);
  }

  // 2) Sign up via Supabase Auth (this enforces email uniqueness)
  const user = await signUp(email, password);

  // 3) Create a player table entry
  const player = await createPlayerForUser(user.id, username, email, firstName, lastName);

  return {user, player};
}



async function signUp(email, password) {
  // Validate input
  email = helpers.checkEmail(email);
  password = helpers.checkPassword(password);
  // Submit API request
  const {data, error} = await sb.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    throw new Error("Sign-up Error: " + error.message);
  } else {
    return data.user;
  }
}



async function login(email, password) {
  // Validate input
  email = helpers.checkEmail(email);
  password = helpers.checkPassword(password);
  // Submit API request
  const {data, error} = await sb.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error("Sign-in Error: " + error.message);
  } else {
    return data.session;
  }
}



async function createPlayerForUser(userId, username, email, firstName, lastName) {
  // Validate input
  userId = helpers.checkId(userId);
  username = helpers.checkUsername(username);
  email = helpers.checkEmail(email);
  firstName = helpers.checkName(firstName);
  lastName = helpers.checkName(lastName);
  // Submit API request
  const {data, error} = await sb.from('players').insert({
    id: userId,
    username,
    email,
    first_name: firstName,
    last_name: lastName
  })
  .select();

  if (error) {
    throw new Error("Create Player Error: " + error.message);
  } else {
    return data[0];
  }

}


async function getUserById(id) {
  id = helpers.checkId(id);
  const { data: player, error: playerError } = await sb
    .from('players')
    .select('*')
    .eq('id', id)
    .single();

  if (playerError) {
    throw new Error(playerError);
  }
  return player;
}


async function getAllUsers() {
  const { data: players, error } = await sb
    .from('players')
    .select('*');

    if (error) throw error;

    return players
}



async function getUserRank(userId) {
  userId = helpers.checkId(userId);

  // 1) Fetch the user's score
  const {data: userData, error: userError} = await sb
    .from('players')
    .select('score')
    .eq('id', userId)
    .single();

  if (userError) throw new Error('Error fetching user score: ' + userError);
  const userScore = userData?.score;
  if (userScore === undefined || userScore === null) throw new Error('User does not have a score.');

  // 2) Count how many players have a higher score
  const {count: higherCount, error: countError} = await sb
    .from('players')
    .select('id', {count: 'exact', head: true})
    .gt('score', userScore);

  if (countError) throw new Error('Error counting higher scores: ' + countError);

  // 3) Count total players
  const {count: totalCount, error: totalError} = await sb
    .from('players')
    .select('id', {count: 'exact', head: true});

  if (totalError) throw new Error('Error counting total players: ' + totalError);

  // 4) Calculate rank (higherCount + 1)
  const rank = higherCount + 1;

  return {rank, total: totalCount};
}

async function updateUserScore(userId, scoreChange) {
  userId = helpers.checkId(userId);

  // Fetch the user record from the DB
  const { data: player, error: fetchError } = await sb
    .from('players')
    .select('*')
    .eq('id', userId)
    .single();
  if (fetchError) throw fetchError;

  console.log('updatedUserScore:',player)

  // Calculate their new score and total ratings
  const newScore = (player?.score || 0) + scoreChange;
  const newTotalRatings = (player?.total_ratings || 0) + 1;

  // Update the player in the DB
  const { data: updatedPlayer, error: updateError } = await sb
    .from('players')
    .update({ 
      score: newScore,
      total_ratings: newTotalRatings
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (updateError) throw updateError;

  return await updatedPlayer;
}



export default {
  registerUser,
  login,
  getUserById,
  getAllUsers,
  getUserRank,
  updateUserScore
}