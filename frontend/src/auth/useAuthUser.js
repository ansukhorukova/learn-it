import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../firebase/client';

/**
 * Tracks the current Firebase Auth user, provider-agnostically (email or
 * Google — indistinguishable here, matching the BE middleware). Used both to
 * redirect an already-authenticated visitor away from /auth, and to guard
 * the home route.
 */
export function useAuthUser() {
  const [state, setState] = useState({ user: null, loading: true });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false });
    });
    return unsubscribe;
  }, []);

  return state;
}
