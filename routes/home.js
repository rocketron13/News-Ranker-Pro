// routes/home.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', {title: 'Headline Game'});
});

export default router;
