const gallery = document.querySelector('#gallery');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let references = [];
let columnCount = getColumnCount();
let observer;

function getColumnCount() {
  return innerWidth <= 580 ? 2 : innerWidth <= 900 ? 3 : innerWidth >= 1700 ? 5 : 4;
}

function render() {
  observer?.disconnect();
  gallery.querySelectorAll('video').forEach(video => video.pause());
  gallery.replaceChildren();
  observer = new IntersectionObserver(entries => entries.forEach(entry => {
    const video = entry.target.querySelector('video');
    if (entry.isIntersecting && !reducedMotion.matches) {
      if (!video.src) video.src = video.dataset.src;
      video.play().catch(() => {});
    } else video.pause();
  }), {rootMargin:'150px'});

  const columns = Array.from({length:getColumnCount()}, () => {
    const element = document.createElement('div');
    element.className = 'column';
    gallery.append(element);
    return {element, height:0};
  });

  references.forEach((item, index) => {
    const figure = document.createElement('figure');
    figure.className = 'reference';
    figure.style.aspectRatio = `${item.width}/${item.height}`;
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.description;
    image.width = item.width;
    image.height = item.height;
    image.loading = index < 10 ? 'eager' : 'lazy';
    image.decoding = 'async';
    figure.append(image);

    if (item.video && !reducedMotion.matches) {
      const video = document.createElement('video');
      video.dataset.src = item.video;
      video.poster = item.image;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.setAttribute('aria-label',item.description);
      video.setAttribute('disablepictureinpicture','');
      video.setAttribute('disableremoteplayback','');
      figure.append(video);
      observer.observe(figure);
    }

    const column = columns.reduce((best, candidate) => candidate.height < best.height ? candidate : best);
    column.element.append(figure);
    column.height += item.height/item.width + .05;
  });
}

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (columnCount !== getColumnCount()) { columnCount = getColumnCount(); render(); }
  },150);
});
reducedMotion.addEventListener('change',render);
fetch('data.json').then(response => {
  if (!response.ok) throw new Error('Collection unavailable');
  return response.json();
}).then(data => { references = data; render(); }).catch(() => {
  const message = document.createElement('p');
  message.textContent = 'The images could not load. Please refresh the page.';
  gallery.replaceChildren(message);
});
