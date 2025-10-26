import express from 'express';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const username = req.session.user.username || "Guest";
    return res.render('mainMenu', {username})
  } catch (e) {
    return res.status(500).render('error', {
      error: e.message || String(e),
      status: 500
    });
  }
});

export default router;
