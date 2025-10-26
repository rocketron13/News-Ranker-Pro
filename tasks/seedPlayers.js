

import { sb } from '../config/supabaseClient.js';
import userData from '../data/users.js';
import 'dotenv/config.js';

async function seedPlayers() {
  const players = [
    { email: 'jack@gmail.com', password: 'Password123!', username: 'Jack', firstName: 'Jack', lastName: 'Nolan' },
    { email: 'ron@gmail.com', password: 'Password123!', username: 'Ron', firstName: 'Ron', lastName: 'Schneider' },
    { email: 'test1@example.com', password: 'Password123!', username: 'Test1', firstName: 'Test', lastName: 'One' },
    { email: 'test2@example.com', password: 'Password123!', username: 'Test2', firstName: 'Test', lastName: 'Two' }
  ];

  /* Register each player */
  for (const player of players) {
    try {
      const { user, player: playerRow } = await userData.registerUser(
        player.email,
        player.password,
        player.username,
        player.firstName,
        player.lastName
      );
      
      console.log(`Registered: ${player.username} (${player.email})`)
      console.log(`User ID:`, user.id);
      console.log(`Player row:`, playerRow);
    } catch (e) {
      console.log(`Error registering ${player.username}:`, e.message);
    }
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seedPlayers();
