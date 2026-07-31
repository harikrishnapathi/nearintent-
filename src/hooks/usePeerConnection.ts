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

  // 1. Initialize PeerConnection & Event Listeners
  useEffect(() => {
    if (!isOpen || !callSignal || !callSignal.id) return;

    addedCandidatesRef.current.clear();
    setIsRemoteConnected(false);

    let pc: RTCPeerConnection | null = null;
    let iceChannel: BroadcastChannel | null = null;

    try {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      };

      pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // BroadcastChannel fallback for same-browser multi-window calls
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          iceChannel = new BroadcastChannel(`near_intent_webrtc_ice_${callSignal.id}`);
          iceChannel.onmessage = async (e) => {
            if (!e.data || e.data.senderId === (currentUserId || userName)) return;
            if (e.data.type === 'ICE_CANDIDATE' && e.data.candidate && pc && pc.remoteDescription) {
              try {
                const candStr = JSON.stringify(e.data.candidate);
                if (!addedCandidatesRef.current.has(candStr)) {
                  await pc.addIceCandidate(new RTCIceCandidate(e.data.candidate));
                  addedCandidatesRef.current.add(candStr);
                  console.log('[WebRTC] Added ICE candidate from BroadcastChannel');
                }
              } catch (err) {}
            }
          };
        } catch (e) {}
      }

      // Attach 'ontrack' listener BEFORE media streams & SDP exchange begin
      pc.ontrack = (event) => {
        console.log('[WebRTC] ontrack event fired. Track kind:', event.track?.kind, 'ID:', event.track?.id, 'Streams count:', event.streams?.length);
        setIsRemoteConnected(true);
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          if (remoteAudioRef.current) {
            try {
              remoteAudioRef.current.srcObject = event.streams[0];
              remoteAudioRef.current.muted = !isSpeakerOn;
              remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.0;
              remoteAudioRef.current.play().catch((err) => console.warn('[WebRTC] Remote audio play error:', err));
              console.log('[WebRTC] Track attached to remote audio element');
            } catch (e) {
              console.error('[WebRTC] Failed setting remote audio element srcObject:', e);
            }
          }
          if (remoteVideoRef.current) {
            try {
              remoteVideoRef.current.srcObject = event.streams[0];
              remoteVideoRef.current.play().catch((err) => console.warn('[WebRTC] Remote video play error:', err));
              console.log('[WebRTC] Track successfully added to remote video element:', event.track?.kind);
            } catch (e) {
              console.error('[WebRTC] Failed setting remote video element srcObject:', e);
            }
          }
        }
      };

      // Attach 'onicecandidate' handler
      pc.onicecandidate = (event) => {
        if (event.candidate && callSignal?.id) {
          console.log('[WebRTC] Local ICE candidate generated:', event.candidate.candidate);
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
            console.log(`[WebRTC] ICE candidate dispatched to Firestore for role [${role}]`);
          } catch (err) {
            console.error('[WebRTC] Error processing local ICE candidate:', err);
          }
        } else if (!event.candidate) {
          console.log('[WebRTC] Local ICE candidate gathering completed.');
        }
      };

      // Connection state monitor
      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE connection state changed:', pc?.iceConnectionState);
        if (pc?.iceConnectionState === 'connected' || pc?.iceConnectionState === 'completed') {
          setIsRemoteConnected(true);
        }
      };

      // Attach local media stream tracks if available
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          if (pc && mediaStreamRef.current) {
            try {
              pc.addTrack(track, mediaStreamRef.current);
            } catch (e) {}
          }
        });
      }

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
    };
  }, [isOpen, callSignal?.id]);

  // 2. Handle Offer / Answer SDP Exchange & Candidate Synchronization
  useEffect(() => {
    if (!isOpen || !callSignal || !callSignal.id || !peerConnectionRef.current) return;

    const pc = peerConnectionRef.current;
    const uId = (currentUserId || userName || '').toLowerCase();
    const cId = (callSignal.callerId || '').toLowerCase();
    const cName = (callSignal.callerName || '').toLowerCase();
    const isCaller = cId === uId || (cName !== '' && cName === uId);

    if (isCaller) {
      // Caller: Create Offer if not present
      if (!callSignal.offerSdp && pc.signalingState === 'stable') {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            if (pc.localDescription) {
              console.log('[WebRTC] Caller created & set local offer SDP');
              updateCallSignalInFirestore(callSignal.id, {
                offerSdp: JSON.stringify(pc.localDescription)
              });
            }
          })
          .catch(e => console.warn('WebRTC createOffer error:', e));
      } else if (callSignal.answerSdp && pc.signalingState === 'have-local-offer') {
        try {
          console.log('[WebRTC] Caller setting remote answer SDP');
          const answerDesc = new RTCSessionDescription(JSON.parse(callSignal.answerSdp));
          pc.setRemoteDescription(answerDesc)
            .then(() => {
              if (callSignal.receiverIceCandidates && Array.isArray(callSignal.receiverIceCandidates)) {
                callSignal.receiverIceCandidates.forEach(candStr => {
                  if (!addedCandidatesRef.current.has(candStr)) {
                    try {
                      pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr))).then(() => {
                        console.log('[WebRTC] Added remote receiver ICE candidate to PeerConnection');
                      }).catch(() => {});
                      addedCandidatesRef.current.add(candStr);
                    } catch (e) {}
                  }
                });
              }
            })
            .catch(e => console.warn('WebRTC setRemoteDescription answer error:', e));
        } catch (e) {}
      }

      // Sync receiver ICE candidates if remote description set
      if (pc.remoteDescription && callSignal.receiverIceCandidates && Array.isArray(callSignal.receiverIceCandidates)) {
        callSignal.receiverIceCandidates.forEach(candStr => {
          if (!addedCandidatesRef.current.has(candStr)) {
            try {
              pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr))).then(() => {
                console.log('[WebRTC] Added remote receiver ICE candidate to PeerConnection');
              }).catch(() => {});
              addedCandidatesRef.current.add(candStr);
            } catch (e) {}
          }
        });
      }
    } else {
      // Receiver: Process Offer & Create Answer
      if (callSignal.offerSdp && !callSignal.answerSdp && pc.signalingState === 'stable') {
        try {
          console.log('[WebRTC] Receiver setting remote offer SDP');
          const offerDesc = new RTCSessionDescription(JSON.parse(callSignal.offerSdp));
          pc.setRemoteDescription(offerDesc)
            .then(() => pc.createAnswer())
            .then(answer => pc.setLocalDescription(answer))
            .then(() => {
              if (pc.localDescription) {
                console.log('[WebRTC] Receiver created & set local answer SDP');
                updateCallSignalInFirestore(callSignal.id, {
                  answerSdp: JSON.stringify(pc.localDescription)
                });
              }
              if (callSignal.callerIceCandidates && Array.isArray(callSignal.callerIceCandidates)) {
                callSignal.callerIceCandidates.forEach(candStr => {
                  if (!addedCandidatesRef.current.has(candStr)) {
                    try {
                      pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr))).then(() => {
                        console.log('[WebRTC] Added remote caller ICE candidate to PeerConnection');
                      }).catch(() => {});
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
              pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr))).then(() => {
                console.log('[WebRTC] Added remote caller ICE candidate to PeerConnection');
              }).catch(() => {});
              addedCandidatesRef.current.add(candStr);
            } catch (e) {}
          }
        });
      }
    }
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
