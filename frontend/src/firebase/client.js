import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';

// Public web config — safe to expose to the FE bundle (not a secret, see
// .env.example). Firebase is used for Auth only in this app (see CLAUDE.md
// "Файлове сховище" — attachments go through the BE's S3-compatible client,
// never Firebase Storage SDK).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Popup flow (signInWithPopup), not redirect — decision fixed for this ticket.
export const googleProvider = new GoogleAuthProvider();
