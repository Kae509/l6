const sessionUser = readSessionUser();

function getUserRole(user) {
  if (typeof user?.role === 'string' && user.role.trim()) return user.role.trim().toLowerCase();
  if (user?.auteur === true) return 'auteur';
  return 'user';
}

function isAuthorUser(user) {
  const role = getUserRole(user || {});
  return role === 'auteur' || role === 'admin';
}

function canManageArticle(user, article) {
  if (!user) return false;
  if (getUserRole(user) === 'admin') return true;
  return String(article.userId || article.auteurId) === String(user.id);
}

if (sessionUser) {
  document.querySelector('#login-link').classList.add('is-hidden');
  document.querySelector('#logout-button').classList.remove('is-hidden');
  if (isAuthorUser(sessionUser)) {
    document.querySelector('#write-link').classList.remove('is-hidden');
    document.querySelector('#create-article-link').classList.remove('is-hidden');
    document.querySelector('#admin-link').classList.remove('is-hidden');
  }
}

document.querySelector('#logout-button').addEventListener('click', () => {
  sessionStorage.removeItem('atelier-user');
  window.location.assign('/login.html');
});

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

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

function makeAction(label, action, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `admin-action ${className}`.trim();
  button.dataset.action = action;
  button.textContent = label;
  return button;
}

function renderArticles(articles) {
  const list = document.querySelector('#article-list');
  const message = document.querySelector('#list-message');
  const visibleArticles = articles.filter((article) => article.publier === true);

  visibleArticles.sort((first, second) => new Date(second.date) - new Date(first.date));
  list.replaceChildren();

  if (visibleArticles.length === 0) {
    message.textContent = 'Aucun article pour le moment.';
    return;
  }

  message.textContent = '';
  for (const article of visibleArticles) {
    const entry = document.createElement('article');
    entry.className = 'article-entry';
    entry.dataset.id = article.id;

    const meta = document.createElement('div');
    meta.className = 'article-meta';
    const date = document.createElement('time');
    date.dateTime = article.date;
    date.textContent = formatDate(article.date);
    meta.append(date);

    const title = document.createElement('h2');
    title.textContent = article.titre;
    const content = document.createElement('p');
    content.className = 'article-content';
    content.textContent = article.article;

    const actions = document.createElement('div');
    actions.className = 'article-actions';
    if (canManageArticle(sessionUser, article)) {
      actions.append(makeAction('Modifier', 'edit-article'));
      actions.append(makeAction('Supprimer', 'delete-article', 'danger-action'));
      if (getUserRole(sessionUser) === 'admin') {
        actions.append(makeAction(article.publier === true ? 'Dépublier' : 'Publier', 'toggle-published'));
      }
    }

    entry.append(meta, title, content, actions);
    list.append(entry);
  }
}

document.querySelector('#article-list').addEventListener('click', async (event) => {
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;

  const articleId = actionButton.closest('.article-entry')?.dataset.id;
  if (!articleId) return;

  if (actionButton.dataset.action === 'edit-article') {
    window.location.assign(`/write-article.html?id=${encodeURIComponent(articleId)}`);
    return;
  }

  if (actionButton.dataset.action === 'delete-article') {
    if (!window.confirm('Supprimer cet article ?')) return;
    try {
      const response = await fetch(`/article/${encodeURIComponent(articleId)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('La suppression a échoué.');
      const articlesResponse = await fetch('/article');
      const articles = await articlesResponse.json();
      renderArticles(articles);
    } catch (error) {
      document.querySelector('#list-message').textContent = error.message || 'Une erreur est survenue.';
    }
    return;
  }

  if (actionButton.dataset.action === 'toggle-published') {
    try {
      const response = await fetch(`/article/${encodeURIComponent(articleId)}`);
      if (!response.ok) throw new Error('Impossible de charger l’article.');
      const article = await response.json();
      const updated = await fetch(`/article/${encodeURIComponent(articleId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publier: article.publier !== true })
      });
      if (!updated.ok) throw new Error('La publication a échoué.');
      const articlesResponse = await fetch('/article');
      const articles = await articlesResponse.json();
      renderArticles(articles);
    } catch (error) {
      document.querySelector('#list-message').textContent = error.message || 'Une erreur est survenue.';
    }
  }
});

fetch('/article')
  .then((response) => {
    if (!response.ok) throw new Error('Impossible de charger les articles.');
    return response.json();
  })
  .then(renderArticles)
  .catch((error) => {
    document.querySelector('#list-message').textContent = error.message;
  });