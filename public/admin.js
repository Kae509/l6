function readSessionUser() {
  try {
    const user = JSON.parse(sessionStorage.getItem('atelier-user'));
    if (!user) return null;
    return {
      ...user,
      role: typeof user.role === 'string' && user.role ? user.role.toLowerCase() : (user.auteur === true ? 'auteur' : 'user'),
      auteur: user.auteur === true || user.role === 'admin' || user.role === 'auteur'
    };
  } catch {
    return null;
  }
}

function getUserRole(user) {
  if (typeof user?.role === 'string' && user.role.trim()) return user.role.trim().toLowerCase();
  if (user?.auteur === true) return 'auteur';
  return 'user';
}

function isAdminUser(user) {
  return getUserRole(user) === 'admin';
}

function createSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hashPassword(password, pepper, salt) {
  return CryptoJS.MD5(`${password}${pepper}${salt}`).toString();
}

const currentUser = readSessionUser();
if (!currentUser) {
  window.location.replace('/login.html');
} else if (!isAdminUser(currentUser)) {
  window.location.replace('/index.html');
}

document.querySelector('#logout-button').addEventListener('click', () => {
  sessionStorage.removeItem('atelier-user');
  window.location.assign('/login.html');
});

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function makeAction(label, action, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `admin-action ${className}`.trim();
  button.dataset.action = action;
  button.textContent = label;
  return button;
}

function labelForRole(user) {
  const role = getUserRole(user);
  if (role === 'admin') return 'Administrateur';
  if (role === 'auteur') return 'Auteur';
  return 'Lecteur';
}

function renderUsers(users) {
  const list = document.querySelector('#user-list');
  list.replaceChildren();
  document.querySelector('#user-count').textContent = `${users.length} compte${users.length > 1 ? 's' : ''}`;

  if (users.length === 0) {
    list.textContent = 'Aucun utilisateur.';
    return;
  }

  for (const user of users) {
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.dataset.id = user.id;

    const details = document.createElement('div');
    details.className = 'admin-row-details';
    const email = document.createElement('strong');
    email.textContent = user.email;
    const role = document.createElement('span');
    role.textContent = labelForRole(user);
    details.append(email, role);

    const actions = document.createElement('div');
    actions.className = 'admin-row-actions';

    const roleSelect = document.createElement('select');
    roleSelect.dataset.roleSelect = 'true';
    roleSelect.dataset.userId = user.id;
    roleSelect.innerHTML = `
      <option value="user" ${getUserRole(user) === 'user' ? 'selected' : ''}>Lecteur</option>
      <option value="auteur" ${getUserRole(user) === 'auteur' ? 'selected' : ''}>Auteur</option>
      <option value="admin" ${getUserRole(user) === 'admin' ? 'selected' : ''}>Administrateur</option>
    `;

    actions.append(roleSelect);
    actions.append(makeAction('Changer mdp', 'change-password'));
    actions.append(makeAction('Supprimer', 'delete-user', 'danger-action'));
    row.append(details, actions);
    list.append(row);
  }
}

function renderArticles(articles, users) {
  const list = document.querySelector('#admin-article-list');
  const userMap = new Map(users.map((user) => [user.id, user]));
  const sortedArticles = [...articles].sort((first, second) => new Date(second.date) - new Date(first.date));
  list.replaceChildren();
  document.querySelector('#admin-article-count').textContent = `${articles.length} article${articles.length > 1 ? 's' : ''}`;

  if (sortedArticles.length === 0) {
    list.textContent = 'Aucun article.';
    return;
  }

  for (const article of sortedArticles) {
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.dataset.id = article.id;
    const details = document.createElement('div');
    details.className = 'admin-row-details';
    const title = document.createElement('strong');
    title.textContent = article.titre;
    const meta = document.createElement('span');
    const author = userMap.get(article.userId) || userMap.get(article.auteurId) || null;
    meta.textContent = `${formatDate(article.date)} · ${article.publier === true ? 'Publié' : 'Brouillon'} · ${author ? author.email : 'Auteur inconnu'}`;
    details.append(title, meta);
    const actions = document.createElement('div');
    actions.className = 'admin-row-actions';
    actions.append(makeAction(article.publier === true ? 'Dépublier' : 'Publier', 'toggle-published'));
    actions.append(makeAction('Supprimer', 'delete-article', 'danger-action'));
    row.append(details, actions);
    list.append(row);
  }
}

async function updateUserPassword(userId, newPassword) {
  const response = await fetch(`/users/${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error('Impossible de charger l’utilisateur.');
  const user = await response.json();
  const salt = createSalt();
  const pepper = createSalt();
  const hashedPassword = hashPassword(newPassword, pepper, salt);

  const updateResponse = await fetch(`/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mdp: hashedPassword,
      poivre: pepper,
      sel: salt,
      auteur: user.auteur === true || user.role === 'auteur' || user.role === 'admin',
      role: user.role || (user.auteur === true ? 'auteur' : 'user')
    })
  });

  if (!updateResponse.ok) throw new Error('Le mot de passe n’a pas pu être modifié.');
}

