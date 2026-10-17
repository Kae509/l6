const form = document.querySelector('#auth-form');
const message = document.querySelector('#form-message');
const modeButtons = document.querySelectorAll('.mode-button');
const authorChoice = document.querySelector('#author-choice');
const passwordInput = document.querySelector('#password');
let mode = 'login';

function getUserRole(user) {
  if (typeof user?.role === 'string' && user.role.trim()) {
    return user.role.trim().toLowerCase();
  }
  if (user?.auteur === true) {
    return 'auteur';
  }
  return 'user';
}

function normalizeUser(user) {
  if (!user) return null;
  const role = getUserRole(user);
  return {
    ...user,
    role,
    auteur: role === 'auteur' || role === 'admin'
  };
}

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === 'register';
  document.querySelector('#form-kicker').textContent = registering ? 'REJOINDRE ATELIER' : 'BON RETOUR';
  document.querySelector('#form-title').textContent = registering ? 'Créer un compte' : 'Se connecter';
  document.querySelector('#submit-button').innerHTML = registering
    ? 'Créer mon compte <span aria-hidden="true">→</span>'
    : 'Se connecter <span aria-hidden="true">→</span>';
  passwordInput.autocomplete = registering ? 'new-password' : 'current-password';
  authorChoice.classList.toggle('is-hidden', !registering);
  message.textContent = '';

  for (const button of modeButtons) {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));

function createSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hashPassword(password, pepper, salt) {
  return CryptoJS.MD5(`${password}${pepper}${salt}`).toString();
}

async function getUsers(email) {
  const response = await fetch(`/users?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error('Impossible de contacter le serveur.');
  return response.json();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  const submitButton = document.querySelector('#submit-button');
  submitButton.disabled = true;

  try {
    const email = form.elements.email.value.trim().toLowerCase();
    const password = form.elements.password.value;
    const users = await getUsers(email);

    if (mode === 'register') {
      if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
      if (users.length > 0) throw new Error('Cette adresse e-mail possède déjà un compte.');

      const sel = createSalt();
      const poivre = createSalt();
      const isAuthor = Boolean(form.elements.author.checked);
      const response = await fetch('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          mdp: hashPassword(password, poivre, sel),
          auteur: isAuthor,
          role: isAuthor ? 'auteur' : 'user',
          poivre,
          sel
        })
      });
      if (!response.ok) throw new Error('La création du compte a échoué.');
      const createdUser = await response.json();
      const sessionUser = normalizeUser(createdUser);
      sessionStorage.setItem('atelier-user', JSON.stringify({
        id: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role,
        auteur: sessionUser.auteur
      }));
      window.location.assign('/index.html');
      return;
    }

    const user = normalizeUser(users[0]);
    if (!user || hashPassword(password, user.poivre, user.sel) !== user.mdp) {
      throw new Error('Adresse e-mail ou mot de passe incorrect.');
    }
    sessionStorage.setItem('atelier-user', JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      auteur: user.auteur
    }));
    window.location.assign('/index.html');
  } catch (error) {
    message.textContent = error.message || 'Une erreur est survenue.';
  } finally {
    submitButton.disabled = false;
  }
});