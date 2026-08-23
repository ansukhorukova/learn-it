import { useEffect } from 'react';

function setMetaTag(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Every route sets its own head metadata (CLAUDE.md "Стилізація": title,
// description, og tags), localized to the currently active locale — call
// this with the already-translated strings from useI18n().t().
export function useHeadMeta({ title, description }) {
  useEffect(() => {
    if (title) {
      document.title = title;
      setMetaTag('property', 'og:title', title);
    }
    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
    }
  }, [title, description]);
}
