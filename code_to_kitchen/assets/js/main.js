// Smooth scroll for anchor links
function smoothScroll(event) {
  if (event.target.tagName === 'A' && event.target.getAttribute('href').startsWith('#')) {
    event.preventDefault();
    const targetId = event.target.getAttribute('href').substring(1);
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      target.focus({preventScroll:true});
    }
  }
}

document.addEventListener('click', smoothScroll);

// Copy ingredients to clipboard
function copyIngredients(listId) {
  const list = document.getElementById(listId);
  const items = list.querySelectorAll('li');
  const text = Array.from(items).map(item => item.textContent).join('
');
  navigator.clipboard.writeText(text).then(() => {
    alert('Ingredients copied to clipboard');
  }).catch(err => {
    console.error('Could not copy text', err);
  });
}

/* Analytics stub for future use
function track(event) {
  // Stub for analytics
  console.log('Tracking event:', event);
}
*/
