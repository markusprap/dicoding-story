import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import LoginPage from '../pages/login/login-page';
import DetailPage from '../pages/detail/detail-page';
import AddPage from '../pages/add/add-page';
import NotFoundPage from '../pages/not-found/not-found-page';
import SavedStoriesPage from '../pages/offline/offline-data-page';

const routes = {
  '/login': new LoginPage(),
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/detail/:id': new DetailPage(),
  '/add': new AddPage(),
  '/saved': new SavedStoriesPage(),
  '/404': new NotFoundPage(),
};

export default routes;
