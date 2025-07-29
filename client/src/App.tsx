import React, { useState, useEffect } from 'react';
import { AuthProvider } from './components/AuthProvider';
import { LoginForm } from './components/LoginForm';
import { RoomSelector } from './components/RoomSelector';
import { ChatInterface } from './components/ChatInterface';
import { CallInterface } from './components/CallInterface';
import { useAuth } from './hooks/useAuth';

type AppState = 'login' | 'rooms' | 'chat' | 'call';

interface CallState {
  type: 'audio' | 'video';
  roomId: string;
}

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>('login');
  const [isSignup, setIsSignup] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState | null>(null);

  useEffect(() => {
    if (!loading) {
      if (user) {
        setAppState('rooms');
      } else {
        setAppState('login');
      }
    }
  }, [user, loading]);

  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleSelectRoom = (roomId: string) => {
    console.log(`Selected room: ${roomId}`);
    setCurrentRoomId(roomId);
    setAppState('chat');
  };

  const handleCreateRoom = (name: string) => {
    // Mock room creation - in real app, this would call API
    const newRoomId = `room-${Date.now()}`;
    console.log('Creating room:', name, newRoomId);
    setCurrentRoomId(newRoomId);
    setAppState('chat');
  };

  const handleJoinRoom = (code: string) => {
    // Mock room joining - in real app, this would call API
    console.log('Joining room with code:', code);
    setCurrentRoomId(`room-${code}`);
    setAppState('chat');
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    if (currentRoomId) {
      setCallState({ type, roomId: currentRoomId });
      setAppState('call');
    }
  };

  const handleEndCall = () => {
    setCallState(null);
    setAppState('chat');
  };

  const handleBackToRooms = () => {
    setCurrentRoomId(null);
    setAppState('rooms');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  switch (appState) {
    case 'login':
      return (
        <LoginForm
          onToggleMode={() => setIsSignup(!isSignup)}
          isSignup={isSignup}
        />
      );

    case 'rooms':
      return (
        <RoomSelector
          onSelectRoom={handleSelectRoom}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      );

    case 'chat':
      return currentRoomId ? (
        <ChatInterface
          roomId={currentRoomId}
          onStartCall={handleStartCall}
          onBack={handleBackToRooms}
        />
      ) : null;

    case 'call':
      return callState ? (
        <CallInterface
          type={callState.type}
          roomId={callState.roomId}
          onEndCall={handleEndCall}
        />
      ) : null;

    default:
      return null;
  }
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;