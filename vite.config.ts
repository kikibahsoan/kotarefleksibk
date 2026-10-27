import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function chatApiPlugin(): Plugin {
  const CHATS_FILE = path.resolve(__dirname, 'server_chats.json');

  const purgeExpired = (chats: any[]) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return (chats || [])
      .filter((m) => {
        const time = new Date(m.createdAt).getTime();
        return !isNaN(time) && time >= cutoff && !m.isReported;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 25);
  };

  const getChats = (): any[] => {
    try {
      if (fs.existsSync(CHATS_FILE)) {
        const raw = fs.readFileSync(CHATS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return purgeExpired(parsed);
        }
      }
    } catch (e) {}

    // Initial default messages
    return [
      {
        id: 'pchat-init-1',
        senderId: 'std-dkv-101',
        senderName: 'Budi Santoso',
        senderHandle: '@budi_dkv',
        className: 'X DKV 1 (Desain Komunikasi Visual)',
        roomNumber: 1,
        content: 'Halo teman-teman DKV! Sudah baca materi arsitektur Von Neumann di perpustakaan?',
        timestamp: '23.10',
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        avatarColor: '#38bdf8',
      },
      {
        id: 'pchat-init-2',
        senderId: 'std-dkv-102',
        senderName: 'Siti Rahmawati',
        senderHandle: '@siti_rahma',
        className: 'X DKV 2 (Desain Komunikasi Visual)',
        roomNumber: 1,
        content: 'Halo Budi! Seru banget analogi meja kerja RAM dan bahan es tehnya hehe 😄',
        timestamp: '23.12',
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        avatarColor: '#f472b6',
      },
      {
        id: 'pchat-init-3',
        senderId: 'std-dkv-103',
        senderName: 'Mohamad Rizki',
        senderHandle: '@m_rizki',
        className: 'X DKV 3 (Desain Komunikasi Visual)',
        roomNumber: 1,
        content: 'Salam kenal semua! Siapa yang lagi santai kumpul di Monumen Warga sekarang?',
        timestamp: '23.14',
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        avatarColor: '#4ade80',
      },
    ];
  };

  const saveChats = (chats: any[]) => {
    try {
      fs.writeFileSync(CHATS_FILE, JSON.stringify(purgeExpired(chats), null, 2), 'utf-8');
    } catch (e) {}
  };

  return {
    name: 'chat-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/chat/messages')) {
          return next();
        }

        if (req.method === 'GET') {
          const chats = getChats();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, data: chats, ttlHours: 24, maxLimit: 25 }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              const now = new Date();
              const hours = String(now.getHours()).padStart(2, '0');
              const minutes = String(now.getMinutes()).padStart(2, '0');
              const newMsg = {
                id: parsed.id || `pchat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                senderId: parsed.senderId || 'std-anon',
                senderName: parsed.senderName || 'Warga Kota',
                senderHandle: parsed.senderHandle || '@warga',
                className: parsed.className || 'X DKV SMK',
                roomNumber: parsed.roomNumber || 1,
                content: (parsed.content || '').trim().slice(0, 120),
                timestamp: parsed.timestamp || `${hours}.${minutes}`,
                createdAt: parsed.createdAt || now.toISOString(),
                avatarColor: parsed.avatarColor || '#38bdf8',
              };
              const current = getChats();
              const updated = [newMsg, ...current.filter((c) => c.id !== newMsg.id)];
              saveChats(updated);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, data: newMsg, ttlHours: 24, maxLimit: 25 }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Invalid payload' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), chatApiPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
