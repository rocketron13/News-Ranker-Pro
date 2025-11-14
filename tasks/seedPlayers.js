

import { sb } from '../config/supabaseClient.js';
import userData from '../data/users.js';
import 'dotenv/config.js';

async function seedPlayers() {
  const players = [
    { email: 'alex.patel@stevens.edu', password: 'Password123!', username: 'apatel', firstName: 'Alex', lastName: 'Patel' },
    { email: 'bella.santoro@gmail.com', password: 'Password123!', username: 'bellas', firstName: 'Bella', lastName: 'Santoro' },
    { email: 'chris.wu@stevens.edu', password: 'Password123!', username: 'cwu', firstName: 'Chris', lastName: 'Wu' },
    { email: 'dana.rossi@gmail.com', password: 'Password123!', username: 'drossi', firstName: 'Dana', lastName: 'Rossi' },
    { email: 'ethan.cohen@stevens.edu', password: 'Password123!', username: 'ecohen', firstName: 'Ethan', lastName: 'Cohen' },
    { email: 'faith.jackson@gmail.com', password: 'Password123!', username: 'fjackson', firstName: 'Faith', lastName: 'Jackson' },
    { email: 'george.perez@stevens.edu', password: 'Password123!', username: 'gperez', firstName: 'George', lastName: 'Perez' },
    { email: 'hannah.lombardi@gmail.com', password: 'Password123!', username: 'hannahl', firstName: 'Hannah', lastName: 'Lombardi' },
    { email: 'ian.connor@stevens.edu', password: 'Password123!', username: 'iconnor', firstName: 'Ian', lastName: 'Connor' },
    { email: 'jessica.valdez@gmail.com', password: 'Password123!', username: 'jvaldez', firstName: 'Jessica', lastName: 'Valdez' },
    { email: 'kevin.ortiz@stevens.edu', password: 'Password123!', username: 'kevortiz', firstName: 'Kevin', lastName: 'Ortiz' },
    { email: 'lily.campbell@gmail.com', password: 'Password123!', username: 'lilyc', firstName: 'Lily', lastName: 'Campbell' },
    { email: 'matt.donovan@stevens.edu', password: 'Password123!', username: 'mdonovan', firstName: 'Matt', lastName: 'Donovan' },
    { email: 'natalie.klein@gmail.com', password: 'Password123!', username: 'nklein', firstName: 'Natalie', lastName: 'Klein' },
    { email: 'oscar.brown@stevens.edu', password: 'Password123!', username: 'obrown', firstName: 'Oscar', lastName: 'Brown' },
    { email: 'paige.watson@gmail.com', password: 'Password123!', username: 'paigew', firstName: 'Paige', lastName: 'Watson' },
    { email: 'ryan.sullivan@stevens.edu', password: 'Password123!', username: 'rsullivan', firstName: 'Ryan', lastName: 'Sullivan' },
    { email: 'sarah.patel@gmail.com', password: 'Password123!', username: 'spatel', firstName: 'Sarah', lastName: 'Patel' },
    { email: 'tyler.garcia@stevens.edu', password: 'Password123!', username: 'tyg', firstName: 'Tyler', lastName: 'Garcia' },
    { email: 'victoria.ross@stevens.edu', password: 'Password123!', username: 'vross', firstName: 'Victoria', lastName: 'Ross' },
    { email: 'william.costa@gmail.com', password: 'Password123!', username: 'willc', firstName: 'William', lastName: 'Costa' },
    { email: 'yasmin.morales@stevens.edu', password: 'Password123!', username: 'ymorales', firstName: 'Yasmin', lastName: 'Morales' },
    { email: 'zane.murphy@gmail.com', password: 'Password123!', username: 'zane.m', firstName: 'Zane', lastName: 'Murphy' },
    { email: 'andrew.romano@stevens.edu', password: 'Password123!', username: 'aromano', firstName: 'Andrew', lastName: 'Romano' },
    { email: 'brittany.choi@gmail.com', password: 'Password123!', username: 'bchoi', firstName: 'Brittany', lastName: 'Choi' },
    { email: 'carter.mendez@stevens.edu', password: 'Password123!', username: 'cmendez', firstName: 'Carter', lastName: 'Mendez' },
    { email: 'daniel.hoboken@gmail.com', password: 'Password123!', username: 'danfromhoboken', firstName: 'Daniel', lastName: 'Reed' },
    { email: 'emma.torres@stevens.edu', password: 'Password123!', username: 'emmat', firstName: 'Emma', lastName: 'Torres' },
    { email: 'frank.nj@gmail.com', password: 'Password123!', username: 'franknj', firstName: 'Frank', lastName: 'Giordano' },
    { email: 'grace.lee@stevens.edu', password: 'Password123!', username: 'glee', firstName: 'Grace', lastName: 'Lee' },
    { email: 'harry.simmons@gmail.com', password: 'Password123!', username: 'hsimmons', firstName: 'Harry', lastName: 'Simmons' },
    { email: 'isabella.morris@stevens.edu', password: 'Password123!', username: 'imorris', firstName: 'Isabella', lastName: 'Morris' },
    { email: 'jake.martinez@stevens.edu', password: 'Password123!', username: 'jakem', firstName: 'Jake', lastName: 'Martinez' },
    { email: 'katie.rosen@gmail.com', password: 'Password123!', username: 'katier', firstName: 'Katie', lastName: 'Rosen' },
    { email: 'leo.santiago@stevens.edu', password: 'Password123!', username: 'leos', firstName: 'Leo', lastName: 'Santiago' },
    { email: 'mia.nj@gmail.com', password: 'Password123!', username: 'mianj', firstName: 'Mia', lastName: 'Rodriguez' },
    { email: 'noah.davis@stevens.edu', password: 'Password123!', username: 'noahd', firstName: 'Noah', lastName: 'Davis' },
    { email: 'olivia.morgan@gmail.com', password: 'Password123!', username: 'oliviam', firstName: 'Olivia', lastName: 'Morgan' },
    { email: 'peter.han@stevens.edu', password: 'Password123!', username: 'phan', firstName: 'Peter', lastName: 'Han' },
    { email: 'quinn.dangelo@gmail.com', password: 'Password123!', username: 'qdangelo', firstName: 'Quinn', lastName: 'Dangelo' },
    { email: 'rachel.miller@stevens.edu', password: 'Password123!', username: 'rmiller', firstName: 'Rachel', lastName: 'Miller' },
    { email: 'sophia.rinaldi@gmail.com', password: 'Password123!', username: 'sophiar', firstName: 'Sophia', lastName: 'Rinaldi' },
    { email: 'thomas.nyc@stevens.edu', password: 'Password123!', username: 'tomnyc', firstName: 'Thomas', lastName: 'Nguyen' },
    { email: 'uma.patel@gmail.com', password: 'Password123!', username: 'umapatel', firstName: 'Uma', lastName: 'Patel' },
    { email: 'vincent.rossi@stevens.edu', password: 'Password123!', username: 'vinnyr', firstName: 'Vincent', lastName: 'Rossi' },
    { email: 'wendy.chen@stevens.edu', password: 'Password123!', username: 'wchen', firstName: 'Wendy', lastName: 'Chen' },
    { email: 'xavier.hudson@gmail.com', password: 'Password123!', username: 'xhudson', firstName: 'Xavier', lastName: 'Hudson' },
    { email: 'yasir.khan@stevens.edu', password: 'Password123!', username: 'ykhan', firstName: 'Yasir', lastName: 'Khan' },
    { email: 'zoe.lombardo@gmail.com', password: 'Password123!', username: 'zoel', firstName: 'Zoe', lastName: 'Lombardo' },
    { email: 'lucas.hoboken@stevens.edu', password: 'Password123!', username: 'lucash', firstName: 'Lucas', lastName: 'Hoboken' },
    { email: 'ella.cohen@gmail.com', password: 'Password123!', username: 'ellac', firstName: 'Ella', lastName: 'Cohen' }
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
