(() => {
  const message = '这是本地只读演示版：未连接 Solana，钱包、购买、出售和真实付款均已停用。';
  const show = () => {
    document.querySelector('.local-demo-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'local-demo-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
  };
  document.addEventListener('click', (event) => {
    const control = event.target.closest('button, [role="button"]');
    if (!control) return;
    const label = (control.textContent || '').toLowerCase();
    if (/wallet|connect|buy|sell|list|purchase/.test(label)) {
      event.preventDefault();
      event.stopPropagation();
      show();
    }
  }, true);
})();
