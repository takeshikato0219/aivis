import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  /**
   * Initiating WebRTC connection
   */
  async initializePeerConnection(iceServers?: any[]) {
    const configuration = {
      iceServers: iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l. google.com:19302' },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    (this.peerConnection as RTCPeerConnection).addEventListener('icecandidate', (event: any) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate);
        // Send candidate to server/peer
      }
    });

    (this.peerConnection as RTCPeerConnection).addEventListener('track', (event: any) => {
      console.log('Remote track added');
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      }
    });

    return this.peerConnection;
  }

  /**
   * Start recording from the microphone.
   */
  async startLocalAudioStream(): Promise<MediaStream | null> {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.localStream = stream;

      if (this.peerConnection && stream) {
        stream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  /**
   * Stop audio stream
   */
  stopLocalAudioStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Create an offer to connect.
   */
  async createOffer(): Promise<RTCSessionDescription | null> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  /**
   * Handling answers from remote peers
   */
  async handleAnswer(answer: RTCSessionDescription) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidate) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * Close the connection.
   */
  closeConnection() {
    this.stopLocalAudioStream();

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Initialize WebRTC manager
   */
  async initialize(config?: { iceServers?: any[] }) {
    return this.initializePeerConnection(config?.iceServers);
  }

  /**
   * Create peer connection (alias for initializePeerConnection)
   */
  async createPeerConnection(iceServers?: any[]) {
    return this.initializePeerConnection(iceServers);
  }

  /**
   * Create answer for offer
   */
  async createAnswer(): Promise<RTCSessionDescription | null> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(description: RTCSessionDescription) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Start local stream (video + audio)
   */
  async startLocalStream(): Promise<MediaStream | null> {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: 640,
          height: 480,
        },
      });

      this.localStream = stream;

      if (this.peerConnection && stream) {
        stream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      console.error('Error accessing camera and microphone:', error);
      throw error;
    }
  }

  /**
   * Stop local stream
   */
  stopLocalStream() {
    this.stopLocalAudioStream();
  }

  /**
   * Toggle audio
   */
  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;

    const audioTracks = this.localStream.getAudioTracks();
    const newState = enabled !== undefined ? enabled : !audioTracks[0]?.enabled;

    audioTracks.forEach((track) => {
      track.enabled = newState;
    });

    return newState;
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;

    const videoTracks = this.localStream.getVideoTracks();
    const newState = enabled !== undefined ? enabled : !videoTracks[0]?.enabled;

    videoTracks.forEach((track) => {
      track.enabled = newState;
    });

    return newState;
  }

  /**
   * Switch camera
   */
  async switchCamera(): Promise<boolean> {
    if (!this.localStream) return false;

    try {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (!videoTrack) return false;

      const currentFacing = videoTrack.getSettings().facingMode;
      const newFacing = currentFacing === 'user' ? 'environment' : 'user';

      const newStream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: newFacing,
          width: 640,
          height: 480,
        },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace video track in peer connection
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      // Replace track in local stream
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);
      videoTrack.stop();

      return true;
    } catch (error) {
      console.error('Error switching camera:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.closeConnection();
  }

  /**
   * ICE candidate callback
   */
  onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    if (!this.peerConnection) return;

    this.peerConnection.addEventListener('icecandidate', (event: any) => {
      if (event.candidate) {
        callback(event.candidate);
      }
    });
  }

  /**
   * Track callback
   */
  onTrack(callback: (event: any) => void) {
    if (!this.peerConnection) return;

    this.peerConnection.addEventListener('track', callback);
  }

  /**
   * Connection state change callback
   */
  onConnectionStateChange(callback: (state: string) => void) {
    if (!this.peerConnection) return;

    this.peerConnection.addEventListener('connectionstatechange', () => {
      callback(this.peerConnection?.connectionState || 'unknown');
    });
  }
}

export default new WebRTCManager();
