import express from 'express';
import headlineData from '../data/headlines.js';
import userData from '../data/users.js';
import helpers from '../data/helpers.js';

const router = express.Router();

router
  .route('/')
  .get(async (req, res) => {
    try {
      const topicTitle = helpers.checkString(req.query.topic, 'topics');
      const headline = await headlineData.getUnratedHeadline(req.session.user.id, topicTitle);

      return res.render('headline', {
        username: req.session.user.username,
        topic: topicTitle,
        headline: headline,
        score: req?.session?.user?.score,
        rank: req?.session?.user?.rank,
        total: req?.session?.user?.total
      });
    } catch (e) {
      console.error(e);
      return res.status(500).render('error', {
        error: e.message || String(e),
        status: 500,
        score: req?.session?.user?.score,
        rank: req?.session?.user?.rank,
        total: req?.session?.user?.total
      });
    }
});

router
  .route('/ratings')
  .post(async (req, res) => {
    /* Submit user ratings! */
    try {
      // Validate input
      const topicTitle = helpers.checkString(req.body.topic, 'topic');
      const headlineId = helpers.checkId(req.body.headlineId);
      const stance = req.body.stance;

      // Insert the rating
      await headlineData.rateHeadline(req.session.user.id, headlineId, stance);

      // Get summary of all ratings for this headline
      const summary = await headlineData.getHeadlineRatingsSummary(headlineId);

      // Fetch same headline to display with summary
      const headline = await headlineData.getHeadlineById(headlineId);
      const {message, score} = await headlineData.calculateScore(req.session.user.id, stance, summary);

      // Update user ranking and score in the session
      const player = await userData.getUserById(req.session.user.id);
      const {rank, total} = await userData.getUserRank(req.session.user.id);
      req.session.user.score = player.score;
      req.session.user.rank = rank;
      req.session.user.total = total;
      console.log("NEW REQ SESSION:", req.session.user);

      return res.render('headline', {
        username: req.session.user.username,
        topic: topicTitle,
        headline,
        summary,
        score: req?.session?.user?.score,
        rank: req?.session?.user?.rank,
        total: req?.session?.user?.total,
        message,
        scoreEarned: score
      });
    } catch (e) {
      console.error(e);
      return res.status(500).render('error', {
        error: e.message || String(e),
        status: 500,
        score: req?.session?.user?.score,
        rank: req?.session?.user?.rank,
        total: req?.session?.user?.total
      });
    }
});



export default router;
