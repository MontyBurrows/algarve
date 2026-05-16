
  // ── Lightbox ────────────────────────────────────────────────────
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    let currentGallery = [];
    let currentIdx = 0;
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
      lbCounter.textContent = (currentIdx + 1) + ' of ' + currentGallery.length + (item.caption ? ' - ' + item.caption : '');
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
  }

  // ── Accordion (day dropdowns) ───────────────────────────────────
  document.querySelectorAll('.day-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.day').classList.toggle('collapsed');
    });
  });

  // Auto-open the day matching today's date; all others stay collapsed
  const today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('.day[data-date]').forEach(day => {
    if (day.dataset.date === today) {
      day.classList.remove('collapsed');
    }
  });

  // ── Translator ──────────────────────────────────────────────────
  const srcText = document.getElementById('srcText');
  if (srcText) {
    let srcLang = 'en', dstLang = 'pt';
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
  }

  // ── Weather forecast ────────────────────────────────────────────
  const weatherGrid = document.getElementById('weather-grid');
  if (weatherGrid) {
    const LAT = 37.07, LON = -8.10;
    const TRIP = new Set(['2026-05-21', '2026-05-22', '2026-05-23', '2026-05-24']);

    function wmoInfo(code) {
      if (code === 0)   return ['☀️', 'Clear sky'];
      if (code <= 2)    return ['🌤️', 'Partly cloudy'];
      if (code === 3)   return ['☁️', 'Overcast'];
      if (code <= 48)   return ['🌫️', 'Foggy'];
      if (code <= 55)   return ['🌦️', 'Drizzle'];
      if (code <= 65)   return ['🌧️', 'Rain'];
      if (code <= 75)   return ['❄️', 'Snow'];
      if (code <= 82)   return ['🌦️', 'Showers'];
      return                   ['⛈️', 'Storms'];
    }

    function fmtDay(dateStr) {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=' + LAT + '&longitude=' + LON
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max'
      + '&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m'
      + '&timezone=Europe%2FLisbon&forecast_days=16'
      + '&wind_speed_unit=mph&models=ukmo_seamless';

    fetch(url)
      .then(r => r.json())
      .then(data => {
        document.getElementById('weather-loading').style.display = 'none';
        weatherGrid.style.display = '';

        const d = data.daily;
        const h = data.hourly;

        // Index hourly entries by date
        const byDate = {};
        h.time.forEach((t, i) => {
          const date = t.slice(0, 10);
          const hour = parseInt(t.slice(11, 13));
          if (!byDate[date]) byDate[date] = [];
          byDate[date].push({
            hour,
            temp: h.temperature_2m[i],
            code: h.weather_code[i],
            rain: h.precipitation_probability[i],
            wind: h.wind_speed_10m[i]
          });
        });

        const list = document.createElement('div');
        list.className = 'weather-list';

        d.time.forEach((date, i) => {
          const isTrip = TRIP.has(date);
          const [icon, desc] = wmoInfo(d.weather_code[i]);
          const rainMm = d.precipitation_sum[i];
          const rainLabel = rainMm > 0 ? rainMm.toFixed(1) + 'mm rain' : 'Dry';
          const windLabel = Math.round(d.wind_speed_10m_max[i]) + ' mph max';

          const row = document.createElement('div');
          row.className = 'weather-day-row' + (isTrip ? ' trip-day' : '');

          // Summary bar
          const summary = document.createElement('div');
          summary.className = 'weather-day-summary';
          summary.innerHTML =
            '<span class="weather-summary-name">' + fmtDay(date) + (isTrip ? ' ★' : '') + '</span>'
            + '<span class="weather-summary-icon">' + icon + '</span>'
            + '<span class="weather-summary-temps">' + Math.round(d.temperature_2m_max[i]) + '&deg;'
            + '<span class="lo"> / ' + Math.round(d.temperature_2m_min[i]) + '&deg;</span></span>'
            + '<span class="weather-summary-desc">' + desc + '</span>'
            + '<span class="weather-summary-rain">' + rainLabel + '</span>'
            + '<span class="weather-summary-wind">' + windLabel + '</span>'
            + '<span class="weather-chevron">&#8964;</span>';

          // Hourly expansion
          const hourlyWrap = document.createElement('div');
          hourlyWrap.className = 'weather-hourly';
          const hourlyInner = document.createElement('div');
          hourlyInner.className = 'weather-hourly-inner';
          const table = document.createElement('div');
          table.className = 'weather-hourly-table';

          (byDate[date] || [])
            .filter(e => e.hour >= 6 && e.hour % 3 === 0)
            .forEach(e => {
              const [hIcon] = wmoInfo(e.code);
              const hRow = document.createElement('div');
              hRow.className = 'weather-hour-row';
              hRow.innerHTML =
                '<span class="weather-hour-time">' + String(e.hour).padStart(2, '0') + ':00</span>'
                + '<span class="weather-hour-icon">' + hIcon + '</span>'
                + '<span class="weather-hour-temp">' + Math.round(e.temp) + '&deg;</span>'
                + '<span class="weather-hour-rain">' + (e.rain != null ? e.rain + '% rain chance' : '--') + '</span>'
                + '<span class="weather-hour-wind">' + Math.round(e.wind) + ' mph</span>';
              table.appendChild(hRow);
            });

          hourlyInner.appendChild(table);
          hourlyWrap.appendChild(hourlyInner);
          row.appendChild(summary);
          row.appendChild(hourlyWrap);
          row.addEventListener('click', () => row.classList.toggle('open'));
          list.appendChild(row);
        });

        const src = document.createElement('p');
        src.className = 'weather-source';
        src.textContent = 'Met Office model (UKMO Seamless) via Open-Meteo · wind in mph';
        list.appendChild(src);
        weatherGrid.appendChild(list);
      })
      .catch(() => {
        document.getElementById('weather-loading').style.display = 'none';
        document.getElementById('weather-error').style.display = 'block';
      });
  }

  // ── Bingo ───────────────────────────────────────────────────────
  const bingoBoard = document.getElementById('bingo-board');
  if (bingoBoard) {
    const SQUARES = [
      'Someone gets sunburned',
      'Pastel de nata consumed',
      '"Just one more drink" x3',
      'Wrong thing ordered by mistake',
      'Falls asleep on the beach',
      'Spills a drink',
      '20+ min debate on where to eat',
      'Photo worthy of a postcard',
      '"I\'m not hungry" then eats loads',
      'Gets lost finding a venue',
      'Still out past 3am',
      'Spots a stray cat',
      'The Algarve!',
      'Forgets to apply sunscreen',
      'Ends up somewhere unplanned',
      'Genuine "wow" at the view',
      'Attempts Portuguese',
      'Loses track of whose round it is',
      'Catches a sunset or sunrise',
      'Orders something, no idea what it is',
      '"We should do this every year"',
      'Gets hit on at the bar',
      'Refuses to leave when it\'s time',
      'Mentions prices back home',
      'Ugly-cries at a banger'
    ];
    const FREE = 12;
    const KEY = 'algarve-bingo-v1';

    let state = Array(25).fill(false);
    state[FREE] = true;

    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(saved) && saved.length === 25) { state = saved; state[FREE] = true; }
    } catch (e) {}

    function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

    function winLines() {
      const lines = [];
      for (let r = 0; r < 5; r++) {
        const row = [r*5, r*5+1, r*5+2, r*5+3, r*5+4];
        if (row.every(i => state[i])) lines.push(row);
      }
      for (let c = 0; c < 5; c++) {
        const col = [c, c+5, c+10, c+15, c+20];
        if (col.every(i => state[i])) lines.push(col);
      }
      if ([0,6,12,18,24].every(i => state[i])) lines.push([0,6,12,18,24]);
      if ([4,8,12,16,20].every(i => state[i])) lines.push([4,8,12,16,20]);
      return lines;
    }

    function render() {
      const winning = new Set(winLines().flat());
      bingoBoard.querySelectorAll('.bingo-cell').forEach((cell, i) => {
        cell.classList.toggle('marked', state[i] && i !== FREE);
        cell.classList.toggle('winning', winning.has(i));
      });
      const banner = document.getElementById('bingo-win-banner');
      if (banner) banner.classList.toggle('visible', winning.size > 0);
    }

    SQUARES.forEach((text, i) => {
      const cell = document.createElement('div');
      cell.className = 'bingo-cell' + (i === FREE ? ' free' : '');
      cell.textContent = text;
      if (i !== FREE) {
        cell.addEventListener('click', () => { state[i] = !state[i]; save(); render(); });
      }
      bingoBoard.appendChild(cell);
    });
    render();

    const resetBtn = document.getElementById('bingo-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state = Array(25).fill(false);
        state[FREE] = true;
        save();
        render();
      });
    }
  }
