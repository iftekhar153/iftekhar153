// BUET Verification Gateway and Anonymous Identity Manager

(function () {
  const STORAGE_KEY_VERIFIED = 'buet_student_verified_v1';
  const STORAGE_KEY_ALIAS = 'buet_student_alias_v1';
  const STORAGE_KEY_AVATAR = 'buet_student_avatar_v1';

  const MASCOTS = ['🦊', '🐺', '🦅', '🦉', '🐉', '🦡', '🦦', '🐼', '⚡', '🚀', '🔮', '🛡️'];

  class IdentityManager {
    constructor() {
      this.init();
    }

    init() {
      if (!localStorage.getItem(STORAGE_KEY_ALIAS)) {
        this.setAlias(window.getRandomAnonymousName());
      }
      if (!localStorage.getItem(STORAGE_KEY_AVATAR)) {
        this.setAvatar(MASCOTS[Math.floor(Math.random() * MASCOTS.length)]);
      }
    }

    isVerified() {
      return localStorage.getItem(STORAGE_KEY_VERIFIED) === 'true';
    }

    setVerified(value = true) {
      localStorage.setItem(STORAGE_KEY_VERIFIED, value ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('buet-verification-change', { detail: { verified: value } }));
    }

    getAlias() {
      return localStorage.getItem(STORAGE_KEY_ALIAS) || 'AnonymousStudent';
    }

    setAlias(alias) {
      const sanitized = (alias || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 24);
      localStorage.setItem(STORAGE_KEY_ALIAS, sanitized || 'AnonymousStudent');
      window.dispatchEvent(new CustomEvent('buet-identity-change', { detail: { alias: this.getAlias(), avatar: this.getAvatar() } }));
    }

    getAvatar() {
      return localStorage.getItem(STORAGE_KEY_AVATAR) || '🦊';
    }

    setAvatar(avatar) {
      localStorage.setItem(STORAGE_KEY_AVATAR, avatar);
      window.dispatchEvent(new CustomEvent('buet-identity-change', { detail: { alias: this.getAlias(), avatar } }));
    }

    rerollAlias() {
      const newName = window.getRandomAnonymousName();
      const newMascot = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
      this.setAlias(newName);
      this.setAvatar(newMascot);
      return { alias: newName, avatar: newMascot };
    }

    getRandomQuestion() {
      const questions = window.BUET_VERIFICATION_QUESTIONS || [];
      const randomIndex = Math.floor(Math.random() * questions.length);
      return questions[randomIndex];
    }

    validateAnswer(questionId, userInput) {
      const questions = window.BUET_VERIFICATION_QUESTIONS || [];
      const q = questions.find(item => item.id === questionId);
      if (!q) return false;
      return q.validate(userInput);
    }
  }

  window.identityManager = new IdentityManager();
  window.BUET_MASCOTS = MASCOTS;
})();
