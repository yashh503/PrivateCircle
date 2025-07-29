import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Camera, CameraOff, Speaker } from 'lucide-react';
import { agoraManager } from '../utils/agora';
import { useAuth } from '../hooks/useAuth';

interface CallInterfaceProps {
  type: 'audio' | 'video';
  roomId: string;
  onEndCall: () => void;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({
  type,
  roomId,
  onEndCall
}) => {
  const { user } = useAuth();
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  useEffect(() => {
    // Get Agora token and initialize call
    const initCall = async () => {
      try {
        // Get Agora token from backend
        const accessToken = localStorage.getItem('accessToken');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        const response = await fetch(`${apiUrl}/api/agora/token/${roomId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channelName: `room-${roomId}`,
            uid: parseInt(user?.id || '0', 10) || Math.floor(Math.random() * 10000)
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get Agora token');
        }

        const tokenData = await response.json();
        setAgoraToken(tokenData.token);

        // Initialize Agora
        const config = {
          appId: tokenData.appId,
          channel: tokenData.channelName,
          token: tokenData.token,
          uid: tokenData.uid
        };

        await agoraManager.init(config);
        await agoraManager.join(config);
        await agoraManager.createLocalTracks(true, type === 'video');
        await agoraManager.publish();
        
        setCallStatus('connected');
      } catch (error) {
        console.error('Failed to initialize call:', error);
        setCallStatus('ended');
      }
    };

    initCall();

    return () => {
      agoraManager.leave();
    };
  }, [roomId, type, user?.id]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = async () => {
    const newMutedState = await agoraManager.toggleAudio();
    setIsMuted(!newMutedState);
  };

  const toggleVideo = async () => {
    if (type === 'video') {
      const newVideoState = await agoraManager.toggleVideo();
      setIsVideoOff(!newVideoState);
    }
  };

  const handleEndCall = () => {
    agoraManager.leave();
    onEndCall();
  };

  if (callStatus === 'ended') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Call Ended</h2>
          <button
            onClick={onEndCall}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col">
      {/* Status Bar */}
      <div className="p-4 text-center">
        <h2 className="text-white text-lg font-semibold mb-2">
          {callStatus === 'connecting' ? 'Connecting...' : 'Private Call'}
        </h2>
        {callStatus === 'connected' && (
          <p className="text-gray-300 text-sm">{formatDuration(callDuration)}</p>
        )}
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {type === 'video' ? (
          <div className="h-full mx-4 mb-4 relative">
            {/* Remote video */}
            <div 
              id="remote-video"
              ref={remoteVideoRef}
              className="h-full bg-gray-800 rounded-2xl overflow-hidden"
            >
              {agoraManager.getRemoteUsers().length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-gray-400">Waiting for partner...</p>
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* Local video preview */}
            <div 
              id="local-video"
              ref={localVideoRef}
              className="absolute top-4 right-4 w-32 h-40 bg-gray-700 rounded-lg overflow-hidden border-2 border-white/20"
            >
              {isVideoOff && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <CameraOff className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Phone className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Voice Call</h3>
              <p className="text-gray-400">Audio only</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6">
        <div className="flex justify-center space-x-6">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            } transition-colors`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          {type === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full ${
                isVideoOff 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              } transition-colors`}
            >
              {isVideoOff ? (
                <CameraOff className="w-6 h-6 text-white" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
          )}

          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`p-4 rounded-full ${
              isSpeakerOn 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            } transition-colors`}
          >
            <Speaker className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};