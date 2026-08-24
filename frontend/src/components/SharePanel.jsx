import { useEffect, useState } from 'react';

import ConfirmDialog from './ConfirmDialog';
import styles from './SharePanel.module.css';

const ROLES = ['viewer', 'collaborator'];

// Shared UI for US13 (share a whole board) and US14 (share a single task) —
// both are the same shape on the BE (list/add/update-role/remove against a
// { email, role } resource, owner-only) and the same shape here: an
// email+role form plus a list of current members/shares with inline
// role-change and remove. The caller (BoardViewPage/TaskPanel) supplies
// `api`, the four bound functions for whichever resource this instance is
// sharing, so this component itself never branches on board-vs-task.
//
// Only ever rendered when the caller has already confirmed `myRole ===
// 'owner'` (US13/US15: only the owner manages sharing) — this component
// doesn't re-check that itself, it trusts the caller's gating, same as every
// other conditionally-rendered panel in this app (e.g. TaskPanel's own
// add/delete controls, gated the same way for viewer/collaborator).
function SharePanel({ panelTitleKey, idToken, api, t, onClose }) {
  const [members, setMembers] = useState(null); // null = loading
  const [loadErrorKey, setLoadErrorKey] = useState(null);
  const [bannerErrorKey, setBannerErrorKey] = useState(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [formErrorKey, setFormErrorKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [savingRoleId, setSavingRoleId] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !removeTarget) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, removeTarget]);

  useEffect(() => {
    let cancelled = false;
    setMembers(null);
    setLoadErrorKey(null);
    (async () => {
      try {
        const data = await api.list(idToken);
        if (!cancelled) setMembers(data);
      } catch (err) {
        if (!cancelled) setLoadErrorKey(err.messageKey || 'errors.generic');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `api` is a fresh bound-function object every render from the caller; re-running this effect on its identity would refetch on every keystroke elsewhere on the page. idToken is the only value that should ever trigger a refetch.
  }, [idToken]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setFormErrorKey('errors.share.emailInvalid');
      return;
    }

    setSubmitting(true);
    setFormErrorKey(null);
    try {
      // Idempotent upsert on the BE (US17): re-sharing an existing email
      // updates that row's role rather than erroring — reflected here by
      // replacing an existing row with the same id, not always appending.
      const member = await api.add(idToken, { email: trimmed, role });
      setMembers((prev) => {
        const list = prev || [];
        const existingIndex = list.findIndex((m) => m.id === member.id);
        if (existingIndex === -1) return [...list, member];
        return list.map((m, i) => (i === existingIndex ? member : m));
      });
      setEmail('');
      setRole('viewer');
    } catch (err) {
      setFormErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(member, newRole) {
    if (newRole === member.role) return;
    setSavingRoleId(member.id);
    setBannerErrorKey(null);
    try {
      const updated = await api.updateRole(idToken, member.id, { role: newRole });
      setMembers((prev) => (prev || []).map((m) => (m.id === member.id ? updated : m)));
    } catch (err) {
      setBannerErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setSavingRoleId(null);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.remove(idToken, removeTarget.id);
      setMembers((prev) => (prev || []).filter((m) => m.id !== removeTarget.id));
      setRemoveTarget(null);
    } catch (err) {
      setBannerErrorKey(err.messageKey || 'errors.generic');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="share-panel-title" className={styles.title}>
            {t(panelTitleKey)}
          </h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label={t('attachment.panel.close')}>
            ×
          </button>
        </div>

        {bannerErrorKey && (
          <p className={styles.banner} role="alert">
            {t(bannerErrorKey)}
          </p>
        )}

        <div>
          <h3 className={styles.subheading}>{t('share.members.title')}</h3>
          {members === null && !loadErrorKey && <p className={styles.hint}>{t('attachment.panel.loading')}</p>}
          {loadErrorKey && (
            <p className={styles.banner} role="alert">
              {t(loadErrorKey)}
            </p>
          )}
          {members !== null && (
            <ul className={styles.memberList}>
              {/* The caller who can even open this panel is always the
                  resource's owner (US13/US15: SharePanel is only ever
                  rendered when myRole === 'owner', by BoardViewPage.jsx /
                  TaskPanel.jsx) — shown as a fixed, non-editable first row
                  rather than fetched, since owner access is never a
                  board_members/task_shares row to begin with. */}
              <li className={styles.memberRow}>
                <div className={styles.memberInfo}>
                  <span className={styles.memberEmail}>{t('share.role.owner')}</span>
                  <span className={styles.memberMeta}>{t('share.members.you')}</span>
                </div>
              </li>
              {members.map((member) => (
                <li key={member.id} className={styles.memberRow}>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberEmail}>{member.email}</span>
                    {member.displayName && <span className={styles.memberMeta}>{member.displayName}</span>}
                  </div>
                  <div className={styles.memberActions}>
                    <label className={styles.srOnly} htmlFor={`share-role-${member.id}`}>
                      {t('share.form.roleLabel')}
                    </label>
                    <select
                      id={`share-role-${member.id}`}
                      className={styles.roleSelect}
                      value={member.role}
                      disabled={savingRoleId === member.id}
                      onChange={(event) => handleRoleChange(member, event.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {t(`share.role.${r}`)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => setRemoveTarget(member)}
                      aria-label={t('share.remove.cta')}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {members !== null && members.length === 0 && <p className={styles.hint}>{t('share.members.empty')}</p>}
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.label} htmlFor="share-email">
            {t('share.form.emailLabel')}
          </label>
          <input
            id="share-email"
            type="email"
            className={styles.input}
            value={email}
            placeholder={t('share.form.emailPlaceholder')}
            onChange={(event) => setEmail(event.target.value)}
            autoFocus
          />
          <label className={styles.label} htmlFor="share-role-new">
            {t('share.form.roleLabel')}
          </label>
          <select
            id="share-role-new"
            className={styles.roleSelect}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`share.role.${r}`)}
              </option>
            ))}
          </select>
          {formErrorKey && <span className={styles.fieldError}>{t(formErrorKey)}</span>}
          <div className={styles.formActions}>
            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? t('share.form.saving') : t('share.form.submit')}
            </button>
          </div>
        </form>
      </aside>

      {removeTarget && (
        <ConfirmDialog
          title={t('share.remove.confirmTitle')}
          message={t('share.remove.confirmMessage', { email: removeTarget.email })}
          confirmLabel={t('share.remove.confirmButton')}
          cancelLabel={t('common.cancel')}
          busy={removing}
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}

export default SharePanel;
