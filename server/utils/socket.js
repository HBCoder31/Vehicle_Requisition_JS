const logger = require('./logger');
const auth = require('../middleware/auth');

const clients = new Set();

module.exports = {
  init: (app) => {
    // We attach the route directly to Express
    app.get('/api/events', auth.authenticate, (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const userId = req.user.id;
      const role = req.user.role;
      
      const client = {
        id: userId,
        role: role,
        res
      };

      clients.add(client);
      logger.info(`SSE Client connected: User ${userId} (${role})`);

      // Keep connection alive with pings every 30s
      const pingInterval = setInterval(() => {
        res.write(':ping\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(pingInterval);
        clients.delete(client);
        logger.info(`SSE Client disconnected: User ${userId}`);
      });
    });
  },
  
  getIO: () => {
    return {
      to: (room) => {
        return {
          emit: (event, payload) => {
            const data = JSON.stringify({ type: event, payload });
            for (const client of clients) {
              if (room === `user_${client.id}` || room === client.role) {
                client.res.write(`data: ${data}\n\n`);
              }
            }
          }
        };
      }
    };
  }
};
