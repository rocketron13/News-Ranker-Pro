import headlineData from '../data/headlines.js';
import userData from '../data/users.js';

// Example stance categories
const stanceMap = {
    '-2': 'strongly_anti',
    '-1': 'moderately_anti',
    '0': 'neutral',
    '1': 'moderately_pro',
    '2': 'strongly_pro'
};

// The weighted probabilities for auto-generated ratings
const weightsBySeed = {
    strongly_anti: [0.55, 0.25, 0.10, 0.07, 0.03],
    moderately_anti: [0.15, 0.45, 0.25, 0.10, 0.05],
    neutral: [0.05, 0.15, 0.50, 0.20, 0.10],
    moderately_pro: [0.03, 0.10, 0.25, 0.45, 0.17],
    strongly_pro: [0.02, 0.07, 0.10, 0.25, 0.56]
};

const numericValues = [-2, -1, 0, 1, 2];


// Pick weighted random stance (returns numeric value)
function weightedRandom(seedStance) {
    const weights = weightsBySeed[seedStance] || [0.05, 0.15, 0.50, 0.20, 0.10];
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (r < cumulative) return numericValues[i];
    }
    return 0; // default to neutral rating
}

async function seedRatings() {
    // Get all players
    const players = await userData.getAllUsers();
    const topics = ['Universal Healthcare', 'Illegal Immigration', 'Police'];


    // Loop through each players
    for (const player of players) {
        console.log('Seeding for player:', player.username);

        for (const topic of topics) {
            // 1) Get all unrated headlines for this player
            const headlines = await headlineData.getAllUnratedHeadlines(player.id, topic);
            if (!headlines || headlines.length === 0) continue;
            console.log(headlines.length)

            // 2) Rate each headline
            for (const headline of headlines) {
                // 3) Generate rating based on the statistical probability
                const rating = weightedRandom(headline.seed_stance);
                
                // 4) Rate the headline
                await headlineData.rateHeadline(player.id, headline.id, rating);

                // 5) Get summary of all ratings for this headline
                const summary = await headlineData.getHeadlineRatingsSummary(headline.id);

                // 6) Calculate and update score in DB
                const {message, score} = await headlineData.calculateScore(player.id, rating, summary);

                // 7) Update user's score and fetch their updated DB record
                const updatedPlayer = await userData.updateUserScore(player.id, score);
                console.log(`Rated headline ${headline.id} → ${stanceMap[rating]} (+${score})`);
            }
        }
    }
}

seedRatings();