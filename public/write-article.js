function readSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem('atelier-user'));
  } catch {
    return null;
  }
}

const user = readSessionUser();
if (!user) {
  window.location.replace('/login.html');
} else if (user.auteur !== true) {
  window.location.replace('/articles.html');
}

document.querySelector('#logout-button').addEventListener('click', () => {
  sessionStorage.removeItem('atelier-user');
  window.location.assign('/login.html');
});

document.querySelector('#article-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const currentUser = readSessionUser();
  const message = document.querySelector('#article-message');
  const submitButton = document.querySelector('#save-article');

  if (!currentUser || currentUser.auteur !== true) {
    window.location.replace(currentUser ? '/articles.html' : '/login.html');
    return;
  }

  message.textContent = '';
  submitButton.disabled = true;

  try {
    const form = event.currentTarget;
    const response = await fetch('/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre: form.elements.titre.value.trim(),
        article: form.elements.article.value.trim(),
        date: new Date().toISOString(),
        publier: form.elements.publier.value === 'true'
      })
    });

    if (!response.ok) throw new Error('L’article n’a pas pu être enregistré.');
    window.location.assign('/articles.html');
  } catch (error) {
    message.textContent = error.message || 'Une erreur est survenue.';
  } finally {
    submitButton.disabled = false;
  }
});