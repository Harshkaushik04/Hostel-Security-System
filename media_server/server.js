/**
 * Media server (SFU) for WebRTC live streams - port 4000
 * Uses mediasoup + Socket.io for signaling
 */
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import * as mediasoup from 'mediasoup'

const PORT = 4000

const mediaCodecs = [
  { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
  { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
]

let worker
let router
const producerMap = new Map()
const transportMap = new Map()

async function run() {
  worker = await mediasoup.createWorker({ logLevel: 'warn' })
  router = await worker.createRouter({ mediaCodecs })
  console.log('mediasoup router ready')

  const app = express()
  const httpServer = createServer(app)
  const io = new Server(httpServer, {
    cors: { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] },
  })

  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id)

    socket.on('getRouterRtpCapabilities', (_, cb) => {
      try {
        cb({ rtpCapabilities: router.rtpCapabilities })
      } catch (e) {
        cb({ error: e.message })
      }
    })

    socket.on('createSendTransport', async (_, cb) => {
      try {
        const transport = await router.createWebRtcTransport({
          listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
        })
        transportMap.set(transport.id, transport)
        socket.on('disconnect', () => { transport.close(); transportMap.delete(transport.id) })
        cb({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        })
      } catch (e) {
        cb({ error: e.message })
      }
    })

    socket.on('createRecvTransport', async (_, cb) => {
      try {
        const transport = await router.createWebRtcTransport({
          listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
        })
        transportMap.set(transport.id, transport)
        socket.on('disconnect', () => { transport.close(); transportMap.delete(transport.id) })
        cb({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        })
      } catch (e) {
        cb({ error: e.message })
      }
    })

    socket.on('connectSendTransport', async ({ transportId, dtlsParameters }, cb) => {
      try {
        const transport = transportMap.get(transportId)
        if (!transport) throw new Error('transport not found')
        await transport.connect({ dtlsParameters })
        cb({})
      } catch (e) {
        cb({ error: e.message })
      }
    })

    socket.on('connectRecvTransport', async ({ transportId, dtlsParameters }, cb) => {
      try {
        const transport = transportMap.get(transportId)
        if (!transport) throw new Error('transport not found')
        await transport.connect({ dtlsParameters })
        cb({})
      } catch (e) {
        cb({ error: e.message })
      }
    })

    socket.on('produce', async ({ transportId, kind, rtpParameters, appData }, cb) => {
      try {
        const transport = transportMap.get(transportId)
        if (!transport) throw new Error('transport not found')
        const producer = await transport.produce({
          kind,
          rtpParameters,
          appData: appData || {},
        })
        producerMap.set(producer.id, { producer, transport })
        producer.on('transportclose', () => producerMap.delete(producer.id))
        io.emit('newProducer', { producerId: producer.id, kind, appData: producer.appData })
        cb({ id: producer.id })
      } catch (e) {
        cb({ error: e.message })
      }
    })

    socket.on('getProducers', (_, cb) => {
      cb({
        producerIds: Array.from(producerMap.keys()),
      })
    })

    socket.on('consume', async ({ transportId, producerId, rtpCapabilities }, cb) => {
      try {
        if (!router.canConsume({ producerId, rtpCapabilities })) {
          throw new Error('cannot consume')
        }
        const transport = transportMap.get(transportId)
        if (!transport) throw new Error('transport not found')
        const { producer } = producerMap.get(producerId) || {}
        if (!producer) throw new Error('producer not found')
        const consumer = await transport.consume({
          producerId,
          rtpCapabilities,
          paused: true,
        })
        await consumer.resume()
        cb({
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        })
      } catch (e) {
        cb({ error: e.message })
      }
    })
  })

  httpServer.listen(PORT, () => {
    console.log(`media server listening on port ${PORT}`)
  })
}

run().catch(console.error)
