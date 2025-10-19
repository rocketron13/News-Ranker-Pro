import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import session from 'express-session';
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

// Routes
routes(app);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
