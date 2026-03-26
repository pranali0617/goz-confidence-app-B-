import { handleChat } from '../server/chatHandler.js';

export default async function handler(request, response) {
  await handleChat(request, response, process.env);
}
