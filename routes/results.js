// routes/results.js
import express from 'express';
import { sb } from '../config/supabaseClient.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const headlineId = req.query.headline_id;

  if (!headlineId) {
    return res.status(400).send('Missing headline_id');
  }

  // Fetch all ratings for this headline
  const { data, error } = await sb
    .from('ratings')
    .select('stance_chosen')
    .eq('headline_id', headlineId);

  if (error) {
    console.error(error);
    return res.status(500).send('Error fetching ratings');
  }

  // Count votes
  const counts = {
    strongly_anti: 0,
    moderately_anti: 0,
    neutral: 0,
    moderately_pro: 0,
    strongly_pro: 0
  };
  data.forEach(r => {
    counts[r.stance_chosen] = (counts[r.stance_chosen] ?? 0) + 1;
  });

  const total = data.length || 1;

  // Compute percentages
  const percentages = {};
  for (const key in counts) {
    percentages[key] = Math.round((counts[key] * 100) / total);
  }

  // Render the results page
  res.render('results', {
    title: 'Results',
    headlineId,
    total,
    counts,
    percentages
  });
});

export default router;
