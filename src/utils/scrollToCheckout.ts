export function scrollToCheckout(): void {
  window.setTimeout(() => {
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;

    const announcementBar = document.querySelector<HTMLElement>('.sticky.top-0');
    const stickyOffset = announcementBar?.getBoundingClientRect().height ?? 0;
    const formTop = checkoutForm.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: Math.max(0, formTop - stickyOffset - 12),
      behavior: 'smooth',
    });
  }, 100);
}
