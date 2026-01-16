// /assets/js/main.js
const site = {
  async loadIncludes() {
    const slots = document.querySelectorAll('[data-include]');
    if (!slots.length) return;
    await Promise.all([...slots].map(async (slot) => {
      const name = slot.dataset.include;
      try {
        const res = await fetch(`/assets/includes/${name}.html`, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`Include ${name} failed`);
        slot.innerHTML = await res.text();
      } catch (error) {
        console.error(error);
      }
    }));
  },
  initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const header = document.querySelector('.site-header');
    if (!toggle || !header) return;
    const closeNav = () => {
      header.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });
    document.addEventListener('click', (event) => {
      if (!header.classList.contains('is-open')) return;
      if (!event.target.closest('.site-header')) closeNav();
    });
  },
  initCategoryChips() {
    document.addEventListener('click', (event) => {
      const chip = event.target.closest('.chip');
      if (!chip) return;
      const filter = chip.dataset.filter;
      document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === chip));
      document.querySelectorAll('.recipe-card').forEach(card => {
        const cat = card.dataset.category;
        const show = (filter === 'all') || card.classList.contains(filter) || cat === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  },
  initSmoothScroll() {
    document.addEventListener('click', (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        event.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.focus?.({ preventScroll: true });
      }
    });
  },
  copyIngredients(listId) {
    const list = document.getElementById(listId);
    if (!list) return;
    const items = [...list.querySelectorAll('li')].map(li => li.textContent.trim());
    const text = items.join('\n');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  },
  initPrintButtons() {
    document.querySelectorAll('[data-print]').forEach((button) => {
      button.addEventListener('click', () => window.print());
    });
  },
  initIngredientChecklist() {
    document.querySelectorAll('ul[data-recipe-id]').forEach((list) => {
      const recipeId = list.dataset.recipeId;
      const key = `ck-ingredients-${recipeId}`;
      const saved = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
      [...list.querySelectorAll('li')].forEach((item, index) => {
        const text = item.textContent.trim();
        const wrapper = document.createElement('label');
        wrapper.className = 'ingredient-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = saved.has(index);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            saved.add(index);
          } else {
            saved.delete(index);
          }
          localStorage.setItem(key, JSON.stringify([...saved]));
        });
        const span = document.createElement('span');
        span.textContent = text;
        wrapper.appendChild(checkbox);
        wrapper.appendChild(span);
        item.textContent = '';
        item.appendChild(wrapper);
      });
    });
  },
  async loadRecipes() {
    const res = await fetch('/data/recipes.json');
    if (!res.ok) return [];
    const data = await res.json();
    site.validateRecipes(data);
    return data;
  },
  validateRecipes(recipes) {
    const requiredFields = [
      'id',
      'title',
      'slug',
      'description',
      'category',
      'tags',
      'prepMinutes',
      'cookMinutes',
      'servings',
      'difficulty',
      'ingredients',
      'instructions',
      'image',
      'datePublished'
    ];
    recipes.forEach((recipe) => {
      const missing = requiredFields.filter((field) => {
        if (!(field in recipe)) return true;
        const value = recipe[field];
        if (Array.isArray(value)) return value.length === 0;
        return value === '' || value == null;
      });
      if (missing.length) {
        console.warn(`Recipe ${recipe.id || 'unknown'} missing fields: ${missing.join(', ')}`);
      }
    });
  },
  applyFilters(recipes, params) {
    const q = params.get('q')?.toLowerCase() || '';
    const category = params.get('category') || 'all';
    const tag = params.get('tag') || 'all';
    const sort = params.get('sort') || 'newest';
    let filtered = recipes.filter((recipe) => {
      const haystack = [recipe.title, recipe.description, recipe.ingredients.join(' '), recipe.tags.join(' ')].join(' ').toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesCategory = category === 'all' || recipe.category === category;
      const matchesTag = tag === 'all' || recipe.tags.includes(tag);
      return matchesQuery && matchesCategory && matchesTag;
    });
    filtered = filtered.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.date) - new Date(b.date);
      if (sort === 'az') return a.title.localeCompare(b.title);
      return new Date(b.date) - new Date(a.date);
    });
    return filtered;
  },
  renderRecipeCards(container, recipes) {
    container.innerHTML = recipes.map((recipe) => `
      <article class="recipe-card-mini" data-category="${recipe.category}">
        <img src="${recipe.image}" alt="${recipe.title} image" loading="lazy" width="320" height="200">
        <div>
          <p class="card-eyebrow">${recipe.categoryLabel}</p>
          <h3>${recipe.title}</h3>
          <p>${recipe.description}</p>
          <div class="card-meta">${recipe.totalTime} • ${recipe.difficulty}</div>
          <a class="text-link" href="${recipe.url}">View recipe →</a>
        </div>
      </article>
    `).join('');
  },
  async initRecipeDirectory() {
    const container = document.getElementById('recipe-directory');
    if (!container) return;
    const resultsCount = document.getElementById('recipe-results-count');
    const searchInput = document.getElementById('recipe-search');
    const categorySelect = document.getElementById('recipe-category');
    const tagSelect = document.getElementById('recipe-tag');
    const sortSelect = document.getElementById('recipe-sort');
    const recipes = await site.loadRecipes();

    const updateFromParams = () => {
      const params = new URLSearchParams(window.location.search);
      if (searchInput) searchInput.value = params.get('q') || '';
      if (categorySelect) categorySelect.value = params.get('category') || 'all';
      if (tagSelect) tagSelect.value = params.get('tag') || 'all';
      if (sortSelect) sortSelect.value = params.get('sort') || 'newest';
      return params;
    };

    const render = (params) => {
      const filtered = site.applyFilters(recipes, params);
      site.renderRecipeCards(container, filtered);
      if (resultsCount) {
        resultsCount.textContent = `${filtered.length} recipe${filtered.length === 1 ? '' : 's'} found`;
      }
    };

    const updateParams = () => {
      const params = new URLSearchParams();
      if (searchInput?.value) params.set('q', searchInput.value);
      if (categorySelect?.value && categorySelect.value !== 'all') params.set('category', categorySelect.value);
      if (tagSelect?.value && tagSelect.value !== 'all') params.set('tag', tagSelect.value);
      if (sortSelect?.value && sortSelect.value !== 'newest') params.set('sort', sortSelect.value);
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      render(params);
    };

    const params = updateFromParams();
    render(params);

    [searchInput, categorySelect, tagSelect, sortSelect].forEach((el) => {
      if (!el) return;
      el.addEventListener('input', updateParams);
      el.addEventListener('change', updateParams);
    });
  },
  async initCategoriesPage() {
    const list = document.getElementById('recipe-categories');
    if (!list) return;
    const recipes = await site.loadRecipes();
    const categories = recipes.reduce((acc, recipe) => {
      acc[recipe.category] = recipe.categoryLabel;
      return acc;
    }, {});
    list.innerHTML = Object.entries(categories).map(([value, label]) => `
      <li>
        <a href="/recipes/index.html?category=${value}">${label}</a>
      </li>
    `).join('');
  },
  async initMoreRecipes() {
    const container = document.querySelector('[data-more-recipes]');
    if (!container) return;
    const currentId = container.dataset.currentId;
    const recipes = await site.loadRecipes();
    const picks = recipes.filter((recipe) => recipe.id !== currentId).slice(0, 3);
    container.innerHTML = picks.map((recipe) => `
      <article class="more-recipe-card">
        <img src="${recipe.image}" alt="${recipe.title} image" loading="lazy" width="220" height="140">
        <div>
          <h3>${recipe.title}</h3>
          <p>${recipe.description}</p>
          <a class="text-link" href="${recipe.url}">View recipe →</a>
        </div>
      </article>
    `).join('');
  },
  async initRecipeDetail() {
    const container = document.querySelector('[data-recipe-detail]');
    if (!container) return;
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('id');
    const recipes = await site.loadRecipes();
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) {
      container.innerHTML = '<p>Recipe not found. Explore more in the <a href="/recipes/index.html">recipe directory</a>.</p>';
      return;
    }
    const totalTime = recipe.totalTime || `${(recipe.prepMinutes || 0) + (recipe.cookMinutes || 0)} min`;
    const categoryLabel = recipe.categoryLabel || recipe.category;
    const ingredientListId = `ingredients-list-${recipe.id}`;
    container.dataset.recipeId = recipe.id;
    container.innerHTML = `
      <div class="recipe-hero">
        <div>
          <h1>${recipe.title}</h1>
          <p class="recipe-meta">${recipe.servings} servings • Prep: ${recipe.prepMinutes} min • Cook: ${recipe.cookMinutes} min • Total: ${totalTime}</p>
          <p>${recipe.description}</p>
          <div class="recipe-actions">
            <a class="btn btn-ghost" href="#ingredients">Jump to recipe</a>
            <button class="btn btn-secondary" type="button" data-print>Print recipe</button>
          </div>
        </div>
        <img src="${recipe.image}" alt="${recipe.title} image" loading="lazy" width="220" height="220">
      </div>

      <div class="recipe-details">
        <div class="recipe-detail"><strong>Difficulty</strong>${recipe.difficulty}</div>
        <div class="recipe-detail"><strong>Category</strong>${categoryLabel}</div>
        <div class="recipe-detail"><strong>Tags</strong>${recipe.tags.join(', ')}</div>
      </div>

      <section class="ingredients" id="ingredients">
        <h2>Ingredients</h2>
        <ul id="${ingredientListId}" data-recipe-id="${recipe.id}">
          ${recipe.ingredients.map((item) => `<li>${item}</li>`).join('')}
        </ul>
        <button class="btn btn-secondary copy-btn" type="button" onclick="copyIngredients('${ingredientListId}')">Copy ingredients</button>
      </section>

      <section class="instructions" id="instructions">
        <h2>Instructions</h2>
        <ol>
          ${recipe.instructions.map((step) => `<li>${step}</li>`).join('')}
        </ol>
      </section>

      ${recipe.notes?.length ? `
      <section class="notes">
        <h2>Notes & Substitutions</h2>
        <ul>
          ${recipe.notes.map((note) => `<li>${note}</li>`).join('')}
        </ul>
      </section>
      ` : ''}

      ${recipe.nutrition ? `
      <section class="nutrition">
        <h2>Nutrition</h2>
        <p>${recipe.nutrition}</p>
      </section>
      ` : ''}

      <section class="more-recipes">
        <h2>More recipes to try</h2>
        <div class="more-recipes-grid" data-more-recipes data-current-id="${recipe.id}"></div>
      </section>
    `;
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await site.loadIncludes();
  site.initNav();
  site.initCategoryChips();
  site.initSmoothScroll();
  site.initPrintButtons();
  site.initIngredientChecklist();
  site.initRecipeDirectory();
  site.initCategoriesPage();
  site.initMoreRecipes();
  site.initRecipeDetail();
});

window.copyIngredients = site.copyIngredients;
