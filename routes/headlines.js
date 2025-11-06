import express from 'express';
import headlineData from '../data/headlines.js';
import helpers from '../data/helpers.js';

const router = express.Router();

router
  .route('/')
  .get(async (req, res) => {
    try {
      const topicTitle = helpers.checkString(req.query.topic, 'topics');
      const headline = await headlineData.getUnratedHeadline(req.session.user.id, topicTitle);

      console.log(headline)
      return res.render('headline', {
        username: req.session.user.username,
        topic: topicTitle,
        headline: headline
      });
    } catch (e) {
      console.error(e);
      return res.status(500).render('error', {
        error: e.message || String(e),
        status: 500
      });
    }
});

router
  .route('/ratings')
  .post(async (req, res) => {
    /* Submit user ratings! */
    try {
      console.log("RATING SUBMITED")
      console.log(req.body);
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
      //const {message, points} = await headlineData.calculateScore(stance, summary);

      return res.render( 'headline', {
        username: req.session.user.username,
        topic: topicTitle,
        headline,
        summary
      });
    } catch (e) {
      console.error(e);
      return res.status(500).render('error', {
        error: e.message || String(e),
        status: 500
      });
    }
});



export default router;
