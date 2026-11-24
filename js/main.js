// Títulos das matérias: fonte única para a barra lateral, o menu mobile,
// o texto do hover das fotos e os cards/tooltips dos pins.
// Quando uma matéria ganhar título, troque só aqui.
const MATERIA_TITLES = {
  2: 'Olhar para um Recife ancestral',
  3: 'O rio também é turismo',
  4: 'Saindo do óbvio: histórias de quem trabalha com o turismo',
  5: 'Por trás dos museus do Recife Antigo',
  6: 'O que a gestão pública faz pelos trabalhadores de turismo?',
};

// Foto do card de cada matéria na página inicial (enquadramento feito no Figma,
// na instância "Card Matéria N (página inicial)"). Também é a miniatura do card
// dos pins quando a matéria não tem uma própria. Quando uma matéria ganhar foto,
// troque só aqui.
const MATERIA_PHOTOS = {
  2: 'assets/images/materia-2-card.jpg',
  3: 'assets/images/materia-3-card.jpg',
  4: 'assets/images/materia-4-card.jpg',
  5: 'assets/images/materia-5-card.jpg',
  6: 'assets/images/materia-6-card.jpg',
};

// Miniatura do card dos pins, quando tiver um enquadramento próprio (feito no
// Figma, na instância "Pin Matéria N (card)"). Sem entrada aqui, usa a foto principal.
const MATERIA_PIN_THUMBS = {
  2: 'assets/images/materia-2-pin.jpg',
  3: 'assets/images/materia-3-pin.jpg',
  4: 'assets/images/materia-4-pin.jpg',
  5: 'assets/images/materia-5-pin-terra.jpg',
  6: 'assets/images/materia-6-pin.jpg',
};

document.querySelectorAll('.nav__item[href^="materia-"]').forEach((item) => {
  const n = item.getAttribute('href').match(/materia-(\d+)\.html/)[1];
  if (MATERIA_TITLES[n]) item.textContent = MATERIA_TITLES[n];
});

