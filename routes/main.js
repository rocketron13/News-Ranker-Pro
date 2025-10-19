import express from 'express';
const router = express.Router();

router.get('/', async (req, res) => {
  console.log('Inside the main.js route!')
  try {
    const username = req.session.user.username || "Guest";
    return res.render('mainMenu', {username})
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
