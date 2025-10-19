import express from 'express';
import { createOrFetchUser } from '../data/users.js';
const router = express.Router();

router.post('/login', async (req, res) => {
  console.log('Inside the user route!')
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
