
  let currentGallery = [];
  let currentIdx = 0;
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCounter = document.getElementById('lbCounter');

  document.querySelectorAll('.venue-gallery').forEach(gallery => {
    const photos = Array.from(gallery.querySelectorAll('.photo'));
    photos.forEach((photo, idx) => {
      photo.addEventListener('click', () => {
        currentGallery = photos.map(p => ({ src: p.dataset.src, caption: p.dataset.caption || '' }));
        currentIdx = idx;
        openLightbox();
      });
    });
  });

  function openLightbox() {
    const item = currentGallery[currentIdx];
    lbImg.src = item.src;
    lbImg.alt = item.caption;
    lbCounter.textContent = (currentIdx + 1) + ' of ' + currentGallery.length + ' — ' + item.caption;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  function nextImg() { currentIdx = (currentIdx + 1) % currentGallery.length; openLightbox(); }
  function prevImg() { currentIdx = (currentIdx - 1 + currentGallery.length) % currentGallery.length; openLightbox(); }
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbNext').addEventListener('click', nextImg);
  document.getElementById('lbPrev').addEventListener('click', prevImg);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImg();
    if (e.key === 'ArrowLeft') prevImg();
  });

  let srcLang = 'en', dstLang = 'pt';
  const srcText = document.getElementById('srcText');
  const dstText = document.getElementById('dstText');
  const srcLabel = document.getElementById('srcLabel');
  const dstLabel = document.getElementById('dstLabel');
  const dirFrom = document.getElementById('dirFrom');
  const dirTo = document.getElementById('dirTo');

  const langName = (c) => c === 'en' ? 'English' : 'Português';

  function updateLabels() {
    srcLabel.textContent = langName(srcLang);
    dstLabel.textContent = langName(dstLang);
    dirFrom.textContent = langName(srcLang);
    dirTo.textContent = langName(dstLang);
    srcText.placeholder = srcLang === 'en' ? "Type your phrase here..." : "Escreva a sua frase aqui...";
  }

  document.getElementById('swapBtn').addEventListener('click', () => {
    [srcLang, dstLang] = [dstLang, srcLang];
    updateLabels();
    const oldSrc = srcText.value;
    const oldDst = dstText.classList.contains('empty') ? '' : dstText.textContent;
    srcText.value = oldDst;
    if (oldSrc) { dstText.textContent = oldSrc; dstText.classList.remove('empty'); }
    else { dstText.textContent = "Your translation will appear here."; dstText.classList.add('empty'); }
  });

  async function translate() {
    const text = srcText.value.trim();
    if (!text) { dstText.textContent = "Type something first."; dstText.classList.add('empty'); return; }
    dstText.classList.remove('empty');
    dstText.textContent = "Translating...";
    try {
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + srcLang + '&tl=' + dstLang + '&dt=t&q=' + encodeURIComponent(text);
      const response = await fetch(url);
      const data = await response.json();
      const translated = data[0].map(seg => seg[0]).join('');
      dstText.textContent = translated;
    } catch (err) {
      dstText.textContent = "Inline translate failed. Tap 'Open in Google Translate'.";
      dstText.classList.add('empty');
    }
  }
  document.getElementById('translateBtn').addEventListener('click', translate);
  srcText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); translate(); }
  });
  document.getElementById('openGoogle').addEventListener('click', () => {
    const text = srcText.value.trim();
    const url = text
      ? 'https://translate.google.com/?sl=' + srcLang + '&tl=' + dstLang + '&text=' + encodeURIComponent(text) + '&op=translate'
      : 'https://translate.google.com/?sl=' + srcLang + '&tl=' + dstLang + '&op=translate';
    window.open(url, '_blank');
  });
  document.getElementById('speakBtn').addEventListener('click', () => {
    const text = dstText.classList.contains('empty') ? '' : dstText.textContent;
    if (!text || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = dstLang === 'pt' ? 'pt-PT' : 'en-GB';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  });
  document.getElementById('clearBtn').addEventListener('click', () => {
    srcText.value = '';
    dstText.textContent = "Your translation will appear here.";
    dstText.classList.add('empty');
  });

  updateLabels();
