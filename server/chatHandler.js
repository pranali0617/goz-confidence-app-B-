import { gozSystemPrompt } from './gozSystemPrompt.js';

function json(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

export async function handleChat(request, response, env) {
  if (request.method !== 'POST') {
    json(response, 405, { error: 'Method not allowed.' });
    return;
  }

  if (!env.GROQ_API_KEY) {
    json(response, 500, { error: 'Missing GROQ_API_KEY. Add it to your environment before starting the app.' });
    return;
  }

  let payload;
  try {
    payload = await readRequestBody(request);
  } catch {
    json(response, 400, { error: 'Invalid JSON body.' });
    return;
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const selection =
    payload.selection && typeof payload.selection === 'object' ? payload.selection : null;

  if (!messages.length && !selection) {
    json(response, 400, { error: 'No conversation messages were provided.' });
    return;
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: gozSystemPrompt,
          },
          ...(selection
            ? [
                {
                  role: 'user',
                  content: `The user selected pathway ${selection.id}: ${selection.title}. Start that pathway now and follow the system prompt exactly. Do not ask them to choose again.`,
                },
              ]
            : []),
          ...messages,
        ],
      }),
    });

    const groqPayload = await groqResponse.json();
    const content = groqPayload?.choices?.[0]?.message?.content?.trim();

    if (!groqResponse.ok || !content) {
      json(response, 502, {
        error: groqPayload?.error?.message || 'The AI provider returned an invalid response.',
      });
      return;
    }

    json(response, 200, { message: content });
  } catch {
    json(response, 502, { error: 'Failed to reach the AI provider. Check your network access and API key.' });
  }
}
