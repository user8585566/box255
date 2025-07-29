import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import CreateVoiceRoom from './components/CreateVoiceRoom';
import VoiceRoomPage from './components/VoiceRoomPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
        <Route path="/create-voice-room" element={<CreateVoiceRoom />} />
        <Route path="/voice-room/:roomId" element={<VoiceRoomPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
