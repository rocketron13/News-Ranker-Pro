import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/');

  const topicTitle = req.query.topic;
  if (!topicTitle) return res.redirect('/main');

  // Redirect to headlines route
  res.redirect(`/headlines?topic=${encodeURIComponent(topicTitle)}`);
});

export default router;
