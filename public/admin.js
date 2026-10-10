function readSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem('atelier-user'));
  } catch {
    return null;
  }
}

const currentUser = readSessionUser();
if (!currentUser) {
  window.location.replace('/login.html');
} else if (currentUser.auteur !== true) {
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
    role.textContent = user.auteur === true ? 'Auteur' : 'Lecteur';
    details.append(email, role);
    row.append(details, makeAction('Supprimer', 'delete-user', 'danger-action'));
    list.append(row);
  }
}

function renderArticles(articles) {
  const list = document.querySelector('#admin-article-list');
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
    meta.textContent = `${formatDate(article.date)} · ${article.publier === true ? 'Publié' : 'Brouillon'}`;
    details.append(title, meta);
    const actions = document.createElement('div');
    actions.className = 'admin-row-actions';
    actions.append(makeAction(article.publier === true ? 'Dépublier' : 'Publier', 'toggle-published'));
    actions.append(makeAction('Supprimer', 'delete-article', 'danger-action'));
    row.append(details, actions);
    list.append(row);
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
    renderArticles(articles);
    message.textContent = '';
  } catch (error) {
    message.textContent = error.message || 'Une erreur est survenue.';
  }
}

document.querySelector('#user-list').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action="delete-user"]');
  if (!button) return;
  const row = button.closest('.admin-row');
  if (!window.confirm(`Supprimer le compte ${row.querySelector('strong').textContent} ?`)) return;

  button.disabled = true;
  try {
    const response = await fetch(`/users/${encodeURIComponent(row.dataset.id)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('La suppression du compte a échoué.');
    if (row.dataset.id === currentUser.id) {
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

if (currentUser?.auteur === true) loadAdminData();