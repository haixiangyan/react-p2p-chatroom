import {useEffect, useRef, useState} from "react";
import Peer from "peerjs";

function App() {
  const [localId, setLocalId] = useState('');
  const [remoteId, setRemoteId] = useState('');

  const currentCall = useRef();

  const peer = useRef()

  const localVideo = useRef();
  const remoteVideo = useRef();

  useEffect(() => {
    peer.current = new Peer();
    peer.current.on("open", (id) => {
      setLocalId(id)
    });
    peer.current.on('call', async (call) => {
      if (window.confirm(`是否接受 ${call.peer}?`)) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localVideo.current.srcObject = stream
        localVideo.current.play()

        call.answer(stream)

        currentCall.current = call

        call.on('stream', (stream) => {
          remoteVideo.current.srcObject = stream;
          remoteVideo.current.play()
        })
      } else {
        call.close()
        alert('已关闭')
      }
    })

    return () => {
      endCall()
    }
  }, [])

  const endCall = () => {
    if (currentCall.current) {
      currentCall.current.close()
    }
  }

  const callUser = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localVideo.current.srcObject = stream
    localVideo.current.play()

    const call = peer.current.call(remoteId, stream)
    call.on("stream", (stream) => {
      remoteVideo.current.srcObject = stream;
      remoteVideo.current.play()
    });
    call.on("data", (stream) => {
      remoteVideo.current.srcObject = stream;
    });
    call.on("error", (err) => {
      console.error(err);
    });
    call.on('close', () => {
      endCall()
    })

    currentCall.current = call
  }

  return (
    <div>
      <p>Your ID: {localId}</p>
      <input value={remoteId} onChange={e => setRemoteId(e.target.value)} type="text" placeholder="Peer id"/>
      <button onClick={callUser}>Connect</button>

      <div id="live">
        <video ref={localVideo} />
        <video ref={remoteVideo} muted />
        <button id="end-call" onClick={endCall}>End Call</button>
      </div>
    </div>
  );
}

export default App;
