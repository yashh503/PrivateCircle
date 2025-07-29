import AgoraRTC, { 
  IAgoraRTCClient, 
  ILocalAudioTrack, 
  ILocalVideoTrack, 
  IRemoteAudioTrack, 
  IRemoteVideoTrack,
  UID
} from 'agora-rtc-sdk-ng';

export interface AgoraConfig {
  appId: string;
  channel: string;
  token?: string;
  uid: UID;
}

export interface AgoraTokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  expiresAt: number;
}

export class AgoraManager {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: ILocalAudioTrack | null = null;
  private localVideoTrack: ILocalVideoTrack | null = null;
  private remoteUsers: Map<UID, { audioTrack?: IRemoteAudioTrack; videoTrack?: IRemoteVideoTrack }> = new Map();
  private isJoined: boolean = false;

  async init(config: AgoraConfig) {
    try {
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      // Set up event listeners
      this.client.on('user-published', this.handleUserPublished.bind(this));
      this.client.on('user-unpublished', this.handleUserUnpublished.bind(this));
      this.client.on('user-left', this.handleUserLeft.bind(this));
      
      console.log('✅ Agora client initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Agora:', error);
      return false;
    }
  }

  private handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
    if (!this.client) return;
    
    try {
      await this.client.subscribe(user, mediaType);
      
      if (mediaType === 'audio') {
        const audioTrack = user.audioTrack;
        audioTrack?.play();
        
        const remoteUser = this.remoteUsers.get(user.uid) || {};
        remoteUser.audioTrack = audioTrack;
        this.remoteUsers.set(user.uid, remoteUser);
      }
      
      if (mediaType === 'video') {
        const videoTrack = user.videoTrack;
        
        const remoteUser = this.remoteUsers.get(user.uid) || {};
        remoteUser.videoTrack = videoTrack;
        this.remoteUsers.set(user.uid, remoteUser);
        
        // Play video in remote container
        const remoteContainer = document.getElementById('remote-video');
        if (remoteContainer && videoTrack) {
          videoTrack.play(remoteContainer);
        }
      }
      
      console.log(`📺 User ${user.uid} published ${mediaType}`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to user ${user.uid}:`, error);
    }
  };
  
  private handleUserUnpublished = (user: any, mediaType: 'audio' | 'video') => {
    const remoteUser = this.remoteUsers.get(user.uid);
    if (remoteUser) {
      if (mediaType === 'audio' && remoteUser.audioTrack) {
        remoteUser.audioTrack.stop();
        delete remoteUser.audioTrack;
      }
      if (mediaType === 'video' && remoteUser.videoTrack) {
        remoteUser.videoTrack.stop();
        delete remoteUser.videoTrack;
      }
    }
    console.log(`📺 User ${user.uid} unpublished ${mediaType}`);
  };
  
  private handleUserLeft = (user: any) => {
    const remoteUser = this.remoteUsers.get(user.uid);
    if (remoteUser) {
      remoteUser.audioTrack?.stop();
      remoteUser.videoTrack?.stop();
      this.remoteUsers.delete(user.uid);
    }
    console.log(`👋 User ${user.uid} left the call`);
  };

  async join(config: AgoraConfig) {
    try {
      if (!this.client) {
        throw new Error('Agora client not initialized');
      }
      
      await this.client.join(config.appId, config.channel, config.token || null, config.uid);
      this.isJoined = true;
      
      console.log(`✅ Joined channel ${config.channel} with UID ${config.uid}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to join call:', error);
      return false;
    }
  }

  async createLocalTracks(audio: boolean = true, video: boolean = true) {
    try {
      if (audio) {
        this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: 'music_standard'
        });
      }
      
      if (video) {
        this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: '720p_1'
        });
        
        // Play local video
        const localContainer = document.getElementById('local-video');
        if (localContainer && this.localVideoTrack) {
          this.localVideoTrack.play(localContainer);
        }
      }
      
      console.log('✅ Local tracks created');
      return { 
        audio: this.localAudioTrack, 
        video: this.localVideoTrack 
      };
    } catch (error) {
      console.error('❌ Failed to create local tracks:', error);
      return null;
    }
  }

  async publish() {
    try {
      if (!this.client || !this.isJoined) {
        throw new Error('Not joined to channel');
      }
      
      const tracks = [];
      if (this.localAudioTrack) tracks.push(this.localAudioTrack);
      if (this.localVideoTrack) tracks.push(this.localVideoTrack);
      
      if (tracks.length > 0) {
        await this.client.publish(tracks);
        console.log('✅ Published local tracks');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to publish tracks:', error);
      return false;
    }
  }

  async leave() {
    try {
      // Stop and close local tracks
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }
      
      // Stop remote tracks
      this.remoteUsers.forEach((user) => {
        user.audioTrack?.stop();
        user.videoTrack?.stop();
      });
      this.remoteUsers.clear();
      
      // Leave channel
      if (this.client && this.isJoined) {
        await this.client.leave();
        this.isJoined = false;
      }
      
      console.log('✅ Left call successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to leave call:', error);
      return false;
    }
  }

  async toggleAudio(): Promise<boolean> {
    if (this.localAudioTrack) {
      const enabled = this.localAudioTrack.enabled;
      await this.localAudioTrack.setEnabled(!enabled);
      console.log(`🎤 Audio ${enabled ? 'muted' : 'unmuted'}`);
      return !enabled;
    }
    return false;
  }

  async toggleVideo(): Promise<boolean> {
    if (this.localVideoTrack) {
      const enabled = this.localVideoTrack.enabled;
      await this.localVideoTrack.setEnabled(!enabled);
      console.log(`📹 Video ${enabled ? 'disabled' : 'enabled'}`);
      return !enabled;
    }
    return false;
  }
  
  isAudioEnabled(): boolean {
    return this.localAudioTrack?.enabled || false;
  }
  
  isVideoEnabled(): boolean {
    return this.localVideoTrack?.enabled || false;
  }
  
  getRemoteUsers() {
    return Array.from(this.remoteUsers.keys());
  }
}

export const agoraManager = new AgoraManager();