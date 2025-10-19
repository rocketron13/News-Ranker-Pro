import { static as staticDir } from 'express';
import path from 'path';
import homeRoutes from './home.js';
import usersRoutes from './users.js';
import mainRoutes from './main.js';
import topicsRoutes from './topics.js';
import headlinesRoutes from './headlines.js';
import ratingsRoutes from './ratings.js';
import resultsRoutes from './results.js'

const constructorMethod = (app) => {
  // Serve static files
  app.use('/public', staticDir(path.resolve('public')));

  // API routes
  app.use('/', homeRoutes);
  app.use('/users', usersRoutes);
  app.use('/main', mainRoutes);
  app.use('/topics', topicsRoutes);
  app.use('/headlines', headlinesRoutes);
  app.use('/ratings', ratingsRoutes);
  app.use('/results', resultsRoutes);

  // Catch-all route
  app.use('*', (req, res) => res.redirect('/'));
};

export default constructorMethod;
