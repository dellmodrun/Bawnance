(function () {
  'use strict';

  var CONTRACT_ADDRESS = '';
  var X_URL = 'https://x.com/bawnancefun';

  function isHomePage() {
    return /\/(?:Bawnance\/?)?$/.test(window.location.pathname);
  }

  function ensureFavicons() {
    var base = window.location.pathname.indexOf('/Bawnance') === 0 ? '/Bawnance' : '';
    var faviconHref = base + '/favicon.png?v=3';
    var icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      icon.type = 'image/png';
      document.head.appendChild(icon);
    }
    if (icon.getAttribute('href') !== faviconHref) icon.setAttribute('href', faviconHref);

    var touchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!touchIcon) {
      touchIcon = document.createElement('link');
      touchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(touchIcon);
    }
    if (touchIcon.getAttribute('href') !== faviconHref) touchIcon.setAttribute('href', faviconHref);
  }

  function installTopActions() {
    if (!isHomePage() || document.querySelector('.bawnance-top-actions')) return;

    var masthead = document.querySelector('header .bg-masthead > div');
    if (!masthead) return;

    var actions = document.createElement('div');
    actions.className = 'bawnance-top-actions';
    actions.setAttribute('aria-label', 'Bawnance links and contract status');

    var caBox = document.createElement('div');
    caBox.className = 'bawnance-ca-box';
    caBox.setAttribute('role', 'status');
    caBox.innerHTML = '<span class="bawnance-ca-label">CA</span><span class="bawnance-ca-value">' +
      (CONTRACT_ADDRESS || 'UPDATING SOON') + '</span>';

    var xLink = document.createElement('a');
    xLink.className = 'bawnance-x-link';
    xLink.href = X_URL;
    xLink.target = '_blank';
    xLink.rel = 'noopener noreferrer';
    xLink.setAttribute('aria-label', 'Follow Bawnance on X');
    xLink.title = 'Bawnance on X';
    xLink.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/></svg>';

    actions.appendChild(caBox);
    actions.appendChild(xLink);

    var walletButton = masthead.querySelector('button');
    masthead.insertBefore(actions, walletButton || null);
  }

  function scheduleInstall() {
    ensureFavicons();
    window.requestAnimationFrame(installTopActions);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInstall, { once: true });
  } else {
    scheduleInstall();
  }

  window.setTimeout(installTopActions, 800);
  new MutationObserver(scheduleInstall).observe(document.documentElement, { childList: true, subtree: true });
}());
