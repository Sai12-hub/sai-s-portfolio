(() => {
  const loader = document.querySelector('.loader');
  document.body.classList.add('loading');
  window.addEventListener('load', () => setTimeout(() => {
    loader.classList.add('done'); document.body.classList.remove('loading');
  }, 650));
  setTimeout(() => { loader.classList.add('done'); document.body.classList.remove('loading'); }, 2200);

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealEls.forEach(el => observer.observe(el));
  } else revealEls.forEach(el => el.classList.add('visible'));

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  toggle.addEventListener('click', () => {
    const opened = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(opened)); nav.classList.toggle('open', opened);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
  }));

  const sections = [...document.querySelectorAll('#services, #works, #certifications')];
  const navLinks = [...nav.querySelectorAll('a')];
  const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
    }
  }), { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach(section => sectionObserver.observe(section));

  const glow = document.querySelector('.cursor-glow');
  window.addEventListener('pointermove', event => {
    glow.style.left = event.clientX + 'px'; glow.style.top = event.clientY + 'px';
  }, { passive: true });
  document.querySelector('#year').textContent = new Date().getFullYear();

  document.querySelector('#contactForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.name.value.trim(), email = form.email.value.trim(), message = form.message.value.trim();
    const subject = encodeURIComponent('Portfolio enquiry from ' + name);
    const body = encodeURIComponent('Hi Sai Venkat,\n\n' + message + '\n\nFrom: ' + name + '\nEmail: ' + email);
    document.querySelector('#formNote').textContent = 'Opening your email app…';
    window.location.href = `mailto:gunisettysaivenkat@gmail.com?subject=${subject}&body=${body}`;
  });
})();

