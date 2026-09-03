// API Configuration for Placeonix
(function () {
  // Determine backend server origin dynamically:
  // If running on a local static server (e.g. port 8000 from Python or 5500 from Live Server),
  // route requests to the backend Express server on port 5000.
  let backendOrigin = 'http://localhost:5000';

  if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:') {
    const { protocol, hostname, port } = window.location;
    if (port === '5000' || (!port && !['localhost', '127.0.0.1'].includes(hostname))) {
      backendOrigin = window.location.origin;
    } else {
      backendOrigin = `${protocol}//${hostname}:5000`;
    }
  }

  const CONFIG = {
    API_BASE_URL: `${backendOrigin}/api`,
    UPLOADS_BASE_URL: backendOrigin,
    APP_NAME: 'Placeonix',
  };

  window.CONFIG = CONFIG;
})();
