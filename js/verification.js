// BUET Verification Gateway & Anonymous Identity Manager

(function () {
  const STORAGE_KEY_VERIFIED = 'buet_verified_status_v2';
  const STORAGE_KEY_DEPT = 'buet_verified_dept_v2';
  const STORAGE_KEY_ALIAS = 'buet_anonymous_alias_v2';
  const STORAGE_KEY_AVATAR = 'buet_anonymous_avatar_v2';

  const MASCOTS = ['🦊', '🐺', '🦅', '🦉', '🐉', '🦡', '⚡', '🚀', '🐼', '🛡️', '🦁', '🔮'];

  class IdentityManager {
    constructor() {
      this.init();
    }

    init() {
      if (!localStorage.getItem(STORAGE_KEY_ALIAS)) {
        this.setAlias(window.getRandomAnonymousName ? window.getRandomAnonymousName() : 'WizardFox_42');
      }
      if (!localStorage.getItem(STORAGE_KEY_AVATAR)) {
        this.setAvatar(MASCOTS[Math.floor(Math.random() * MASCOTS.length)]);
      }
    }

    isVerified() {
      return localStorage.getItem(STORAGE_KEY_VERIFIED) === 'true';
    }

    setVerified(dept = 'CSE', score = 5) {
      localStorage.setItem(STORAGE_KEY_VERIFIED, 'true');
      localStorage.setItem(STORAGE_KEY_DEPT, dept);
      window.dispatchEvent(new CustomEvent('buet-verification-change', {
        detail: { verified: true, dept, score }
      }));
    }

    resetVerification() {
      localStorage.removeItem(STORAGE_KEY_VERIFIED);
      localStorage.removeItem(STORAGE_KEY_DEPT);
      window.dispatchEvent(new CustomEvent('buet-verification-change', {
        detail: { verified: false }
      }));
    }

    getDept() {
      return localStorage.getItem(STORAGE_KEY_DEPT) || 'CSE';
    }

    setDept(dept) {
      localStorage.setItem(STORAGE_KEY_DEPT, dept);
    }

    getAlias() {
      return localStorage.getItem(STORAGE_KEY_ALIAS) || 'WizardFox_42';
    }

    setAlias(alias) {
      const sanitized = (alias || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 24);
      localStorage.setItem(STORAGE_KEY_ALIAS, sanitized || 'AnonymousStudent');
      window.dispatchEvent(new CustomEvent('buet-identity-change', {
        detail: { alias: this.getAlias(), avatar: this.getAvatar() }
      }));
    }

    getAvatar() {
      return localStorage.getItem(STORAGE_KEY_AVATAR) || '🦊';
    }

    setAvatar(avatar) {
      localStorage.setItem(STORAGE_KEY_AVATAR, avatar);
      window.dispatchEvent(new CustomEvent('buet-identity-change', {
        detail: { alias: this.getAlias(), avatar }
      }));
    }

    reroll() {
      const newAlias = window.getRandomAnonymousName ? window.getRandomAnonymousName() : 'WizardFox_' + Math.floor(Math.random() * 90 + 10);
      const newAvatar = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
      this.setAlias(newAlias);
      this.setAvatar(newAvatar);
      return { alias: newAlias, avatar: newAvatar };
    }
  }

  window.identityManager = new IdentityManager();
  window.BUET_MASCOTS = MASCOTS;
})();
