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

function isAuthorUser(user) {
  const role = getUserRole(user || {});
  return role === 'auteur' || role === 'admin';
}

const user = readSessionUser();
if (!user) {
  window.location.replace('/login.html');
} else if (!isAuthorUser(user)) {
  window.location.replace('/articles.html');
}

document.querySelector('#logout-button').addEventListener('click', () => {
  sessionStorage.removeItem('atelier-user');
  window.location.assign('/login.html');
});

const articleId = new URLSearchParams(window.location.search).get('id');

async function loadArticleForEdit() {
  if (!articleId) return;
  const form = document.querySelector('#article-form');
  const message = document.querySelector('#article-message');
  try {
    const response = await fetch(`/article/${encodeURIComponent(articleId)}`);
    if (!response.ok) throw new Error('Article introuvable.');
    const article = await response.json();

    if (String(article.userId || article.auteurId) !== String(user.id) && getUserRole(user) !== 'admin') {
      window.location.replace('/articles.html');
      return;
    }

    form.elements.titre.value = article.titre || '';
    form.elements.article.value = article.article || '';
    form.elements.publier.value = article.publier === true ? 'true' : 'false';
    document.querySelector('#editor-title').textContent = 'Modifier l’article';
    document.querySelector('#save-article').textContent = 'Mettre à jour l’article';
  } catch (error) {
    message.textContent = error.message || 'Une erreur est survenue.';
  }
}

loadArticleForEdit();

document.querySelector('#article-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const currentUser = readSessionUser();
  const message = document.querySelector('#article-message');
  const submitButton = document.querySelector('#save-article');

  if (!currentUser || !isAuthorUser(currentUser)) {
    window.location.replace(currentUser ? '/articles.html' : '/login.html');
    return;
  }

  message.textContent = '';
  submitButton.disabled = true;

  try {
    const form = event.currentTarget;
    const payload = {
      titre: form.elements.titre.value.trim(),
      article: form.elements.article.value.trim(),
      date: articleId ? undefined : new Date().toISOString(),
      publier: form.elements.publier.value === 'true',
      userId: currentUser.id,
      authorEmail: currentUser.email,
      auteurId: currentUser.id
    };

    if (!payload.titre || !payload.article) {
      throw new Error('Le titre et le contenu de l’article sont obligatoires.');
    }

    const endpoint = articleId ? `/article/${encodeURIComponent(articleId)}` : '/article';
    const method = articleId ? 'PATCH' : 'POST';
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('L’article n’a pas pu être enregistré.');
    window.location.assign('/articles.html');
  } catch (error) {
    message.textContent = error.message || 'Une erreur est survenue.';
  } finally {
    submitButton.disabled = false;
  }
});