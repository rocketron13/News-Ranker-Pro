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

      // User has rated all headlines in this category
      if (!headline) {
        return res.render('error', {
          error: `Click the 'Main Menu' button below to return to the menu, and select a different category to continue playing!`,
          topic: topicTitle,
          score: req?.session?.user?.score,
          rank: req?.session?.user?.rank,
          total: req?.session?.user?.total
        })
      }

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

      // Fetch same headline to display with summary
      const headline = await headlineData.getHeadlineById(headlineId);

      // 1) Insert the rating
      await headlineData.rateHeadline(req.session.user.id, headlineId, stance);

      // 2) Get summary of all ratings for this headline
      const summary = await headlineData.getHeadlineRatingsSummary(headlineId);

      // 3) Calculate and update score in DB
      const {message, score} = await headlineData.calculateScore(req.session.user.id, stance, summary);
      console.log("Previous user score:", req.session.user.score)
      console.log("score:", score)
      console.log("message:", message)


      // 4) Update user's score and fetch their updated DB record
      const player = await userData.updateUserScore(req.session.user.id, score);
      const {rank, total} = await userData.getUserRank(req.session.user.id);
      console.log("Updated player from DB:", player)
      console.log("getUserRank() rank:", rank)
      console.log("getUserRank() rank:", total)
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
