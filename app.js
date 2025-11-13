import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import session from 'express-session';
import infoRouter from './routes/info.js'; //Ron added code here for Game Info page
import routes from './routes/index.js';
import {config} from 'dotenv';



// Set up .env file for use
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Handlebars
app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main',
  layoutsDir: path.resolve('views/layouts'),
  partialsDir: path.resolve('views/partials')
}));
app.set('view engine', 'handlebars');
app.set('views', path.resolve('views'));

// Session middleware
app.use(
    session({
        name: "AuthenticationState", // Name of the session ID cookie
        secret: "some secret string!",
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 1000 * 60 * 60 * 1} // The session expires after 1 hour
    })
)

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.resolve('public')));

app.use('/', infoRouter); //Ron added code here for Game Info

/* General Middleware */
app.use((req, res, next) => {
  let date = new Date().toUTCString();
  let isLoggedIn;
  if (req.session.user) isLoggedIn = true;
  else isLoggedIn = false;

  if (isLoggedIn) {
      // User
      if (req.session.user.isAdmin)
        console.log(`[${date}]: ${req.method} ${req.path} (Authenticated Admin)`);   
      else
        console.log(`[${date}]: ${req.method} ${req.path} (Authenticated User)`);
      } else console.log(`[${date}]: ${req.method} ${req.path} (Non-Authenticated)`);

  next();
});

/* GET /login */
app.use('/login', (req, res, next) => {
  if (!req.session.user) next();
  else return res.redirect('main');
})

/* GET /signup */
app.use('/signup', (req, res, next) => {
  if (!req.session.user) next();
  else return res.redirect('main');
})

/* GET /main */
app.use('/main', (req, res, next) => {
  if (req.session.user) next();
  else return res.redirect('login');
})

// Routes

routes(app);



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
