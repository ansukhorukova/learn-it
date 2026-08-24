import { Route, Routes, useLocation } from 'react-router-dom';

import AuthPage from './pages/AuthPage';
import BoardsPage from './pages/BoardsPage';
import BoardViewPage from './pages/BoardViewPage';
import ProfilePage from './pages/ProfilePage';
import { useAuthUser } from './auth/useAuthUser';
import { useLocaleSync } from './i18n/useLocaleSync';

function App() {
  const { user } = useAuthUser();
  const location = useLocation();

  // AUTH-008 bugfix: adopt the persisted `users.locale` as soon as an
  // already-authenticated user shows up on reload/new-tab, not only right
  // after an explicit sign-in form submit (see useLocaleSync.js for the
  // full race-condition reasoning behind the `/auth` skip).
  useLocaleSync(user, location.pathname === '/auth');

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<BoardsPage />} />
      <Route path="/boards/:boardId" element={<BoardViewPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

export default App;
