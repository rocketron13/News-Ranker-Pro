import express from 'express';
import { createOrFetchUser } from '../data/users.js';
const router = express.Router();

router
  .route('/login')
  .get(async (req, res) => {
    console.log('GET /login')
    return res.render('login', {title: 'Headline Game'});
  })
  .post(async (req, res) => {
    console.log('POST /login')
    try {
      const username = req.body.username;
      console.log(`Server received username: ${username}`);
      // Save user in session
      req.session.user = {
        username: username
      }
      //const user = await createOrFetchUser(username);
      return res.redirect('/main');
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
});


router
  .route('/signup')
  .get(async (req, res) => {
    console.log('GET /signup')
    return res.render('signup', {title: 'Headline Game'});
  })
  .post(async (req, res) => {
    console.log('POST /signup')
    try {
      const username = req.body.username;
      console.log(`Server received username: ${username}`);
      // Save user in session
      req.session.user = {
        username: username
      }
      //const user = await createOrFetchUser(username);
      return res.redirect('/main');
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
});

/* Log out */
router
  .route('/logout')
  .get(async (req, res) => {
    req.session.destroy();
    return res.redirect('/');
});

export default router;