document.querySelectorAll('.photo-card[data-materia]').forEach((card) => {
  const n = card.dataset.materia;
  const img = card.querySelector('.photo-card__img');
  if (MATERIA_PHOTOS[n]) img.src = MATERIA_PHOTOS[n];
  if (MATERIA_TITLES[n]) {
    card.querySelector('.photo-card__title').textContent = MATERIA_TITLES[n];
    img.alt = MATERIA_TITLES[n];
  }
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

// Componente do mapa: monta o mapa e os pins em todo <div class="map" data-map="...">.
// Numa página de matéria, data-current="N" destaca o pin da matéria atual.
//
// Mapa interativo (MapLibre + OpenFreeMap). Cada ponto é um LOCAL real, com as
// matérias que falam dele. Cada matéria vira um pin com o seu card; quando o
// local tem mais de uma, os pins ficam lado a lado. Uma matéria pode aparecer
// em mais de um local.
// Coordenadas enviadas em graus/minutos/segundos e convertidas para decimal.
const MAP_POINTS = [
  { nome: 'Marco Zero', materias: [4], lat: -8.063167, lng: -34.871139 },
  { nome: 'Capibaribe Tour', materias: [3], lat: -8.063357, lng: -34.87064 },
  { nome: 'Paço do Frevo', materias: [5], lat: -8.0615, lng: -34.871583, fotos: { 5: 'assets/images/materia-5-pin-terra.jpg' } },
  { nome: 'Frio na Goela', materias: [4], lat: -8.063056, lng: -34.872306 },
  { nome: 'Centro de Atendimento ao Turista', materias: [6], lat: -8.061083, lng: -34.871722 },
  { nome: 'Cais do Sertão', materias: [5], lat: -8.060306, lng: -34.87, fotos: { 5: 'assets/images/materia-5-pin-rio.jpg' } },
  { nome: 'Matéria 2', materias: [2], lat: -8.061389, lng: -34.871056 },
];

// Até onde o mapa pode ser arrastado: MAP_MARGIN_KM além dos pins mais distantes,
// em cada direção (recalcula sozinho quando os pins mudam)
const MAP_MARGIN_KM = 1.2;
const MAP_BOUNDS = (() => {
  const lats = MAP_POINTS.map((p) => p.lat);
  const lngs = MAP_POINTS.map((p) => p.lng);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const dLat = MAP_MARGIN_KM / 110.574;
  const dLng = MAP_MARGIN_KM / (111.32 * Math.cos((midLat * Math.PI) / 180));
  return [
    [Math.min(...lngs) - dLng, Math.min(...lats) - dLat], // oeste, sul
    [Math.max(...lngs) + dLng, Math.max(...lats) + dLat], // leste, norte
  ];
})();

// Cores da paleta aplicadas por cima do estilo "positron" do OpenFreeMap.
// Para um estilo totalmente próprio, troque MAP_STYLE pelo arquivo exportado do Maputnik.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
function applyPalette(map) {
  const css = getComputedStyle(document.documentElement);
  const c = (name) => css.getPropertyValue(name).trim();
  const set = (id, prop, value) => { if (map.getLayer(id)) map.setPaintProperty(id, prop, value); };
  set('background', 'background-color', c('--fundo'));
  // Mar e rio continuam azuis (cores da paleta antiga), mesmo com o site vermelho
  set('water', 'fill-color', '#4384d3');
  set('water', 'fill-opacity', 0.45);
  set('waterway', 'line-color', '#4384d3');
  for (const layer of map.getStyle().layers) {
    if (layer.type === 'symbol' && !/^water/.test(layer.id)) set(layer.id, 'text-color', c('--preto'));
    if (layer.type === 'symbol' && /^water/.test(layer.id)) set(layer.id, 'text-color', '#2869b9');
  }
}

const tituloDa = (n) => MATERIA_TITLES[n] || 'Matéria ' + n;

// Distância (px) entre pins do mesmo local: um ao lado do outro, centrados no ponto
const PIN_LADO_A_LADO = 34;
const deslocamento = (i, total) => (i - (total - 1) / 2) * PIN_LADO_A_LADO;

function buildPin(materia, current) {
  const pin = document.createElement('a');
  pin.className = 'pin';
  pin.href = 'materia-' + materia + '.html';
  pin.title = tituloDa(materia);
  pin.dataset.materias = String(materia);
  if (String(materia) === current) {
    pin.classList.add('is-current');
    pin.setAttribute('aria-current', 'page');
    pin.innerHTML = '<svg class="icone-svg pin__current" aria-hidden="true" focusable="false"><use href="#ic-pin-current"/></svg>';
  } else {
    pin.innerHTML =
      '<svg class="icone-svg pin__default" aria-hidden="true" focusable="false"><use href="#ic-pin-default"/></svg>' +
      '<svg class="icone-svg pin__hover" aria-hidden="true" focusable="false"><use href="#ic-pin-hover"/></svg>';
  }
  return pin;
}

function buildInteractiveMap(container, current) {
  container.classList.add('map--live');
  const isTouch = window.matchMedia('(hover: none)').matches;
  const map = new maplibregl.Map({
    container,
    style: MAP_STYLE,
    bounds: MAP_POINTS.reduce((b, p) => b.extend([p.lng, p.lat]), new maplibregl.LngLatBounds()),
    fitBoundsOptions: { padding: { top: 80, bottom: 40, left: 40, right: 40 } },
    maxBounds: MAP_BOUNDS,
    scrollZoom: false,
    // Touch: 1 dedo arrasta o mapa; fora dele a página rola normalmente
    cooperativeGestures: false,
    dragRotate: false,
    pitchWithRotate: false,
    // Crédito obrigatório: no touch fica recolhido no "i"; com mouse, sempre visível e sem botão
    attributionControl: { compact: isTouch },
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.on('style.load', () => applyPalette(map));
  // O crédito do mapa (obrigatório) começa recolhido no ícone "i"
  map.on('load', () => {
    const attrib = container.querySelector('.maplibregl-ctrl-attrib');
    if (attrib) attrib.classList.remove('maplibregl-compact-show');
  });
  window.addEventListener('resize', () => map.resize());

  MAP_POINTS.forEach(({ materias, lat, lng, fotos }) => {
    materias.forEach((materia, i) => {
      const pin = buildPin(materia, current);
      // Foto própria deste local (ex.: matéria 5 tem um pin no Paço e outro no Cais)
      if (fotos && fotos[materia]) pin.dataset.thumb = fotos[materia];
      new maplibregl.Marker({
        element: pin,
        anchor: 'bottom',
        offset: [deslocamento(i, materias.length), 0],
      })
        .setLngLat([lng, lat])
        .addTo(map);
    });
  });
}

// Reserva: sem internet ou sem a biblioteca, volta para a imagem estática
// (posições aproximadas, em % da imagem)
const MAPS = {
  // Mapa horizontal: página inicial no mobile e fim das matérias
  padrao: {
    image: 'assets/images/map.png',
    pins: [
      { materias: [2], left: 54.50, top: 25.08 },
      { materias: [4], left: 52.59, top: 37.46 },
      { materias: [3], left: 55.20, top: 39.50 },
      { materias: [4], left: 35.84, top: 67.52 },
      { materias: [5], left: 26.91, top: 81.57 },
      { materias: [6], left: 16.91, top: 81.57 },
    ],
  },
  // Mapa vertical da coluna da direita (página inicial no desktop)
  coluna: {
    image: 'assets/images/mapa-coluna.png',
    pins: [
      { materias: [2], left: 55.68, top: 73.90 },
      { materias: [4], left: 87.91, top: 48.79 },
      { materias: [3], left: 92.00, top: 50.50 },
      { materias: [4], left: 19.41, top: 52.41 },
      { materias: [5], left: 66.30, top: 32.13 },
      { materias: [6], left: 67.03, top: 57.24 },
    ],
  },
};

document.querySelectorAll('.map[data-map]').forEach((map) => {
  const current = map.dataset.current;
  if (current) map.classList.add('map--article');
  if (window.maplibregl) {
    buildInteractiveMap(map, current);
    return;
  }
  const config = MAPS[map.dataset.map] || MAPS.padrao;
  const base = document.createElement('img');
  base.src = config.image;
  base.alt = 'Mapa do Recife';
  map.append(base);

  config.pins.forEach(({ materias, left, top }) => {
    materias.forEach((materia, i) => {
      const pin = buildPin(materia, current);
      pin.style.left = 'calc(' + left + '% + ' + deslocamento(i, materias.length) + 'px)';
      pin.style.top = top + '%';
      map.append(pin);
    });
  });
});

// Mapa interativo
// Mouse: hover num pin destaca a foto da matéria correspondente, e vice-versa.
// Touch: 1º toque seleciona o pin (etiqueta do Pin_Mobile + foto destacada),
//        2º toque no pin ou na etiqueta abre a matéria. Fotos seguem o mesmo padrão.
(function () {
  const pins = document.querySelectorAll('.pin[data-materias]');
  const strip = document.querySelector('.photos');
  const isTouch = () => window.matchMedia('(hover: none)').matches;
  let selected = null;

  const materiasDo = (pin) => pin.dataset.materias.split(' ');
  const photosFor = (pin) =>
    materiasDo(pin)
      .map((n) => document.querySelector('.photo-card[data-materia="' + n + '"]'))
      .filter(Boolean);

  function scrollStripTo(photo) {
    if (!strip || strip.scrollWidth <= strip.clientWidth) return;
    const delta =
      photo.getBoundingClientRect().left -
      strip.getBoundingClientRect().left -
      (strip.clientWidth - photo.offsetWidth) / 2;
    strip.scrollBy({ left: delta, behavior: 'smooth' });
  }

  // Empurra a etiqueta para dentro da tela quando o pin fica perto da borda
  // Mantém o card dentro do mapa (e da tela). A conta usa a posição do PIN, que
  // não se mexe, e não a do card: o card tem animação de entrada, então medir o
  // próprio card no meio do movimento dava resultados errados de vez em quando.
  function keepLabelOnScreen(label) {
    const pin = label.parentElement;
    const p = pin.getBoundingClientRect();
    const box = label.closest('.map').getBoundingClientRect();
    const margin = 8;
    const w = label.offsetWidth;
    const h = label.offsetHeight;

    // Horizontal: o card nasce centrado no pin
    const minX = Math.max(0, box.left) + margin;
    const maxX = Math.min(window.innerWidth, box.right) - margin;
    const left = p.left + p.width / 2 - w / 2;
    let shift = 0;
    if (left < minX) shift = minX - left;
    else if (left + w > maxX) shift = maxX - (left + w);
    label.style.setProperty('--label-shift', shift + 'px');

    // Vertical: se não couber acima do pin, abre embaixo dele
    const minY = Math.max(0, box.top) + margin;
    const cabeAcima = p.top - 8 - h >= minY;
    label.classList.toggle('pin__label--abaixo', !cabeAcima);
  }


  function deselect() {
    if (!selected) return;
    selected.classList.remove('is-selected');
    photosFor(selected).forEach((photo) => photo.classList.remove('is-linked-hover'));
    selected = null;
  }

  function select(pin) {
    deselect();
    selected = pin;
    pin.classList.add('is-selected');
    keepLabelOnScreen(pin.querySelector('.pin__label'));
    const photos = photosFor(pin);
    photos.forEach((photo) => photo.classList.add('is-linked-hover'));
    if (photos[0]) scrollStripTo(photos[0]);
  }

  pins.forEach((pin) => {
    // Card da matéria do pin (o pin inteiro é o link)
    const label = document.createElement('span');
    label.className = 'pin__label';
    materiasDo(pin).forEach((n) => {
      const card = document.createElement('span');
      card.className = 'pin__card';
      const thumb = document.createElement('img');
      thumb.src = pin.dataset.thumb || MATERIA_PIN_THUMBS[n] || MATERIA_PHOTOS[n];
      thumb.alt = '';
      const text = document.createElement('span');
      text.textContent = tituloDa(n);
      card.append(thumb, text);
      label.append(card);
    });
    pin.append(label);

    if (pin.closest('.map--article, .map--coluna')) {
      const ajustar = () => { if (!isTouch()) keepLabelOnScreen(label); };
      pin.addEventListener('mouseenter', ajustar);
      pin.addEventListener('focus', ajustar);
    }

    const photos = photosFor(pin);
    if (photos.length) {
      const on = () => { if (!isTouch()) photos.forEach((p) => p.classList.add('is-linked-hover')); };
      const off = () => { if (!isTouch()) photos.forEach((p) => p.classList.remove('is-linked-hover')); };
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
    // Uma matéria pode estar em mais de um local: acende todos os pins dela
    const linkedPins = document.querySelectorAll('.pin[data-materias~="' + photo.dataset.materia + '"]');
    if (linkedPins.length) {
      const on = () => { if (!isTouch()) linkedPins.forEach((pin) => pin.classList.add('is-linked-hover')); };
      const off = () => { if (!isTouch()) linkedPins.forEach((pin) => pin.classList.remove('is-linked-hover')); };
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

/* ---------- Trecho com foto (componente "hover_texto") ----------
   Mouse: a foto aparece no hover. Touch: um toque abre, outro toque
   (no trecho ou fora dele) fecha. Teclado: Tab foca e mostra a foto. */
(function () {
  const trechos = document.querySelectorAll('.hover-foto[data-foto]');
  if (!trechos.length) return;
  const isTouch = () => window.matchMedia('(hover: none)').matches;
  const GUTTER = 8;

  // Mantém a foto dentro da tela quando o trecho está perto da borda
  const fit = (el, box) => {
    el.style.setProperty('--foto-shift', '0px');
    const r = box.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    let shift = 0;
    if (r.left < GUTTER) shift = GUTTER - r.left;
    else if (r.right > vw - GUTTER) shift = vw - GUTTER - r.right;
    el.style.setProperty('--foto-shift', shift + 'px');
  };

  let aberto = null;
  const abrir = (el, box) => {
    if (aberto && aberto !== el) aberto.classList.remove('is-open');
    fit(el, box);
    el.classList.add('is-open');
    aberto = el;
  };
  const fechar = (el) => {
    el.classList.remove('is-open');
    if (aberto === el) aberto = null;
  };

  trechos.forEach((el) => {
    const rotulo = el.textContent.trim();
    const box = document.createElement('span');
    box.className = 'hover-foto__img';
    box.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.src = el.dataset.foto;
    img.alt = '';
    box.appendChild(img);
    if (el.dataset.credito) {
      const cred = document.createElement('span');
      cred.className = 'hover-foto__credito';
      cred.textContent = el.dataset.credito;
      box.appendChild(cred);
    }
    el.appendChild(box);
    el.tabIndex = 0;
    if (el.dataset.alt) el.setAttribute('aria-label', rotulo + ' (foto: ' + el.dataset.alt + ')');

    el.addEventListener('mouseenter', () => { if (!isTouch()) abrir(el, box); });
    el.addEventListener('mouseleave', () => { if (!isTouch()) fechar(el); });
    el.addEventListener('focus', () => { if (!isTouch()) abrir(el, box); });
    el.addEventListener('blur', () => fechar(el));
    el.addEventListener('click', (e) => {
      if (!isTouch()) return;
      e.stopPropagation();
      if (el.classList.contains('is-open')) { fechar(el); el.blur(); }
      else abrir(el, box);
    });
  });

  document.addEventListener('click', () => { if (aberto && isTouch()) { aberto.blur(); fechar(aberto); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && aberto) aberto.blur(); });
  window.addEventListener('scroll', () => { if (aberto && isTouch()) { aberto.blur(); fechar(aberto); } }, { passive: true });
})();

/* ---------- Cartão de visitas: inclina seguindo o mouse ----------
   Só com mouse (no touch o cartão fica parado). */
(function () {
  const cartoes = document.querySelectorAll('[data-cartao]');
  if (!cartoes.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const MAX = 3; // inclinação máxima em graus

  cartoes.forEach((cartao) => {
    const corpo = cartao.querySelector('.cartao__corpo');
    cartao.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = corpo.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;  // 0 a 1
      const y = (e.clientY - r.top) / r.height;  // 0 a 1
      cartao.classList.add('is-ativo');
      corpo.style.setProperty('--ry', ((x - 0.5) * 2 * MAX).toFixed(2) + 'deg');
      corpo.style.setProperty('--rx', ((0.5 - y) * 2 * MAX).toFixed(2) + 'deg');
      corpo.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      corpo.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    cartao.addEventListener('pointerleave', () => {
      cartao.classList.remove('is-ativo');
      corpo.style.setProperty('--rx', '0deg');
      corpo.style.setProperty('--ry', '0deg');
    });
  });
})();

// Dados animados (fotógrafos na matéria 4, barqueiros na matéria 3): quando o
// bloco aparece na tela, os ícones entram um a um e o número conta junto até o total.
(() => {
  const blocos = document.querySelectorAll('[data-dado]');
  if (!blocos.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const PASSO = 55; // ms entre um ícone e o próximo

  blocos.forEach((bloco) => {
    const pessoas = bloco.querySelectorAll('.dado__pessoa');
    const numero = bloco.querySelector('[data-dado-numero]');
    const total = Number(numero.dataset.dadoNumero);
    bloco.classList.add('is-esperando');
    numero.textContent = '0';

    const obs = new IntersectionObserver((entradas) => {
      if (!entradas[0].isIntersecting) return;
      obs.disconnect();
      pessoas.forEach((p, i) => { p.style.transitionDelay = `${i * PASSO}ms`; });
      bloco.classList.remove('is-esperando');

      const duracao = pessoas.length * PASSO + 300;
      const inicio = performance.now();
      const contar = (agora) => {
        const t = Math.min((agora - inicio) / duracao, 1);
        numero.textContent = String(Math.round(t * total));
        if (t < 1) requestAnimationFrame(contar);
      };
      requestAnimationFrame(contar);
    }, { threshold: 0.6 });
    obs.observe(bloco);
  });
})();

// Infográfico da matéria 6: quando aparece na tela, os círculos entram um a um,
// os números contam até o valor e a pizza enche até 57%.
(() => {
  const blocos = document.querySelectorAll('[data-info]');
  if (!blocos.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  // [início em ms, duração em ms] de cada número, na ordem em que aparecem
  const TEMPOS = [[0, 900], [350, 800], [1650, 900]];
  const suave = (t) => 1 - Math.pow(1 - t, 3);

  blocos.forEach((bloco) => {
    const nums = [...bloco.querySelectorAll('[data-info-num]')];
    const pizza = bloco.querySelector('.info6__circulo--pizza');
    nums.forEach((n) => { n.textContent = '0'; });
    if (pizza) pizza.style.setProperty('--p', '0');
    bloco.classList.add('is-esperando');

    const obs = new IntersectionObserver((entradas) => {
      if (!entradas[0].isIntersecting) return;
      obs.disconnect();
      bloco.classList.remove('is-esperando');
      const inicio = performance.now();
      const passo = (agora) => {
        let fim = true;
        nums.forEach((n, i) => {
          const [ini, dur] = TEMPOS[i] || [0, 900];
          const t = Math.min(Math.max((agora - inicio - ini) / dur, 0), 1);
          const v = Math.round(suave(t) * Number(n.dataset.infoNum));
          n.textContent = String(v);
          if (pizza && pizza.contains(n)) pizza.style.setProperty('--p', String(suave(t) * Number(n.dataset.infoNum)));
          if (t < 1) fim = false;
        });
        if (!fim) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }, { threshold: 0.5 });
    obs.observe(bloco);
  });
})();

// Dado do Olha!Recife (matéria 6): guias entram um a um, números contam
// (cada um com seu início e duração em data-olha-ini/-dur) e o barco chega navegando.
(() => {
  const blocos = document.querySelectorAll('[data-olha]');
  if (!blocos.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  const PASSO = 55; // ms entre um guia e o próximo
  const suave = (t) => 1 - Math.pow(1 - t, 3);
  const fmt = (v) => v.toLocaleString('pt-BR');

  blocos.forEach((bloco) => {
    const pessoas = bloco.querySelectorAll('.olha__pessoa');
    const nums = [...bloco.querySelectorAll('[data-olha-num]')];
    nums.forEach((n) => { n.textContent = '0'; });
    bloco.classList.add('is-esperando');

    const obs = new IntersectionObserver((entradas) => {
      if (!entradas[0].isIntersecting) return;
      obs.disconnect();
      pessoas.forEach((p, i) => { p.style.transitionDelay = (i * PASSO) + 'ms'; });
      bloco.classList.remove('is-esperando');
      const inicio = performance.now();
      const passo = (agora) => {
        let fim = true;
        nums.forEach((n) => {
          const ini = Number(n.dataset.olhaIni || 0), dur = Number(n.dataset.olhaDur || 900);
          const t = Math.min(Math.max((agora - inicio - ini) / dur, 0), 1);
          n.textContent = fmt(Math.round(suave(t) * Number(n.dataset.olhaNum)));
          if (t < 1) fim = false;
        });
        if (!fim) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }, { threshold: 0.5 });
    obs.observe(bloco);
  });
})();
