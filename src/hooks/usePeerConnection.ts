import React, { useEffect, useRef, useState } from 'react';
import { CallSignal } from '../types';
import { updateCallSignalInFirestore, addIceCandidateToFirestore } from '../lib/firebaseService';

interface UsePeerConnectionOptions {
  isOpen: boolean;
  callSignal: CallSignal | null;
  currentUserId: string;
  userName: string;
  isSpeakerOn: boolean;
  mediaStreamRef: React.RefObject<MediaStream | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
}

export function usePeerConnection({
  isOpen,
  callSignal,
  currentUserId,
  userName,
  isSpeakerOn,
  mediaStreamRef,
  videoRef,
  remoteVideoRef,
  remoteAudioRef
}: UsePeerConnectionOptions) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const addedCandidatesRef = useRef<Set<string>>(new Set());
  const [isRemoteConnected, setIsRemoteConnected] = useState<boolean>(false);

  // 1. Initialize PeerConnection, Event Listeners & Broadcast Channels
  useEffect(() => {
    if (!isOpen || !callSignal || !callSignal.id) return;

    addedCandidatesRef.current.clear();
    setIsRemoteConnected(false);

    let pc: RTCPeerConnection | null = null;
    let iceChannel: BroadcastChannel | null = null;
    let sdpChannel: BroadcastChannel | null = null;

    try {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          // Open Relay TURN servers for cross-network/mobile/NAT traversal (Free Tier)
          {
            urls: [
              'turn:openrelay.metered.ca:80',
              'turn:openrelay.metered.ca:443',
              'turn:openrelay.metered.ca:443?transport=tcp'
            ],
            username: 'openrelay',
            credential: 'openrelay'
          }
        ]
      };

      pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // BroadcastChannels for instant multi-window/multi-tab WebRTC signaling
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          iceChannel = new BroadcastChannel(`near_intent_webrtc_ice_${callSignal.id}`);
          sdpChannel = new BroadcastChannel(`near_intent_webrtc_sdp_${callSignal.id}`);

          iceChannel.onmessage = async (e) => {
            if (!e.data || e.data.senderId === (currentUserId || userName)) return;
            if (e.data.type === 'ICE_CANDIDATE' && e.data.candidate && pc) {
              try {
                const candStr = JSON.stringify(e.data.candidate);
                if (!addedCandidatesRef.current.has(candStr)) {
                  if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(e.data.candidate));
                    addedCandidatesRef.current.add(candStr);
                    console.log('[WebRTC] Added ICE candidate from BroadcastChannel');
                  }
                }
              } catch (err) {}
            }
          };

          sdpChannel.onmessage = async (e) => {
            if (!e.data || e.data.senderId === (currentUserId || userName)) return;

            if (e.data.type === 'OFFER_SDP' && pc) {
              try {
                console.log('[WebRTC BroadcastChannel] Received OFFER_SDP');
                const offerDesc = new RTCSessionDescription(e.data.sdp);
                
                // Handle offer during renegotiation or initial state
                if (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(offerDesc);
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);

                  if (pc.localDescription) {
                    sdpChannel?.postMessage({
                      type: 'ANSWER_SDP',
                      senderId: currentUserId || userName,
                      sdp: pc.localDescription
                    });
                    updateCallSignalInFirestore(callSignal.id, {
                      answerSdp: JSON.stringify(pc.localDescription)
                    });
                  }
                }
              } catch (err) {
                console.warn('[WebRTC BroadcastChannel] Offer handling error:', err);
              }
            } else if (e.data.type === 'ANSWER_SDP' && pc) {
              try {
                if (pc.signalingState === 'have-local-offer') {
                  console.log('[WebRTC BroadcastChannel] Received ANSWER_SDP');
                  const answerDesc = new RTCSessionDescription(e.data.sdp);
                  await pc.setRemoteDescription(answerDesc);
                }
              } catch (err) {
                console.warn('[WebRTC BroadcastChannel] Answer handling error:', err);
              }
            }
          };
        } catch (e) {}
      }

      // Track renegotiation needed event (fired when new tracks/cameras are added mid-call)
      pc.onnegotiationneeded = async () => {
        try {
          if (!pc || pc.signalingState !== 'stable') return;
          console.log('[WebRTC] Track/stream changed. Triggering negotiation...');
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          await pc.setLocalDescription(offer);

          if (pc.localDescription) {
            sdpChannel?.postMessage({
              type: 'OFFER_SDP',
              senderId: currentUserId || userName,
              sdp: pc.localDescription
            });
            updateCallSignalInFirestore(callSignal.id, {
              offerSdp: JSON.stringify(pc.localDescription)
            });
          }
        } catch (err) {
          console.warn('[WebRTC] Negotiation error:', err);
        }
      };

      // Attach 'ontrack' listener BEFORE media streams & SDP exchange begin
      pc.ontrack = (event) => {
        console.log('[WebRTC] ontrack fired. Track kind:', event.track?.kind, 'ID:', event.track?.id);
        setIsRemoteConnected(true);

        let stream = event.streams && event.streams[0];
        if (!stream) {
          stream = new MediaStream([event.track]);
        }
        remoteStreamRef.current = stream;

        if (remoteAudioRef.current) {
          try {
            remoteAudioRef.current.srcObject = stream;
            remoteAudioRef.current.muted = !isSpeakerOn;
            remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.0;
            remoteAudioRef.current.play().catch((err) => console.warn('[WebRTC] Remote audio play error:', err));
          } catch (e) {}
        }
        if (remoteVideoRef.current) {
          try {
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.play().catch((err) => console.warn('[WebRTC] Remote video play error:', err));
          } catch (e) {}
        }
      };

      // Attach 'onicecandidate' handler
      pc.onicecandidate = (event) => {
        if (event.candidate && callSignal?.id) {
          try {
            const candJson = JSON.stringify(event.candidate.toJSON());

            if (iceChannel) {
              iceChannel.postMessage({
                type: 'ICE_CANDIDATE',
                senderId: currentUserId || userName,
                candidate: event.candidate.toJSON()
              });
            }

            const uId = (currentUserId || userName || '').toLowerCase();
            const cId = (callSignal.callerId || '').toLowerCase();
            const cName = (callSignal.callerName || '').toLowerCase();
            const role = (cId === uId || (cName !== '' && cName === uId)) ? 'caller' : 'receiver';
            addIceCandidateToFirestore(callSignal.id, role, candJson);
          } catch (err) {}
        }
      };

      // Connection state monitor & Auto ICE Restart on failure
      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE connection state:', pc?.iceConnectionState);
        if (pc?.iceConnectionState === 'connected' || pc?.iceConnectionState === 'completed') {
          setIsRemoteConnected(true);
        } else if (pc?.iceConnectionState === 'failed') {
          console.warn('[WebRTC] ICE Connection failed. Restarting ICE...');
          pc.restartIce();
        }
      };

    } catch (err) {
      console.warn('WebRTC peer connection setup error:', err);
    }

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (iceChannel) {
        try { iceChannel.close(); } catch (e) {}
      }
      if (sdpChannel) {
        try { sdpChannel.close(); } catch (e) {}
      }
    };
  }, [isOpen, callSignal?.id]);

  // 2. Continuously ensure local media tracks are attached to PeerConnection
  useEffect(() => {
    if (!isOpen || !peerConnectionRef.current) return;

    const attachTracks = () => {
      const pc = peerConnectionRef.current;
      if (!pc || pc.signalingState === 'closed') return;

      if (mediaStreamRef.current) {
        const existingSenders = pc.getSenders();
        mediaStreamRef.current.getTracks().forEach(track => {
          const sender = existingSenders.find(s => s.track?.kind === track.kind);
          if (sender) {
            if (sender.track !== track) {
              sender.replaceTrack(track).catch(() => {});
            }
          } else {
            try {
              pc.addTrack(track, mediaStreamRef.current!);
            } catch (e) {}
          }
        });
      }
    };

    attachTracks();
    const interval = setInterval(attachTracks, 500);
    return () => clearInterval(interval);
  }, [isOpen, mediaStreamRef.current]);

  // 3. Handle Offer / Answer SDP Exchange & Candidate Synchronization
  useEffect(() => {
    if (!isOpen || !callSignal || !callSignal.id || !peerConnectionRef.current) return;

    const pc = peerConnectionRef.current;
    if (pc.signalingState === 'closed') return;

    const uId = (currentUserId || userName || '').toLowerCase();
    const cId = (callSignal.callerId || '').toLowerCase();
    const cName = (callSignal.callerName || '').toLowerCase();
    const isCaller = cId === uId || (cName !== '' && cName === uId);

    const sdpChannel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(`near_intent_webrtc_sdp_${callSignal.id}`)
      : null;

    if (isCaller) {
      // Caller: Create Offer
      if (!callSignal.offerSdp && pc.signalingState === 'stable') {
        // Ensure local tracks are attached before offer creation
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => {
            try { pc.addTrack(t, mediaStreamRef.current!); } catch (e) {}
          });
        }

        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            if (pc.localDescription) {
              console.log('[WebRTC] Caller created local offer SDP');
              sdpChannel?.postMessage({
                type: 'OFFER_SDP',
                senderId: currentUserId || userName,
                sdp: pc.localDescription
              });
              updateCallSignalInFirestore(callSignal.id, {
                offerSdp: JSON.stringify(pc.localDescription)
              });
            }
          })
          .catch(e => console.warn('[WebRTC] createOffer error:', e));
      } else if (callSignal.answerSdp && pc.signalingState === 'have-local-offer') {
        try {
          console.log('[WebRTC] Caller setting remote answer SDP from Firestore');
          const answerDesc = new RTCSessionDescription(JSON.parse(callSignal.answerSdp));
          pc.setRemoteDescription(answerDesc)
            .then(() => {
              if (callSignal.receiverIceCandidates && Array.isArray(callSignal.receiverIceCandidates)) {
                callSignal.receiverIceCandidates.forEach(candStr => {
                  if (!addedCandidatesRef.current.has(candStr)) {
                    try {
                      pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr))).catch(() => {});
                      addedCandidatesRef.current.add(candStr);
                    } catch (e) {}
                  }
                });
              }
            })
            .catch(e => console.warn('[WebRTC] Caller setRemoteDescription answer error:', e));
        } catch (e) {}
      }

      // Sync receiver ICE candidates if remote description set
      if (pc.remoteDescription && callSignal.receiverIceCandidates && Array.isArray(callSignal.receiverIceCandidates)) {
        callSignal.receiverIceCandidates.forEach(candStr => {
          if (!addedCandidatesRef.current.has(candStr)) {
            try {
              pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr))).catch(() => {});
              addedCandidatesRef.current.add(candStr);
            } catch (e) {}
          }
        });
      }
    } else {
      // Receiver: Process Offer & Create Answer
      if (callSignal.offerSdp && !callSignal.answerSdp && pc.signalingState === 'stable') {
        try {
          console.log('[WebRTC] Receiver setting remote offer SDP from Firestore');
          const offerDesc = new RTCSessionDescription(JSON.parse(callSignal.offerSdp));
          pc.setRemoteDescription(offerDesc)
            .then(() => {
              if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => {
                  try { pc.addTrack(t, mediaStreamRef.current!); } catch (e) {}
                });
              }
              return pc.createAnswer();
            })
            .then(answer => pc.setLocalDescription(answer))
            .then(() => {
              if (pc.localDescription) {
                console.log('[WebRTC] Receiver created local answer SDP');
                sdpChannel?.postMessage({
                  type: 'ANSWER_SDP',
                  senderId: currentUserId || userName,
                  sdp: pc.localDescription
                });
                updateCallSignalInFirestore(callSignal.id, {
                  answerSdp: JSON.stringify(pc.localDescription)
                });
              }
              if (callSignal.callerIceCandidates && Array.isArray(callSignal.callerIceCandidates)) {
                callSignal.callerIceCandidates.forEach(candStr => {
                  if (!addedCandidatesRef.current.has(candStr)) {
                    try {
                      pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr))).catch(() => {});
                      addedCandidatesRef.current.add(candStr);
                    } catch (e) {}
                  }
                });
              }
            })
            .catch(e => console.warn('[WebRTC] Receiver setRemoteDescription offer error:', e));
        } catch (e) {}
      }

      // Sync caller ICE candidates if remote description set
      if (pc.remoteDescription && callSignal.callerIceCandidates && Array.isArray(callSignal.callerIceCandidates)) {
        callSignal.callerIceCandidates.forEach(candStr => {
          if (!addedCandidatesRef.current.has(candStr)) {
            try {
              pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr))).catch(() => {});
              addedCandidatesRef.current.add(candStr);
            } catch (e) {}
          }
        });
      }
    }

    return () => {
      if (sdpChannel) {
        try { sdpChannel.close(); } catch (e) {}
      }
    };
  }, [
    isOpen,
    callSignal?.id,
    callSignal?.status,
    callSignal?.offerSdp,
    callSignal?.answerSdp,
    callSignal?.callerIceCandidates,
    callSignal?.receiverIceCandidates,
    currentUserId,
    userName
  ]);

  return {
    peerConnectionRef,
    remoteStreamRef,
    isRemoteConnected,
    setIsRemoteConnected
  };
}
