// Títulos das matérias: fonte única para a barra lateral, o menu mobile,
// o texto do hover das fotos e os cards/tooltips dos pins.
// Quando uma matéria ganhar título, troque só aqui.
const MATERIA_TITLES = {
  1: 'Matéria 1',
  2: 'Matéria 2',
  3: 'O rio também é turismo.',
  4: 'Matéria 4',
  5: 'Matéria 5',
  6: 'Matéria 6',
};

document.querySelectorAll('.nav__item[href^="materia-"]').forEach((item) => {
  const n = item.getAttribute('href').match(/materia-(\d+)\.html/)[1];
  if (MATERIA_TITLES[n]) item.textContent = MATERIA_TITLES[n];
});

document.querySelectorAll('.photo-card[data-materia]').forEach((card) => {
  const title = MATERIA_TITLES[card.dataset.materia];
  if (!title) return;
  card.querySelector('.photo-card__title').textContent = title;
  card.querySelector('.photo-card__img').alt = title;
});

// Um texto que quebra linha ocupa toda a largura disponível; aqui a largura do
// título vira a da sua linha mais longa, para o ícone ficar encostado no texto.
function fitPhotoTitles() {
  document.querySelectorAll('.photo-card__title').forEach((title) => {
    title.style.width = '';
    const range = document.createRange();
    range.selectNodeContents(title);
    const widest = Math.max(0, ...Array.from(range.getClientRects(), (r) => r.width));
    if (widest) title.style.width = Math.ceil(widest) + 1 + 'px';
  });
}
fitPhotoTitles();
if (document.fonts) document.fonts.ready.then(fitPhotoTitles);
window.addEventListener('resize', fitPhotoTitles);

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

// Clicar no item da página atual não recarrega a página; no menu mobile, só fecha o menu
document.querySelectorAll('.nav__item.is-active').forEach((item) => {
  item.setAttribute('aria-current', 'page');
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.body.classList.remove('menu-open');
  });
});

// Componente do mapa: monta a imagem e os pins em todo <div class="map" data-map>.
// Para mudar a posição de um pin, edite left/top abaixo (em % do mapa, marcando a ponta do pin).
// Numa página de matéria, data-current="N" destaca o pin da matéria atual.
const MAP_PINS = [
  { materia: 1, left: 60.18, top: 38.76 },
  { materia: 2, left: 54.50, top: 25.08 },
  { materia: 3, left: 52.59, top: 37.46 },
  { materia: 4, left: 35.84, top: 67.52 },
  { materia: 5, left: 26.91, top: 81.57 },
  { materia: 6, left: 16.91, top: 81.57 },
];

document.querySelectorAll('.map[data-map]').forEach((map) => {
  const current = map.dataset.current;
  if (current) map.classList.add('map--article');
  const base = document.createElement('img');
  base.src = 'assets/images/map.png';
  base.alt = 'Mapa do Recife';
  map.append(base);

  MAP_PINS.forEach(({ materia, left, top }) => {
    const pin = document.createElement('a');
    pin.className = 'pin';
    pin.href = 'materia-' + materia + '.html';
    pin.title = MATERIA_TITLES[materia] || 'Matéria ' + materia;
    pin.dataset.materia = materia;
    pin.style.left = left + '%';
    pin.style.top = top + '%';
    if (String(materia) === current) {
      pin.classList.add('is-current');
      pin.setAttribute('aria-current', 'page');
      pin.innerHTML = '<img class="pin__current" src="assets/icons/pin-current.svg" alt="">';
    } else {
      pin.innerHTML =
        '<img class="pin__default" src="assets/icons/pin-default.svg" alt="">' +
        '<img class="pin__hover" src="assets/icons/pin-hover.svg" alt="">';
    }
    map.append(pin);
  });
});

// Mapa interativo
// Mouse: hover num pin destaca a foto da matéria correspondente, e vice-versa.
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

    if (pin.closest('.map--article')) {
      pin.addEventListener('mouseenter', () => { if (!isTouch()) keepLabelOnScreen(label); });
    }

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
      if (pin.classList.contains('is-current')) {
        e.preventDefault();
        return;
      }
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
    const pin = document.querySelector('.pin[data-materia="' + photo.dataset.materia + '"]');
    if (pin) {
      const on = () => { if (!isTouch()) pin.classList.add('is-linked-hover'); };
      const off = () => { if (!isTouch()) pin.classList.remove('is-linked-hover'); };
      photo.addEventListener('mouseenter', on);
      photo.addEventListener('mouseleave', off);
      photo.addEventListener('focus', on);
      photo.addEventListener('blur', off);
    }

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
