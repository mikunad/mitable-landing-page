export function mountFilm(film) {
  const video = film?.querySelector('video');
  if (!video) return () => {};
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const events = [];
  let disposed = false;
  let starting = false;
  let retries = 0;
  let retryTimer;
  const canPlay = () => !disposed && !document.hidden && !reducedMotion.matches;
  const listen = (target, name, callback, options) => {
    target.addEventListener(name, callback, options);
    events.push(() => target.removeEventListener(name, callback, options));
  };

  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.controls = false;
  video.disablePictureInPicture = true;
  video.disableRemotePlayback = true;
  video.tabIndex = -1;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
  video.removeAttribute('controls');
  film.querySelector('[data-film-toggle]')?.remove();

  function hidePlayer() { delete video.dataset.playing; }
  function queueRetry() {
    if (!canPlay() || retries >= 3) return;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(syncPlayback, [150, 600, 1500][retries++]);
  }
  function syncPlayback() {
    if (disposed) return;
    if (!canPlay()) {
      clearTimeout(retryTimer);
      hidePlayer();
      video.pause();
      return;
    }
    if (!video.paused) {
      if (video.readyState >= 2) video.dataset.playing = '';
      return;
    }
    if (starting) return;
    starting = true;
    video.muted = true;
    let attempt;
    try { attempt = video.play(); }
    catch { starting = false; hidePlayer(); queueRetry(); return; }
    Promise.resolve(attempt).then(() => {
      starting = false;
      if (!canPlay()) { video.pause(); hidePlayer(); }
      else if (!video.paused && video.readyState >= 2) video.dataset.playing = '';
    }).catch(() => {
      starting = false;
      hidePlayer();
      queueRetry();
    });
  }
  function resume() {
    retries = 0;
    syncPlayback();
  }
  listen(video, 'playing', () => {
    if (!canPlay()) { video.pause(); return; }
    clearTimeout(retryTimer);
    retries = 0;
    video.dataset.playing = '';
  });
  listen(video, 'pause', () => { hidePlayer(); queueRetry(); });
  listen(video, 'error', hidePlayer);
  listen(video, 'loadeddata', resume);
  listen(video, 'canplay', syncPlayback);
  listen(video, 'ended', () => { video.currentTime = 0; resume(); });
  listen(reducedMotion, 'change', resume);
  listen(document, 'visibilitychange', resume);
  listen(window, 'pageshow', resume);
  listen(document, 'resume', resume);
  listen(document, 'pointerdown', resume, {passive:true});
  listen(document, 'touchend', resume, {passive:true});
  listen(document, 'keydown', resume);
  syncPlayback();
  return () => {
    disposed = true;
    clearTimeout(retryTimer);
    events.forEach(remove => remove());
    hidePlayer();
    video.pause();
  };
}
