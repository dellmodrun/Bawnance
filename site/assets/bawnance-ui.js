(function () {
  'use strict';

  var CONTRACT_ADDRESS = '';
  var X_URL = 'https://x.com/bawnancefun';
  var walletAddress = '';
  var walletListenersInstalled = false;
  var FAQ_ANSWERS = {
    'Do I actually own the asset?': 'You own shares recorded on this site against your wallet address, plus a Solana transaction as the receipt. These are not NFTs and they carry no claim on anything in the real world — this is a fan-made game built on Vice City.',
    'What happens when a supply sells out?': 'The exchange stops issuing it. After that the only way in is a listing from somebody who already holds shares, at whatever price they choose.',
    'Why do prices show in dollars if I pay in SOL?': 'So you can read a price without doing maths. The dollar figure is the live SOL rate applied to the SOL price, refreshed every minute. The amount you actually approve in your wallet is always SOL.',
    'Can I lose money?': 'Yes. Prices only move when people trade, so if nobody buys after you, your shares sit there at the price the last buyer paid. There is no buyback from the exchange — you exit by selling to another player.',
    'Are payments reversible?': 'No. SOL sent on mainnet is final the moment it confirms. If a payment lands but the trade fails, keep the transaction receipt so the payment can be traced.'
  };

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

  function installFaq() {
    if (window.location.pathname.indexOf('/Bawnance/how-it-works') !== 0) return;

    document.querySelectorAll('button[data-radix-collection-item]').forEach(function (button) {
      if (button.dataset.bawnanceFaq === 'ready') return;
      var question = button.textContent.trim();
      var answer = FAQ_ANSWERS[question];
      var item = button.closest('div[data-state]');
      var region = item && item.querySelector('[role="region"]');
      if (!answer || !region) return;

      region.innerHTML = '<div class="pb-4 leading-relaxed text-muted-foreground">' + answer + '</div>';
      button.dataset.bawnanceFaq = 'ready';
      button.addEventListener('click', function () {
        var opening = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(opening));
        button.setAttribute('data-state', opening ? 'open' : 'closed');
        item.setAttribute('data-state', opening ? 'open' : 'closed');
        var heading = button.parentElement;
        if (heading) heading.setAttribute('data-state', opening ? 'open' : 'closed');
        region.setAttribute('data-state', opening ? 'open' : 'closed');
        region.hidden = !opening;
      });
    });
  }

  function getWalletProvider() {
    return (window.phantom && window.phantom.solana) || window.solflare || window.solana || null;
  }

  function shortAddress(address) {
    return address.slice(0, 4) + '…' + address.slice(-4);
  }

  function setWalletButtons(label, connected) {
    document.querySelectorAll('[data-bawnance-wallet]').forEach(function (button) {
      var isHeaderButton = !!button.closest('header');
      var nextLabel = connected ? (isHeaderButton ? shortAddress(label) : 'Wallet connected') : 'Connect wallet';
      if (button.textContent !== nextLabel) button.textContent = nextLabel;
      button.title = connected && isHeaderButton ? 'Disconnect wallet' : 'Connect a Solana wallet';
      button.setAttribute('aria-label', button.title);
    });
  }

  async function connectWallet(button) {
    var provider = getWalletProvider();
    if (!provider || typeof provider.connect !== 'function') {
      window.open('https://phantom.app/', '_blank', 'noopener,noreferrer');
      button.textContent = 'Install Phantom';
      window.setTimeout(function () { if (!walletAddress) button.textContent = 'Connect wallet'; }, 1800);
      return;
    }

    button.disabled = true;
    button.textContent = 'Connecting…';
    try {
      var response = await provider.connect();
      var publicKey = (response && response.publicKey) || provider.publicKey;
      walletAddress = publicKey && publicKey.toString ? publicKey.toString() : String(publicKey || '');
      if (!walletAddress) throw new Error('Wallet did not return an address');
      setWalletButtons(walletAddress, true);
    } catch (error) {
      button.textContent = 'Connection cancelled';
      button.title = error && error.message ? error.message : 'Wallet connection failed';
      window.setTimeout(function () { if (!walletAddress) button.textContent = 'Connect wallet'; }, 1800);
    } finally {
      button.disabled = false;
    }
  }

  async function disconnectWallet() {
    var provider = getWalletProvider();
    try {
      if (provider && typeof provider.disconnect === 'function') await provider.disconnect();
    } catch {}
    walletAddress = '';
    setWalletButtons('', false);
  }

  function installWalletButtons() {
    document.querySelectorAll('button').forEach(function (button) {
      if (button.dataset.bawnanceWallet === 'ready' || !/^Connect wallet/i.test(button.textContent.trim())) return;
      button.dataset.bawnanceWallet = 'ready';
      button.addEventListener('click', function () {
        if (walletAddress && button.closest('header')) disconnectWallet();
        else if (!walletAddress) connectWallet(button);
      });
    });

    var provider = getWalletProvider();
    if (provider && !walletListenersInstalled) {
      walletListenersInstalled = true;
      if (typeof provider.on === 'function') {
        provider.on('accountChanged', function (publicKey) {
          walletAddress = publicKey && publicKey.toString ? publicKey.toString() : '';
          setWalletButtons(walletAddress, !!walletAddress);
        });
        provider.on('disconnect', function () {
          walletAddress = '';
          setWalletButtons('', false);
        });
      }
      if (typeof provider.connect === 'function') {
        provider.connect({ onlyIfTrusted: true }).then(function (response) {
          var publicKey = (response && response.publicKey) || provider.publicKey;
          walletAddress = publicKey && publicKey.toString ? publicKey.toString() : '';
          if (walletAddress) setWalletButtons(walletAddress, true);
        }).catch(function () {});
      }
    }
  }

  function scheduleInstall() {
    ensureFavicons();
    window.requestAnimationFrame(installTopActions);
    window.requestAnimationFrame(installFaq);
    window.requestAnimationFrame(installWalletButtons);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInstall, { once: true });
  } else {
    scheduleInstall();
  }

  window.setTimeout(installTopActions, 800);
  window.setTimeout(installWalletButtons, 800);
  new MutationObserver(scheduleInstall).observe(document.documentElement, { childList: true, subtree: true });
}());
