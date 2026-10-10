const sessionUser = readSessionUser();

if (sessionUser) {
  document.querySelector('#login-link').classList.add('is-hidden');
  document.querySelector('#logout-button').classList.remove('is-hidden');
  if (sessionUser.auteur === true) {
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
    return JSON.parse(sessionStorage.getItem('atelier-user'));
  } catch {
    return null;
  }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(date);
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
    entry.append(meta, title, content);
    list.append(entry);
  }
}

fetch('/article')
  .then((response) => {
    if (!response.ok) throw new Error('Impossible de charger les articles.');
    return response.json();
  })
  .then(renderArticles)
  .catch((error) => {
    document.querySelector('#list-message').textContent = error.message;
  });