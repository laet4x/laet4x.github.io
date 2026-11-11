const menu = document.querySelector('.menu');
const navigation = document.querySelector('nav');
function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
}
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') === 'false'));
navigation.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    setMenu(false);
    menu.focus();
  }
});
const localLinks = Array.from(navigation.querySelectorAll('a[href^="#"]'));
const visibleSections = localLinks.map(link => document.querySelector(link.hash));
function updateSection() {
  const active = visibleSections.find(section => {
    const box = section.getBoundingClientRect();
    return box.top <= 150 && box.bottom > 150;
  });
  for (const link of localLinks) {
    if (active && link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
if (localLinks.length) {
  updateSection();
  window.addEventListener('scroll', updateSection, {passive:true});
}
