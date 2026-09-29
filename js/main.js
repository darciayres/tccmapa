// Veias do Recife — menu mobile (drawer)
// Espelha a interação já definida no Figma: tocar no ícone hambúrguer abre
// o menu (equivalente à sidebar do desktop); tocar no X, clicar fora ou
// apertar Esc fecha.

(function () {
  const menuBtn = document.querySelector('[data-menu-open]');
  const closeBtn = document.querySelector('[data-menu-close]');
  const scrim = document.querySelector('[data-menu-scrim]');

  if (!menuBtn) return;

  function openMenu() {
    document.body.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (scrim) scrim.addEventListener('click', closeMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();

// Mapa interativo
// Mouse: hover num pin destaca a foto da matéria correspondente.
// Touch: 1º toque seleciona o pin (etiqueta do Pin_Mobile + foto destacada),
//        2º toque no pin ou na etiqueta abre a matéria. Fotos seguem o mesmo padrão.
(function () {
  const pins = document.querySelectorAll('.pin[data-materia]');
  const strip = document.querySelector('.photos');
  const isTouch = () => window.matchMedia('(hover: none)').matches;
  let selected = null;

  const photoFor = (pin) =>
    document.querySelector('.photo-card[data-materia="' + pin.dataset.materia + '"]');

  function scrollStripTo(photo) {
    if (!strip || strip.scrollWidth <= strip.clientWidth) return;
    const delta =
      photo.getBoundingClientRect().left -
      strip.getBoundingClientRect().left -
      (strip.clientWidth - photo.offsetWidth) / 2;
    strip.scrollBy({ left: delta, behavior: 'smooth' });
  }

  // Empurra a etiqueta para dentro da tela quando o pin fica perto da borda
  function keepLabelOnScreen(label) {
    label.style.setProperty('--label-shift', '0px');
    const r = label.getBoundingClientRect();
    const margin = 8;
    let shift = 0;
    if (r.left < margin) shift = margin - r.left;
    else if (r.right > window.innerWidth - margin) shift = window.innerWidth - margin - r.right;
    label.style.setProperty('--label-shift', shift + 'px');
  }

  function deselect() {
    if (!selected) return;
    selected.classList.remove('is-selected');
    const photo = photoFor(selected);
    if (photo) photo.classList.remove('is-linked-hover');
    selected = null;
  }

  function select(pin) {
    deselect();
    selected = pin;
    pin.classList.add('is-selected');
    keepLabelOnScreen(pin.querySelector('.pin__label'));
    const photo = photoFor(pin);
    if (photo) {
      photo.classList.add('is-linked-hover');
      scrollStripTo(photo);
    }
  }

  pins.forEach((pin) => {
    const label = document.createElement('span');
    label.className = 'pin__label';
    const thumb = document.createElement('img');
    thumb.src = 'assets/images/materia-' + pin.dataset.materia + '.png';
    thumb.alt = '';
    const text = document.createElement('span');
    text.textContent = pin.title;
    label.append(thumb, text);
    pin.append(label);

    const photo = photoFor(pin);
    if (photo) {
      const on = () => { if (!isTouch()) photo.classList.add('is-linked-hover'); };
      const off = () => { if (!isTouch()) photo.classList.remove('is-linked-hover'); };
      pin.addEventListener('mouseenter', on);
      pin.addEventListener('mouseleave', off);
      pin.addEventListener('focus', on);
      pin.addEventListener('blur', off);
    }

    pin.addEventListener('click', (e) => {
      if (!isTouch() || pin === selected) return;
      e.preventDefault();
      clearActivePhoto();
      select(pin);
    });
  });

  // Touch nas fotos: 1º toque mostra o hover, 2º toque abre a matéria.
  // Uma foto já destacada (por ela mesma ou pelo pin) abre no 1º toque.
  let activePhoto = null;

  function clearActivePhoto() {
    if (!activePhoto) return;
    activePhoto.classList.remove('is-linked-hover');
    activePhoto = null;
  }

  document.querySelectorAll('.photo-card').forEach((photo) => {
    photo.addEventListener('click', (e) => {
      if (!isTouch() || photo.classList.contains('is-linked-hover')) return;
      e.preventDefault();
      deselect();
      clearActivePhoto();
      activePhoto = photo;
      photo.classList.add('is-linked-hover');
    });
  });

  document.addEventListener('click', (e) => {
    if (selected && !selected.contains(e.target)) deselect();
    if (activePhoto && !activePhoto.contains(e.target)) clearActivePhoto();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      deselect();
      clearActivePhoto();
    }
  });
})();
