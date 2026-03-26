import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleChat } from './server/chatHandler.js';

function aiMiddleware(env) {
  return {
    name: 'goz-ai-middleware',
    configureServer(server) {
      server.middlewares.use('/api/chat', (request, response) => handleChat(request, response, env));
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/chat', (request, response) => handleChat(request, response, env));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), aiMiddleware(env)],
  };
});
