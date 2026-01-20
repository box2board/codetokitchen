(() => {
  if (typeof document === 'undefined') {
    return;
  }

  const existingScript = document.querySelector('script[src*="nap5k.com/tag.min.js"]');
  if (existingScript) {
    return;
  }

  const target =
    document.querySelector('main') || document.body || document.documentElement;
  if (!target) {
    return;
  }

  window.monetag = window.monetag || {};
  window.monetag.config = {
    avoidInterstitials: true,
    avoidPopunders: true,
  };

  const script = document.createElement('script');
  script.dataset.zone = '10474979';
  script.src = 'https://nap5k.com/tag.min.js';
  script.async = true;
  target.appendChild(script);
})();
