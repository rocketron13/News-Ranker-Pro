import express from 'express';
import userData from '../data/users.js';
import helpers from '../data/helpers.js';
import bcrypt from 'bcrypt';
import xss from 'xss';
const router = express.Router();

router
  .route('/login')
  .get(async (req, res) => {
    return res.render('login');
  })
  .post(async (req, res) => {
    try {
      // Validate input
      let errors = [];
      let user = {
        email: xss(req.body.email),
        password: xss(req.body.password)
      }
      try {
        user.email = helpers.checkEmail(user.email);
      } catch (e) {
        errors.push(e.message || String(e));
      }
      try {
        user.password = helpers.checkPassword(user.password);
      } catch (e) {
        errors.push(e.message || String(e));
      }
      if (errors.length > 0) {
        return res.status(400).render('login', {
          user: user,
          errors: errors,
          hasErrors: true
        });
      }

      // Attempt to login
      let session;
      try {
        session = await userData.login(user.email, user.password);
      } catch (e) {
        return res.status(400).render('login', {
          user: user,
          errors: ["Invalid login credentials."],
          hasErrors: true
        });
      }

      // Fetch username from 'players' table
      const player = await userData.getUsernameById(session.user.id);

      // Save user in session
      req.session.user = {
        id: session.user.id,
        email: session.user.email,
        username: player.username,
        accessToken: session.access_token, /* Used to authenticate a user's requests */
        refreshToken: session.refresh_token /* Used to get a new access_token when it expires */
      }
      return res.redirect('/main');
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
});


/* SIGNUP ROUTES */
router
  .route('/signup')
  .get(async (req, res) => {
    try {
      return res.render('signup');
    } catch (e) {
      return res.status(500).render('error', {
        error: e.message || String(e),
        status: 500
      })
    }
  })
  .post(async (req, res) => {
    // Validate input
    let errors = [];
    let user = {
      firstName: xss(req.body.firstName),
      lastName: xss(req.body.lastName),
      username: xss(req.body.username),
      email: xss(req.body.email),
      password: xss(req.body.password),
      confirmPassword: xss(req.body.confirmPassword)
    }
    try {
      user.firstName = helpers.checkName(user.firstName);
    } catch (e) {
      errors.push(e.message || String(e));
    }
    try {
      user.lastName = helpers.checkName(user.lastName);
    } catch (e) {
      errors.push(e.message || String(e));
    }
    try {
      user.username = helpers.checkUsername(user.username);
    } catch (e) {
      errors.push(e.message || String(e));
    }
    try {
      user.email = helpers.checkEmail(user.email);
    } catch (e) {
      errors.push(e.message || String(e));
    }
    try {
      user.password = helpers.checkPassword(user.password);
    } catch (e) {
      errors.push(e.message || String(e));
    }
    try {
      user.confirmPassword = helpers.checkPassword(user.confirmPassword);
    } catch (e) {
      errors.push(e.message || String(e));
    }
    if (user.password != user.confirmPassword) errors.push("Password and confirm password must match.");
    // If errors with the input, cancel the submission
    console.log(user)
    if (errors.length > 0) {
      return res.status(400).render('signup', {
        user: user,
        errors: errors,
        hasErrors: true
      });
    }

    // Register the user
    try {
      await userData.registerUser(user.email, user.password, user.username, user.firstName, user.lastName);
      return res.redirect('/login');
    } catch (err) {
      return res.status(500).render('signup', {
        user: user,
        errors: errors,
        hasErrors: true
      });
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
