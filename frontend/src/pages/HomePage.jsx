import { Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

import { auth } from '../firebase/client';
import { useAuthUser } from '../auth/useAuthUser';
import { useI18n } from '../i18n/I18nProvider';
import { useHeadMeta } from '../lib/useHeadMeta';
import styles from './HomePage.module.css';

// Placeholder landing route — boards overview is a separate ticket (out of
// scope here). This exists only as the redirect target for the auth flow:
// guards the route (bounces anonymous visitors to /auth) and proves a
// successful sign-in actually lands here.
function HomePage() {
  const { user, loading } = useAuthUser();
  const { t } = useI18n();

  useHeadMeta({ title: t('app.name'), description: t('auth.description') });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className={styles.page}>
      <h1>{t('app.name')}</h1>
      <p>{t('home.signedInAs', { email: user.email })}</p>
      <button type="button" className={styles.signOut} onClick={() => signOut(auth)}>
        {t('home.signOut')}
      </button>
    </div>
  );
}

export default HomePage;
