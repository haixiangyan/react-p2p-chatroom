import {useEffect, useRef, useState} from "react";
import Peer from "peerjs";

import styles from './styles.module.scss'
import {Button, Col, Input, List, message, Row, Space, Spin, Tag} from "antd";

const { TextArea } = Input;

const App = () => {
  const [loading, setLoading] = useState(true);

  const [localId, setLocalId] = useState('');
  const [remoteId, setRemoteId] = useState('');

  const [messages, setMessages] = useState([]);
  const [customMsg, setCustomMsg] = useState('');

  const currentCall = useRef();
  const currentConnection = useRef();

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
      setLoading(false)
    });

    // 纯数据传输
    peer.current.on('connection', (connection) => {
      // 接受对方传来的数据
      connection.on('data', (data) => {
        setMessages((curtMessages) => [
          ...curtMessages,
          { id: curtMessages.length + 1, type: 'remote', data }
        ])
      })

      currentConnection.current = connection
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
    currentConnection.current = connection
    connection.on('open', () => {
      message.info('已连接')
    })

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

  const sendMsg = () => {
    // 发送自定义内容
    if (!currentConnection.current) {
      message.warn('还未建立链接')
    }
    if (!customMsg) {
      return;
    }
    currentConnection.current.send(customMsg)
    setMessages((curtMessages) => [
      ...curtMessages,
      { id: curtMessages.length + 1, type: 'local', data: customMsg }
    ])
    setCustomMsg('');
  }

  return (
    <div className={styles.container}>
      <h1>本地 Peer ID: {localId || <Spin spinning={loading} />}</h1>

      <div>
        <Space>
          <Input value={remoteId} onChange={e => setRemoteId(e.target.value)} type="text" placeholder="对方 Peer 的 Id"/>
          <Button type="primary" onClick={callUser}>视频通话</Button>
          <Button type="primary" danger onClick={endCall}>结束通话</Button>
        </Space>
      </div>

      <Row gutter={16} className={styles.live}>
        <Col span={12}>
          <h2>本地摄像头</h2>
          <video controls autoPlay ref={localVideo} muted />
        </Col>
        <Col span={12}>
          <h2>远程摄像头</h2>
          <video controls autoPlay ref={remoteVideo} />
        </Col>
      </Row>

      <h1>发送消息</h1>
      <div>
        <h2>消息列表</h2>
        <List
          itemLayout="horizontal"
          dataSource={messages}
          renderItem={msg => (
            <List.Item key={msg.id}>
              <div>
                <span>{msg.type === 'local' ? <Tag color="red">我</Tag> : <Tag color="green">对方</Tag>}</span>
                <span>{msg.data}</span>
              </div>
            </List.Item>
          )}
        />

        <h2>自定义消息</h2>
        <TextArea
          placeholder="发送自定义内容"
          value={customMsg}
          onChange={e => setCustomMsg(e.target.value)}
          onEnter={sendMsg}
          rows={4}
        />
        <Button
          disabled={!customMsg}
          type="primary"
          onClick={sendMsg}
          style={{ marginTop: 16 }}>
          发送
        </Button>
      </div>
    </div>
  );
}

export default App;
