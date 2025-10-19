import express from 'express';
import { submitRating, getRatingsForHeadline, STANCE_ENUM } from '../data/ratings.js';

const router = express.Router();

router.post('/', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const { headlineId, stance, topicId } = req.body;

  try {
    // 1. Submit the rating
    const result = await submitRating({
      headline_id: headlineId,
      topic_id: topicId,
      stance_value: stance,
      device_id: null,
      user_id: req.session.user.id
    });

    let alreadyRated = false;
    if (result.alreadyRated) alreadyRated = true;

    // 2. Fetch all ratings for this headline
    const ratings = await getRatingsForHeadline(headlineId);

    // 3. Count each stance
    const counts = {
      strongly_anti: 0,
      moderately_anti: 0,
      neutral: 0,
      moderately_pro: 0,
      strongly_pro: 0,
    };

    ratings.forEach(r => {
      const key = STANCE_ENUM[r.stance_chosen];
      if (key) counts[key]++;
    });

    const total = ratings.length || 1; // avoid divide by 0

    // 4. Prepare percentages (like your frontend does)
    const percentages = {};
    Object.keys(counts).forEach(k => {
      percentages[k] = Math.round((counts[k] * 100) / total);
    });

    // Redirect to results.js
    return res.redirect(`/results?headline_id=${headlineId}`);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving rating or fetching headline ratings.' });
  }
});

export default router;
