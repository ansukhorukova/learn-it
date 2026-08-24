import { Route, Routes } from 'react-router-dom';

import AuthPage from './pages/AuthPage';
import BoardsPage from './pages/BoardsPage';
import BoardViewPage from './pages/BoardViewPage';
import ProfilePage from './pages/ProfilePage';

function App() {
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
