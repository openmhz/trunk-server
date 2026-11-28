import io from 'socket.io-client';

// One shared socket.io connection per tab. It is created lazily and does not
// connect until a system's call page asks for it.
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.REACT_APP_BACKEND_SERVER, { autoConnect: false });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}
