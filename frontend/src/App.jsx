import { Route, Routes, useLocation } from 'react-router-dom';

import AuthPage from './pages/AuthPage';
import BoardsPage from './pages/BoardsPage';
import BoardViewPage from './pages/BoardViewPage';
import ProfilePage from './pages/ProfilePage';
import PeopleSearchPage from './pages/PeopleSearchPage';
import UserProfilePage from './pages/UserProfilePage';
import DmThreadsPage from './pages/DmThreadsPage';
import DmThreadPage from './pages/DmThreadPage';
import CompetencyChatPage from './pages/CompetencyChatPage';
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
      <Route path="/people" element={<PeopleSearchPage />} />
      <Route path="/users/:id" element={<UserProfilePage />} />
      <Route path="/messages" element={<DmThreadsPage />} />
      <Route path="/messages/:threadId" element={<DmThreadPage />} />
      <Route path="/competencies/:id/chat" element={<CompetencyChatPage />} />
    </Routes>
  );
}

export default App;
