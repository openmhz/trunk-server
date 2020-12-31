import * as types from '../Call/call-constants'
import * as callActionCreators from "../Call/call-actions"
const setupSocket = (cb, sn, filterType, filterCode) => {
  const shortName = sn
  const socket = new WebSocket(socket_server + '/')
  const callback = cb;
  socket.onopen = () => {
    socket.send(JSON.stringify({
        type: 'add',
        filterCode: filterCode,
        filterType: filterType,
        filterName: "",
        shortName: shortName
    }))
  }
  socket.onmessage = (event) => {
    callback(event.data);
  }

  socket.updateFilter = (filterType,filterCode, filterName) => {
    if (socket.readyState == WebSocket.OPEN) {
    socket.send(JSON.stringify({
        type: 'update',
        filterCode: filterCode,
        filterType: filterType,
        filterName: filterName,
        shortName: shortName
    }))
  }
}
  return socket
}

export default setupSocket