/* ---- Service galleries: arrow -> animated page with upload cards ---- */
(() => {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  const grid = document.getElementById('galleryGrid');
  const kicker = document.getElementById('galleryKicker');
  const title = document.getElementById('galleryTitle');
  const sub = document.getElementById('gallerySub');
  const rows = [...document.querySelectorAll('.service-row')];
  const store = new Map();
  let active = null, lastFocus = null, pendingUrl = null;

  const listFor = index => {
    if (!store.has(index)) store.set(index, []);
    return store.get(index);
  };

  const openGallery = (index, row) => {
    active = index;
    lastFocus = document.activeElement;
    kicker.textContent = row.querySelector('.service-num').textContent + ' / GALLERY';
    title.textContent = row.querySelector('h3').textContent;
    sub.textContent = row.querySelector('p').textContent;
    render({ stagger: true });
    gallery.classList.add('open');
    gallery.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gallery-open');
    gallery.querySelector('.gallery-close').focus({ preventScroll: true });
  };

  const closeGallery = () => {
    if (!gallery.classList.contains('open')) return;
    if (pendingUrl) { URL.revokeObjectURL(pendingUrl); pendingUrl = null; }
    grid.querySelectorAll('video').forEach(v => v.pause());
    gallery.classList.remove('open');
    gallery.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gallery-open');
    active = null;
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };

  rows.forEach((row, index) => {
    const arrow = row.querySelector('.service-arrow');
    if (arrow) arrow.addEventListener('click', () => openGallery(index, row));
  });
  gallery.querySelectorAll('[data-gallery-close]').forEach(el => el.addEventListener('click', closeGallery));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeGallery(); });

  function render(opts = {}) {
    if (active === null) return;
    const list = listFor(active);
    grid.textContent = '';
    list.forEach((item, i) => {
      const animate = !!opts.stagger || (!!opts.animateLast && i === list.length - 1);
      grid.appendChild(buildCard(item, i, animate));
    });
    grid.appendChild(buildAddTile(list.length, !!opts.stagger));
  }

  function buildCard(item, i, animate) {
    const card = document.createElement('article');
    card.className = 'g-card';
    card.style.setProperty('--i', i);
    const media = document.createElement('div');
    media.className = 'g-media';
    let node;
    if (item.kind === 'video') {
      node = document.createElement('video');
      node.src = item.url; node.controls = true; node.playsInline = true; node.preload = 'metadata';
    } else {
      node = document.createElement('img');
      node.src = item.url; node.alt = item.desc; node.loading = 'lazy';
    }
    media.appendChild(node);
    const tag = document.createElement('span');
    tag.className = 'g-type';
    tag.textContent = item.kind === 'video' ? 'VIDEO' : 'IMAGE';
    media.appendChild(tag);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'g-del';
    remove.setAttribute('aria-label', 'Remove this card');
    remove.textContent = '×';
    remove.addEventListener('click', () => removeCard(item, card));
    media.appendChild(remove);
    card.appendChild(media);
    const desc = document.createElement('p');
    desc.className = 'g-desc';
    desc.textContent = item.desc;
    card.appendChild(desc);
    const num = document.createElement('span');
    num.className = 'g-index';
    num.textContent = String(i + 1).padStart(2, '0');
    card.appendChild(num);
    if (animate) requestAnimationFrame(() => card.classList.add('in'));
    else card.classList.add('in');
    return card;
  }

  function removeCard(item, card) {
    card.classList.add('out');
    const list = listFor(active);
    window.setTimeout(() => {
      const at = list.indexOf(item);
      if (at > -1) list.splice(at, 1);
      if (item.url.indexOf('blob:') === 0) URL.revokeObjectURL(item.url);
      if (active !== null) render();
    }, 300);
  }

  function buildAddTile(i, animate) {
    const tile = document.createElement('div');
    tile.className = 'g-card g-add';
    tile.style.setProperty('--i', i);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.hidden = true;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'g-add-btn';
    trigger.innerHTML = '<span class="g-plus">+</span><span>Add a card</span><small>Image or video · short description</small>';
    trigger.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const kind = file.type.indexOf('video') === 0 ? 'video' : 'image';
      input.value = '';
      openComposer(tile, { kind, url: URL.createObjectURL(file) });
    });
    tile.append(trigger, input);
    if (animate) requestAnimationFrame(() => tile.classList.add('in'));
    else tile.classList.add('in');
    return tile;
  }

  function openComposer(tile, draft) {
    pendingUrl = draft.url;
    tile.classList.add('composing');
    const wrap = document.createElement('div');
    wrap.className = 'g-composer';
    const preview = document.createElement('div');
    preview.className = 'g-preview';
    let node;
    if (draft.kind === 'video') {
      node = document.createElement('video');
      node.src = draft.url; node.controls = true; node.playsInline = true;
    } else {
      node = document.createElement('img');
      node.src = draft.url; node.alt = 'Selected preview';
    }
    preview.appendChild(node);
    const label = document.createElement('label');
    label.className = 'g-label';
    label.textContent = 'Short description';
    const area = document.createElement('textarea');
    const areaId = 'gDesc' + Date.now();
    label.htmlFor = areaId;
    area.id = areaId;
    area.maxLength = 180;
    area.placeholder = 'A short note about this piece…';
    area.addEventListener('input', () => area.classList.remove('shake'));
    const actions = document.createElement('div');
    actions.className = 'g-actions';
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'g-save';
    save.textContent = 'Add to gallery';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'g-cancel';
    cancel.textContent = 'Cancel';
    save.addEventListener('click', () => {
      const desc = area.value.trim();
      if (!desc) {
        area.classList.remove('shake');
        void area.offsetWidth;
        area.classList.add('shake');
        area.focus();
        return;
      }
      pendingUrl = null;
      listFor(active).push({ kind: draft.kind, url: draft.url, desc });
      render({ animateLast: true });
    });
    cancel.addEventListener('click', () => {
      URL.revokeObjectURL(draft.url);
      pendingUrl = null;
      render();
    });
    actions.append(save, cancel);
    wrap.append(preview, label, area, actions);
    tile.appendChild(wrap);
    area.focus({ preventScroll: true });
  }

  window.addEventListener('pagehide', () => {
    store.forEach(list => list.forEach(item => {
      if (item.url.indexOf('blob:') === 0) URL.revokeObjectURL(item.url);
    }));
  });
})();

/* ---- Toolkit section: play the background video while it is on screen ---- */
(() => {
  const section = document.querySelector('.skill-section');
  if (!section) return;
  const video = section.querySelector('.skill-bg video');
  if (!video) return;

  const play = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };

  if (!('IntersectionObserver' in window)) { play(); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) play();
    else video.pause();
  }), { threshold: 0.2 });
  observer.observe(section);
})();
