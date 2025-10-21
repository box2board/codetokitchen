// /assets/js/main.js
// category filter
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  const filter = chip.dataset.filter;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === chip));
  document.querySelectorAll('.recipe-card').forEach(card => {
    const cat = card.dataset.category;
    const show = (filter === 'all') || card.classList.contains(filter) || cat === filter;
    card.style.display = show ? '' : 'none';
  });
});

// smooth scroll for in-page links
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if (el) {
    e.preventDefault();
    el.scrollIntoView({behavior:'smooth', block:'start'});
    el.focus?.({preventScroll:true});
  }
});