async function updateUserRole(userId, nextRole) {
  const response = await fetch(`/users/${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error('Impossible de charger l’utilisateur.');
  const user = await response.json();
  const normalizedRole = nextRole === 'admin' ? 'admin' : nextRole === 'auteur' ? 'auteur' : 'user';
  const payload = {
    role: normalizedRole,
    auteur: normalizedRole === 'auteur' || normalizedRole === 'admin',
    poivre: user.poivre,
    sel: user.sel,
    mdp: user.mdp
  };

  const updateResponse = await fetch(`/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!updateResponse.ok) throw new Error('Le rôle n’a pas pu être modifié.');

  if (String(userId) === String(currentUser.id)) {
    currentUser.role = normalizedRole;
    currentUser.auteur = normalizedRole === 'auteur' || normalizedRole === 'admin';
    sessionStorage.setItem('atelier-user', JSON.stringify({
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      auteur: currentUser.auteur
    }));
  }
}

async function loadAdminData() {
  const message = document.querySelector('#admin-message');
  message.textContent = 'Chargement…';
  try {
    const [usersResponse, articlesResponse] = await Promise.all([fetch('/users'), fetch('/article')]);
    if (!usersResponse.ok || !articlesResponse.ok) throw new Error('Impossible de charger les données.');
    const [users, articles] = await Promise.all([usersResponse.json(), articlesResponse.json()]);
    renderUsers(users);
    renderArticles(articles, users);
    message.textContent = '';
  } catch (error) {
    message.textContent = error.message || 'Une erreur est survenue.';
  }
}

document.querySelector('#user-list').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const row = button.closest('.admin-row');

  if (button.dataset.action === 'change-password') {
    const userId = row.dataset.id;
    const email = row.querySelector('strong').textContent;
    const newPassword = window.prompt(`Nouveau mot de passe pour ${email} :`, '');
    if (!newPassword) return;
    if (newPassword.length < 8) {
      document.querySelector('#admin-message').textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    try {
      await updateUserPassword(userId, newPassword);
      document.querySelector('#admin-message').textContent = 'Mot de passe mis à jour.';
      await loadAdminData();
    } catch (error) {
      document.querySelector('#admin-message').textContent = error.message || 'Une erreur est survenue.';
    }
    return;
  }

  if (button.dataset.action !== 'delete-user') return;
  const email = row.querySelector('strong').textContent;
  if (!window.confirm(`Supprimer le compte ${email} ?`)) return;

  button.disabled = true;
  try {
    const response = await fetch(`/users/${encodeURIComponent(row.dataset.id)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('La suppression du compte a échoué.');
    if (String(row.dataset.id) === String(currentUser.id)) {
      sessionStorage.removeItem('atelier-user');
      window.location.assign('/login.html');
      return;
    }
    await loadAdminData();
  } catch (error) {
    document.querySelector('#admin-message').textContent = error.message || 'Une erreur est survenue.';
    button.disabled = false;
  }
});

document.querySelector('#user-list').addEventListener('change', async (event) => {
  const select = event.target.closest('[data-role-select]');
  if (!select) return;
  const userId = select.dataset.userId;
  const nextRole = select.value;

  try {
    await updateUserRole(userId, nextRole);
    await loadAdminData();
  } catch (error) {
    document.querySelector('#admin-message').textContent = error.message || 'Une erreur est survenue.';
    await loadAdminData();
  }
});

document.querySelector('#admin-article-list').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const row = button.closest('.admin-row');
  button.disabled = true;

  try {
    let response;
    if (button.dataset.action === 'toggle-published') {
      const articleResponse = await fetch(`/article/${encodeURIComponent(row.dataset.id)}`);
      if (!articleResponse.ok) throw new Error('Impossible de charger cet article.');
      const article = await articleResponse.json();
      response = await fetch(`/article/${encodeURIComponent(row.dataset.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publier: article.publier !== true })
      });
    } else if (button.dataset.action === 'delete-article') {
      const title = row.querySelector('strong').textContent;
      if (!window.confirm(`Supprimer l’article « ${title} » ?`)) {
        button.disabled = false;
        return;
      }
      response = await fetch(`/article/${encodeURIComponent(row.dataset.id)}`, { method: 'DELETE' });
    }

    if (!response?.ok) throw new Error('La modification de l’article a échoué.');
    await loadAdminData();
  } catch (error) {
    document.querySelector('#admin-message').textContent = error.message || 'Une erreur est survenue.';
    button.disabled = false;
  }
});

loadAdminData();