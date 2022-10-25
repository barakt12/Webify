const logger = require('./logger.service')
const wapService = require('../api/wap/wap.service')
const userService = require('../api/user/user.service')

let gIo = null

let mouseColors = [
  '#FF8B82',
  '#FFBC04',
  '#CFFF90',
  '#AFFFEB',
  '#CFF0F8',
  '#FFE4DE',
  '#DFAEFB',
  '#FFCFE8',
  '#EFC9A8',
]

function setupSocketAPI(http) {
  gIo = require('socket.io')(http, {
    cors: {
      origin: '*',
    },
  })
  gIo.on('connection', (socket) => {
    logger.info(`New connected socket [id: ${socket.id}]`)
    socket.on('disconnect', () => {
      broadcast({
        type: 'user_left',
        data: { userId: socket.id },
        room: socket.currEditorId,
        userId: socket.id,
      })
      logger.info(`Socket disconnected [id: ${socket.id}]`)
    })

    socket.on('user_logged', (userId) => {
      if (socket.userId === userId) return
      if (socket.userId) {
        socket.leave(socket.userId)
        logger.info(`Socket is leaving room ${socket.userId} [id: ${userId}]`)
      }
      socket.join(userId)
      socket.userId = userId
    })

    socket.on('wap connection', (editorId) => {
      if (socket.currEditorId === editorId) {
        return
      }
      if (socket.currEditorId) {
        socket.leave(socket.currEditorId)
        logger.info(
          `Socket is leaving room ${socket.currEditorId} [id: ${socket.id}]`
        )
      }
      socket.join(editorId)
      socket.currEditorId = editorId
      if (!mouseColors.length) {
        mouseColors = [
          '#FF8B82',
          '#FFBC04',
          '#CFFF90',
          '#AFFFEB',
          '#CFF0F8',
          '#FFE4DE',
          '#DFAEFB',
          '#FFCFE8',
          '#EFC9A8',
        ]
      }
      const color = mouseColors.splice(
        Math.floor(Math.random() * mouseColors.length),
        1
      )[0]
      socket.mouseColor = color
      broadcast({
        type: 'get wap',
        room: socket.currEditorId,
        userId: socket.id,
      })
    })

    socket.on('wap update', (wap) => {
      logger.info(
        `Wap update from socket [id: ${socket.id}], emitting wap changes to ${socket.currEditorId}`
      )
      broadcast({
        type: 'wap update',
        data: wap,
        room: socket.currEditorId,
        userId: socket.id,
      })
    })

    socket.on('subscribed', (wapId) => {
      logger.info(`New subscription from [id: ${socket.id}], in wap ${wapId}`)
      const wapOwner = wapService.getById(wapId).createdBy
      const ownerId = userService.getUser({ email: wapOwner })._id
      broadcast({
        type: 'new_subscriber',
        data: null,
        room: ownerId,
        userId: socket.id,
      })
    })

    socket.on('set-user-socket', (userId) => {
      logger.info(
        `Setting socket.userId = ${userId} for socket [id: ${socket.id}]`
      )
      socket.userId = userId
    })
    socket.on('unset-user-socket', () => {
      logger.info(`Removing socket.userId for socket [id: ${socket.id}]`)
      delete socket.userId
    })
    //mouse movement
    socket.on('mouse_position', ({ pos, user }) => {
      
      broadcast({
        type: 'mouse_position_update',
        data: { id: socket.id, pos, user, color: socket.mouseColor },
        room: socket.currEditorId,
        userId: socket.id,
      })
    })
    socket.on('dashboard connection', (publishId) => {
      if (socket.currPublishId === publishId) return
      // if (socket.currEditorId) {
      //   socket.leave(socket.currEditorId)
      //   logger.info(`Socket is leaving room ${socket.currEditorId} [id: ${socket.id}]`)
      // }
      socket.join(publishId)
      socket.currPublishId = publishId
    })
    socket.on('dashboard update', (wap) => {
      // console.log('got dashboard update',wap)
      broadcast({
        type: 'dashboard update',
        data: wap,
        room: wap._id,
        userId: socket.id,
      })
    })
  })
}

function emitTo({ type, data, label }) {
  if (label) gIo.to('watching:' + label).emit(type, data)
  else gIo.emit(type, data)
}

async function emitToUser({ type, data, userId }) {
  const socket = await _getUserSocket(userId)

  if (socket) {
    logger.info(
      `Emiting event: ${type} to user: ${userId} socket [id: ${socket.id}]`
    )
    socket.emit(type, data)
  } else {
    logger.info(`No active socket for user: ${userId}`)
    // _printSockets()
  }
}

// If possible, send to all sockets BUT not the current socket
// Optionally, broadcast to a room / to all
async function broadcast({ type, data, room = null, userId }) {
  // console.log({ type, data, room, userId })
  logger.info(`Broadcasting event: ${type}`)
  const excludedSocket = await _getUserSocket(userId)
  if (room && excludedSocket) {
    logger.info(`Broadcast to room ${room} excluding user: ${userId}`)
    excludedSocket.broadcast.to(room).emit(type, data)
  } else if (excludedSocket) {
    logger.info(`Broadcast to all excluding user: ${userId}`)
    excludedSocket.broadcast.emit(type, data)
  } else if (room) {
    logger.info(`Emit to room: ${room}`)
    gIo.to(room).emit(type, data)
  } else {
    logger.info(`Emit to all`)
    gIo.emit(type, data)
  }
}

async function _getUserSocket(userId) {
  const sockets = await _getAllSockets()
  // console.log(sockets.map((socket) => socket.id))
  const socket = sockets.find((s) => s.id === userId)
  return socket
}
async function _getAllSockets() {
  // return all Socket instances
  const sockets = await gIo.fetchSockets()
  return sockets
}

async function _printSockets() {
  const sockets = await _getAllSockets()
  console.log(`Sockets: (count: ${sockets.length}):`)
  sockets.forEach(_printSocket)
}
function _printSocket(socket) {
  console.log(`Socket - socketId: ${socket.id} userId: ${socket.userId}`)
}

module.exports = {
  // set up the sockets service and define the API
  setupSocketAPI,
  // emit to everyone / everyone in a specific room (label)
  emitTo,
  // emit to a specific user (if currently active in system)
  emitToUser,
  // Send to all sockets BUT not the current socket - if found
  // (otherwise broadcast to a room / to all)
  broadcast,
}
