import {useEffect, useRef, useState} from "react";
import Peer from "peerjs";

import styles from './styles.module.scss'

const App = () => {
  const [localId, setLocalId] = useState('');
  const [remoteId, setRemoteId] = useState('');

  const currentCall = useRef();
  const currentConnect = useRef();

  const peer = useRef()

  const localVideo = useRef();
  const remoteVideo = useRef();

  useEffect(() => {
    createPeer()

    return () => {
      endCall()
    }
  }, [])

  const endCall = () => {
    if (currentCall.current) {
      currentCall.current.close()
    }
  }

  const createPeer = () => {
    peer.current = new Peer();
    peer.current.on("open", (id) => {
      setLocalId(id)
    });

    // 纯数据传输
    peer.current.on('connection', (connection) => {
      connection.on('data', (data) => {
        console.log('已接收对方信息', data);
      })
      connection.send('焯！')

      currentConnect.current = connection
    })

    // 媒体传输
    peer.current.on('call', async (call) => {
      if (window.confirm(`是否接受 ${call.peer}?`)) {
        // 获取本地流
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localVideo.current.srcObject = stream
        localVideo.current.play()

        // 响应
        call.answer(stream)

        // 监听视频流，并更新到 remoteVideo 上
        call.on('stream', (stream) => {
          remoteVideo.current.srcObject = stream;
          remoteVideo.current.play()
        })

        currentCall.current = call
      } else {
        call.close()
        alert('已关闭')
      }
    })
  }

  const callUser = async () => {
    // 获取本地视频流
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localVideo.current.srcObject = stream
    localVideo.current.play()

    // 数据传输
    const connection = peer.current.connect(remoteId);
    connection.on('open', () => {
      connection.send('Hi，我是你爹，收到请务必回复！')
    })
    currentConnect.current = connection

    // 多媒体传输
    const call = peer.current.call(remoteId, stream)
    call.on("stream", (stream) => {
      remoteVideo.current.srcObject = stream;
      remoteVideo.current.play()
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
      <p>本地 Peer ID: {localId}</p>
      <input value={remoteId} onChange={e => setRemoteId(e.target.value)} type="text" placeholder="对方 Peer 的 Id"/>
      <button onClick={callUser}>视频通话</button>
      <button id="end-call" onClick={endCall}>结束通话</button>

      <div className={styles.live}>
        <video controls className={styles.localVideo} autoPlay ref={localVideo} />
        <video controls className={styles.remoteVideo} autoPlay ref={remoteVideo} muted />
      </div>
    </div>
  );
}

export default App;
