function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

function getToken() { return localStorage.getItem('wzpark_token'); }
function setToken(t) { localStorage.setItem('wzpark_token', t); }
function clearToken() { localStorage.removeItem('wzpark_token'); }

function isAdmin() { return !!getToken(); }
