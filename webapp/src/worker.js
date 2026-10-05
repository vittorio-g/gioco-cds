import { Stanza } from './room.js';

export { Stanza };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/ws\/([A-Z]{4})$/);
    if (!m) return new Response('Non trovato', { status: 404 });
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Serve una connessione WebSocket.', { status: 426 });
    }
    return env.STANZE.getByName(m[1]).fetch(request);
  },
};
