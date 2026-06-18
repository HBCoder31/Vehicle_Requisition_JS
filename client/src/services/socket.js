// Simple wrapper around EventSource to mimic basic socket.io syntax
const URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SSEClient {
  constructor() {
    this.eventSource = null;
    this.handlers = {};
  }

  connect() {
    if (this.eventSource) return;
    this.eventSource = new EventSource(`${URL}/api/events`, { withCredentials: true });
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type && this.handlers[data.type]) {
          this.handlers[data.type](data.payload);
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };
    
    this.eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
    };
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  off(event) {
    delete this.handlers[event];
  }

  emit(event, payload) {
    // SSE is 1-way (Server to Client). To send data to the server, we just use regular API calls.
    // The previous implementation used emit('joinRoom', `user_${user.id}`).
    // We don't need this because EventSource will authenticate via HTTP-only cookies automatically,
    // and the server knows which user it is based on the cookie!
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

const socket = new SSEClient();
export default socket;
