// routes/info.js
import express from 'express';
const router = express.Router();

router.get('/info', (req, res) => {
  const user = req?.session?.user || {};

  res.locals.isInfoPage = true; //Make the flag visible (if on Game Info page or not)


  return res.render('gameInfo', {
    username: user.username,
    score: user.score,
    rank: user.rank,
    total: user.total,
    isInfoPage: true
  });
});

export default router;
