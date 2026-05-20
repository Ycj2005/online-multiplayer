// WebRTC Manager
class WebRTCManager {
  constructor() {
    this.peerConnections = {};
    this.localStream = null;
    this.remoteStreams = {};
  }

  async initLocalMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        CONFIG.MEDIA_CONSTRAINTS
      );
      console.log("✓ Local media obtained");
      return this.localStream;
    } catch (error) {
      console.error("✗ Error accessing media:", error);
      UI.showNotification("Unable to access camera/microphone", "error");
      throw error;
    }
  }

  async displayLocalVideo(stream) {
    const videoElement = document.getElementById("localVideo");
    if (videoElement) {
      videoElement.srcObject = stream;
      videoElement.muted = true;
    }
  }

  createPeerConnection(peerId) {
    const peerConnection = new RTCPeerConnection({
      iceServers: CONFIG.ICE_SERVERS,
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        SocketIO.sendIceCandidate(
          USER_STATE.currentRoom,
          peerId,
          event.candidate
        );
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log("📨 Remote track received:", event.track.kind);
      this.remoteStreams[peerId] = event.streams[0];
      UI.displayRemoteVideo(peerId, event.streams[0]);
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
      if (peerConnection.connectionState === "failed") {
        this.closePeerConnection(peerId);
      }
    };

    peerConnection.onicecandidateerror = (event) => {
      console.error("ICE candidate error:", event);
    };

    this.peerConnections[peerId] = peerConnection;
    return peerConnection;
  }

  async createOffer(peerId) {
    try {
      const peerConnection = this.peerConnections[peerId];
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      SocketIO.sendOffer(USER_STATE.currentRoom, peerId, offer);
      console.log("📤 Offer sent to:", peerId);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }

  async handleOffer(peerId, offer) {
    try {
      let peerConnection = this.peerConnections[peerId];
      if (!peerConnection) {
        peerConnection = this.createPeerConnection(peerId);
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      SocketIO.sendAnswer(USER_STATE.currentRoom, peerId, answer);
      console.log("📤 Answer sent to:", peerId);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  async handleAnswer(peerId, answer) {
    try {
      const peerConnection = this.peerConnections[peerId];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log("✓ Answer received from:", peerId);
      }
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }

  async addIceCandidate(peerId, candidate) {
    try {
      const peerConnection = this.peerConnections[peerId];
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
      USER_STATE.isVideoEnabled = enabled;
    }
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      USER_STATE.isAudioEnabled = enabled;
    }
  }

  closePeerConnection(peerId) {
    const peerConnection = this.peerConnections[peerId];
    if (peerConnection) {
      peerConnection.close();
      delete this.peerConnections[peerId];
      UI.removeRemoteVideo(peerId);
      delete this.remoteStreams[peerId];
      console.log("Connection closed with:", peerId);
    }
  }

  closeAllConnections() {
    Object.keys(this.peerConnections).forEach((peerId) => {
      this.closePeerConnection(peerId);
    });
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }
  }

  cleanup() {
    this.closeAllConnections();
    this.stopLocalStream();
  }
}

// Create instance
const WebRTC = new WebRTCManager();
