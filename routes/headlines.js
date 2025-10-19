import express from 'express';
import { getRandomHeadline } from '../data/headlines.js';
import { getTopicByTitle } from '../data/topics.js';

const router = express.Router();

router.get('/', async (req, res) => {
  console.log("In headline.js route")
  if (!req.session.user) return res.redirect('/');
  const topicTitle = req.query.topic;
  try {
    const topic = await getTopicByTitle(topicTitle);
    const headline = await getRandomHeadline(topic.id, req.session.user.id);
    if (!headline) return res.render('noMoreHeadlines', { username: req.session.user.username, topic: topicTitle });
    return res.render('headline', { username: req.session.user.username, topic: topicTitle, headline });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong.');
  }
});

export default router;
