import * as mediasoup from 'mediasoup';
import WebSocket, { WebSocketServer } from 'ws';
import {CustomSchemas,CustomTypes} from "@my-app/shared"
import * as os from 'os';

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            // Find the first IPv4 address that isn't localhost
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // Fallback
}

const LAN_IP = getLocalIp();
console.log(`[NETWORK] Mediasoup will announce IP: ${LAN_IP}`);

let worker:mediasoup.types.Worker<mediasoup.types.AppData>|null=null;
let router:mediasoup.types.Router<mediasoup.types.AppData>|null=null;
let producer:mediasoup.types.Producer<mediasoup.types.AppData>|null=null;
let plainTransport:mediasoup.types.PlainTransport<mediasoup.types.AppData>|null=null;
let consumerTransport:mediasoup.types.WebRtcTransport<mediasoup.types.AppData>|null=null;
let consumer:mediasoup.types.Consumer<mediasoup.types.AppData>|null=null;

async function run() {
    console.log("Starting Mediasoup Worker...");
    worker = await mediasoup.createWorker({
        logLevel: 'warn',
        rtcMinPort: 40000, 
        rtcMaxPort: 49999
    });

    worker.on('died', () => {
        console.error('Mediasoup Worker died, exiting...');
        process.exit(1);
    });

    router = await worker.createRouter({
        mediaCodecs: [
            {
                kind: 'video',
                mimeType: 'video/H264',
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '42e01f',
                    'level-asymmetry-allowed': 1
                }
            }
        ]
    });

    console.log("Router created successfully.");

    plainTransport = await router.createPlainTransport({
        // Listen on localhost since MediaMTX is on the same machine
        listenIp: { ip: '127.0.0.1'}, 
        rtcpMux: false, // Tell it RTP and RTCP will come on separate ports
        comedia: true  // We know the exact IP sending the data, no need to auto-detect
    });

    console.log(`\n=== INGESTION PORT OPEN ===`);
    console.log(`Send RTP Video to IP: ${plainTransport.tuple.localIp}`);
    console.log(`Send RTP Video to Port: ${plainTransport.tuple.localPort}`);
    console.log(`Send RTCP Telemetry to Port: ${plainTransport.rtcpTuple?.localPort}`);
    console.log(`===========================\n`);
    producer = await plainTransport.produce({
        kind: 'video',
        rtpParameters: {
            codecs: [
                {
                    mimeType: 'video/H264',
                    clockRate: 90000,
                    payloadType: 112,
                    parameters: { 
                        'packetization-mode': 1,
                        'profile-level-id': '42e01f',
                        'level-asymmetry-allowed': 1
                    }
                }
            ],
            encodings: [
                { ssrc: 2222 } 
            ]
        }
    });

    console.log(`\nProducer created! ID: ${producer.id}`);

    setInterval(async () => {
        if(!producer){
            console.log("producer is null");
            return;
        }
        const stats = await producer.getStats();
        const byteCount = stats[0]?.byteCount || 0;
        console.log(`[DATA PLANE] Bytes received: ${byteCount}`);
    }, 2000);
    const wss = new WebSocketServer({ port:2000 });
    wss.on("listening",()=>{
        console.log("WebSocket Server started at port 2000");
    })
    wss.on("connection",async (ws:WebSocket)=>{
        console.log("connection");
        ws.on("message",async (msg:WebSocket.RawData)=>{
            const recv_message=JSON.parse(msg.toString());
            const whetherCorrect=CustomSchemas.sfu.wsMessageToBackendSchema.safeParse(recv_message);
            if(!whetherCorrect.success){
                const err:string="wsMessageSchema not followed by request at server side"
                console.log(err)
                const err_message:CustomTypes.sfu.errMessageType={
                    type:"error",
                    error:err
                }
                ws.send(JSON.stringify(err_message));
            }
            else{
                const json_message:CustomTypes.sfu.wsMessageToBackendType=whetherCorrect.data;
                if(!router){
                    console.log("router is null");
                    return;
                }
                if(json_message.type=="get-rtp-capabilities"){
                    console.log("[get-rtp-capabilities]")
                    const send_message:CustomTypes.sfu.getRtpCapabilitiesToFrontendTypeActual={
                        type:"get-rtp-capabilities",
                        rtpCapabilities:router.rtpCapabilities
                    }
                    ws.send(JSON.stringify(send_message));
                }
                else if(json_message.type=="create-webrtc-transport"){
                    console.log("[create-webrtc-transport]")
                    const webRtcTransport_options = {
                        listenIps: [
                            {
                            ip: '0.0.0.0', // replace with relevant IP address
                            announcedIp: LAN_IP,
                            }
                        ],
                        enableUdp: true,
                        enableTcp: true,
                        preferUdp: true
                    }
                    if(!producer){
                        console.log("producer is null");
                        return;
                    }
                    consumerTransport = await router.createWebRtcTransport(webRtcTransport_options);
                    if(!consumerTransport){
                        console.log("consumerTransport is null");
                        return;
                    }
                    consumerTransport.on('dtlsstatechange', dtlsState => {
                    if (dtlsState === 'closed') {
                        if(!consumerTransport){
                            console.log("consumerTransport is null");
                            return;
                        }
                        consumerTransport.close()
                    }
                    })
                    consumerTransport.on('icestatechange', (iceState) => {
                        if (iceState === 'disconnected' || iceState === 'closed') {
                            console.log('User connection dropped');
                            if(!consumerTransport){
                                console.log("consumerTransport is null");
                                return;
                            }
                            consumerTransport.close(); // Clean it up manually
                        }
                    });
                    const send_message:CustomTypes.sfu.sendConsumerTransportParamsToFrontendTypeActual={
                        type:"send-consumer-transport-params",
                        params:{
                            id:consumerTransport.id,
                            iceParameters:consumerTransport.iceParameters,
                            iceCandidates:consumerTransport.iceCandidates,
                            dtlsParameters:consumerTransport.dtlsParameters
                        }
                    }
                    ws.send(JSON.stringify(send_message));
                }
                else if(json_message.type=="transport-recv-connect"){
                    console.log("[transport-recv-connect")
                    if(!consumerTransport){
                        console.log("consumerTransport is null");
                        return;
                    }
                    const dtlsParameters:mediasoup.types.DtlsParameters=json_message.dtlsParameters;
                    await consumerTransport.connect({dtlsParameters});
                }
                else if(json_message.type=="send-device-rtp-capabilities"){
                    if(!router){
                        console.log("router is null");
                        return;
                    }
                    if(!producer){
                        console.log("producer is null");
                        return;
                    }
                    const rtpCapabilities:mediasoup.types.RtpCapabilities=json_message.rtpCapabilities;
                    if(router.canConsume({
                        producerId:producer.id,
                        rtpCapabilities:rtpCapabilities
                    })){
                        if(!consumerTransport){
                            console.log("consumerTransport is null");
                            return;
                        }
                        consumer = await consumerTransport.consume({
                            producerId:producer.id,
                            rtpCapabilities:rtpCapabilities,
                            paused:true
                        })
                        consumer.on('transportclose', () => {
                            console.log('transport close from consumer')
                        })

                        consumer.on('producerclose', () => {
                            console.log('producer of consumer closed')
                        })
                        const sendParams:CustomTypes.sfu.afterCanConsumeParamsTypeActual={
                            id:consumer.id,
                            kind:consumer.kind,
                            producerId:producer.id,
                            rtpParameters:consumer.rtpParameters
                        }
                        const send_message:CustomTypes.sfu.invitationToConsumeToFrontendType={
                            type:"invitation-to-consume",
                            params:sendParams
                        }
                        ws.send(JSON.stringify(send_message));
                    }
                }
                else if(json_message.type=="consumer-resume"){
                    console.log("[consumer-resume]")
                    if(!consumer){
                        console.log("consumer is null");
                        return;
                    }
                    await consumer.resume();
                }
            }
        })
        ws.on('close', () => {
            consumerTransport?.close();
        });
    })
}
run().catch(console.error);