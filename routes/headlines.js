import express from 'express';
import headlineData from '../data/headlines.js';
import helpers from '../data/helpers.js';

const router = express.Router();

router
  .route('/')
  .get(async (req, res) => {
    console.log("INSIDE HEADLINES")
    const topicTitle = helpers.checkString(req.query.topic);
    try {
      const headline = await headlineData.getUnratedHeadline(req.session.user.id, topicTitle);
      if (!headline) return res.render('error', { username: req.session.user.username, topic: topicTitle });
      return res.render('headline', { username: req.session.user.username, topic: topicTitle, headline });
    } catch (e) {
      console.error(e);
      return res.status(500).render('error', {
        error: e.message || String(e),
        status: 500
      });
    }
});


export default router;
