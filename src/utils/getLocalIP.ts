export function getLocalIP() {
  return new Promise((resolve, reject) => {
    window.RTCPeerConnection =
    // @ts-ignore
      window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection

    if (!window.RTCPeerConnection) {
      reject(new Error('Your browser does not support WebRTC. Cannot get local IP.'))
      return
    }

    const pc = new RTCPeerConnection({ iceServers: [] })
    pc.createDataChannel('')

    pc.onicecandidate = ice => {
      if (!ice || !ice.candidate || !ice.candidate.candidate) return

      const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(
        ice.candidate.candidate
      )[1]
      resolve(myIP)

      // 清理
      pc.onicecandidate = null
      pc.close()
    }

    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(err => reject(err))

    // 设置超时
    setTimeout(() => {
      reject(new Error('Timeout while getting local IP'))
      pc.close()
    }, 5000) // 5秒超时
  })
}