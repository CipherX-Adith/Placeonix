// API Configuration for Placeonix
(function () {
  // Determine base host dynamically so it works seamlessly on localhost,
  // local network IP (e.g. mobile devices connecting via Wi-Fi at http://172.18.121.101:5000),
  // or any custom production domain.
  let origin = 'http://localhost:5000';
  if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:') {
    origin = window.location.origin;
  }

  const CONFIG = {
    API_BASE_URL: `${origin}/api`,
    UPLOADS_BASE_URL: origin,
    APP_NAME: 'Placeonix',
  };

  window.CONFIG = CONFIG;
})();
