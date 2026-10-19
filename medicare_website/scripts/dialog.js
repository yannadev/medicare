// Small, interruptible motion layer for the site's native dialogs.
window.createFluidDialog = function createFluidDialog(dialog, options = {}) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let animation = null;
  let returnFocus = null;

  function stopAnimation() {
    if (animation) animation.cancel();
    animation = null;
  }

  function restoreFocus() {
    const fallback = typeof options.fallbackFocus === 'function' ? options.fallbackFocus() : document.querySelector(options.fallbackFocus || 'main a');
    const target = returnFocus?.isConnected && !returnFocus.closest('[hidden]') ? returnFocus : fallback;
    target?.focus({ preventScroll: true });
  }

  function show(trigger = document.activeElement) {
    const wasOpen = dialog.open;
    if (!wasOpen) {
      returnFocus = trigger;
      dialog.showModal();
    }
    const style = getComputedStyle(dialog);
    const from = wasOpen ? { opacity: style.opacity, transform: style.transform } : { opacity: 0, transform: 'translateY(14px) scale(.97)' };
    stopAnimation();
    dialog.classList.remove('is-closing');
    if (!reducedMotion.matches) {
      animation = dialog.animate([from, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 330, easing: 'cubic-bezier(.22,1,.36,1)' });
      animation.finished.catch(() => {});
    }
    dialog.querySelector('.dialog-close')?.focus({ preventScroll: true });
  }

  function close() {
    if (!dialog.open) return;
    const style = getComputedStyle(dialog);
    const from = { opacity: style.opacity, transform: style.transform };
    stopAnimation();
    if (reducedMotion.matches) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    animation = dialog.animate([from, { opacity: 0, transform: 'translateY(12px) scale(.975)' }], { duration: 220, easing: 'cubic-bezier(.64,0,.78,0)', fill: 'forwards' });
    const closingAnimation = animation;
    closingAnimation.finished.then(() => { if (animation === closingAnimation && dialog.open) dialog.close(); }).catch(() => {});
  }

  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  dialog.addEventListener('close', () => { stopAnimation(); dialog.classList.remove('is-closing'); restoreFocus(); });
  return { show, close };
};
