import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';

import { auth } from '../firebase/client';
import { useI18n } from '../i18n/I18nProvider';
import styles from './AppHeader.module.css';

// Persistent header for every authenticated route (boards overview, board
// view, and future screens) — carries the sign-out control that used to
// live on the placeholder HomePage (CLAUDE.md task: "keep the ability to
// sign out").
function AppHeader() {
  const { t } = useI18n();

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        {t('app.name')}
      </Link>
      <button type="button" className={styles.signOut} onClick={() => signOut(auth)}>
        {t('home.signOut')}
      </button>
    </header>
  );
}

export default AppHeader;
