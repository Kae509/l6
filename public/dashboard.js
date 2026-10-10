const sessionUser = sessionStorage.getItem('atelier-user');

if (!sessionUser) {
  window.location.replace('/login.html');
} else {
  const user = JSON.parse(sessionUser);
  document.querySelector('#welcome-email').textContent = user.email;
  document.querySelector('#role-label').textContent = user.auteur ? 'Compte auteur' : 'Compte lecteur';
  document.querySelector('#write-link').classList.toggle('is-hidden', user.auteur !== true);
  document.querySelector('#admin-link').classList.toggle('is-hidden', user.auteur !== true);
}

document.querySelector('#logout-button').addEventListener('click', () => {
  sessionStorage.removeItem('atelier-user');
  window.location.assign('/login.html');
});