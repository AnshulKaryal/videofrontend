import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { v4 as uuidV4 } from "uuid";

const socket = io("http://192.168.100.81:5000"); // Change this for production

const App = () => {
  const [me, setMe] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const myVideo = useRef();
  const peerVideo = useRef();
  const peerConnection = useRef(null);

  useEffect(() => {
    setMe(uuidV4()); // Generate a unique ID for the user

    socket.on("user-connected", (userId) => {
      console.log("User connected:", userId);
      callUser(userId);
    });

    socket.on("offer", async (data) => {
      if (!peerConnection.current) setupPeerConnection();
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("answer", { answer, roomId: data.roomId });
    });

    socket.on("answer", async (data) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on("ice-candidate", (data) => {
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.on("user-disconnected", (userId) => {
      console.log("User disconnected:", userId);
      if (peerVideo.current) peerVideo.current.srcObject = null;
    });
  }, []);

  const joinRoom = async () => {
    if (roomId) {
      setJoined(true);
      socket.emit("join-room", roomId, me);
      setupPeerConnection();
      startStream();
    }
  };

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      myVideo.current.srcObject = stream;
      myVideo.current.play();
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  };

  const setupPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, roomId });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (peerVideo.current) {
        peerVideo.current.srcObject = event.streams[0];
      }
    };
  };

  const callUser = async (userId) => {
    if (!peerConnection.current) setupPeerConnection();
    const stream = myVideo.current.srcObject;
    stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit("offer", { offer, roomId });
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Live Video Call</h1>
      {!joined ? (
        <>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </>
      ) : (
        <>
          <h3>Room: {roomId}</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
            <video ref={myVideo} muted style={{ width: "300px", border: "2px solid black" }}></video>
            <video ref={peerVideo} style={{ width: "300px", border: "2px solid red" }}></video>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
