import * as mediasoup from 'mediasoup';
import WebSocket, { WebSocketServer } from 'ws';
import {CustomSchemas,CustomTypes} from "@my-app/shared"
import * as os from 'os';
import {spawn,ChildProcess} from "child_process"
import { createServer } from 'http';
import express from 'express';
import cors from "cors"
import console from 'console';
import type { streamDetailsType } from '../../shared/types/sfu.js';
import axios from 'axios';
import type { CursorPos } from 'readline';

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

// const LAN_IP = "10.230.170.57";
const LAN_IP = getLocalIp();
console.log(`[NETWORK] Mediasoup will announce IP: ${LAN_IP}`);

let worker:mediasoup.types.Worker<mediasoup.types.AppData>|null=null;
let router:mediasoup.types.Router<mediasoup.types.AppData>|null=null;

let counter=1;
const initialSsrc=2000;
const initialRtpPort=30000;

let streamRegistry:Map<string,CustomTypes.sfu.streamDetailsType>=new Map<string,CustomTypes.sfu.streamDetailsType>();
let clients:Map<WebSocket,CustomTypes.sfu.clientDetailsType>=new Map<WebSocket,CustomTypes.sfu.clientDetailsType>();

function wait(milsec:number) {
    return new Promise(resolve => {
        setTimeout(resolve, milsec);
    });
}

function printStreamRegistry(streamRegistry:Map<string,CustomTypes.sfu.streamDetailsType>){
    setInterval(()=>{
        console.log("===============================")
        for(const [camerName,streamDetails] of streamRegistry){
            console.log("cameraName:",camerName);
            console.log("ssrc:",streamDetails.ssrc);
            console.log("assignedRTpport:",streamDetails.assignedRTpPort)
        }
        console.log("===============================")
    },5000)
}

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
                    'profile-level-id': '42e028',
                    'level-asymmetry-allowed': 1
                }
            }
        ]
    });

    console.log("Router created successfully.");
    printStreamRegistry(streamRegistry);
    const app=express()
    app.use(cors({
        origin:"*"
    }));
    app.use(express.json());
    const server= createServer(app);
    const wss = new WebSocketServer({server});
    server.listen(2000,()=>{
        console.log("webSocket and http server started at port 2000");
    })
    function startFFmpegBridgeWithArgs(cameraName:string,ssrc:number,plainTransport:mediasoup.types.PlainTransport):ChildProcess {
        console.log("Spawning strictly ONE internal FFmpeg bridge...");
        const ffmpegArgs = [
            '-rtsp_transport', 'tcp',
            '-i', `rtsp://localhost:8554/${cameraName}`,
            '-c:v', 'copy', 
            '-ssrc', `${ssrc}`,
            '-payload_type', '112',
            '-bsf:v', 'dump_extra=freq=keyframe',
            '-f', 'rtp',
            '-pkt_size', '1200',
            `rtp://${plainTransport!.tuple.localIp}:${plainTransport!.tuple.localPort}`
        ];

        let ffmpegProcess:ChildProcess = spawn('ffmpeg', ffmpegArgs);

        ffmpegProcess.stderr?.on('data', (data) => {
            const log = data.toString();
            if (log.includes('Error') || log.includes('Failed') || log.includes('Connection refused')) {
                console.log(`[FFMPEG ALERT]: ${log.trim()}`);
            }
        });

        ffmpegProcess.on('close', (code) => {
            console.log(`FFmpeg died (Code: ${code}). Queuing single restart in 3 seconds...`);
        });
        return ffmpegProcess
    }
    const res = await axios.get("http://localhost:9997/v3/paths/list");
    const responseData:CustomTypes.sfu.mediaMTXResponseType = res.data;
    for(const stream of responseData.items){
        let cameraName=stream.name;
        console.log("[stream-started]:",cameraName)
        if(!router){
            console.log("router is null");
            return;
        }
        let plainTransport = await router.createPlainTransport({
            // Listen on localhost since MediaMTX is on the same machine
            listenIp: { ip: '127.0.0.1'}, 
            rtcpMux: false, // Tell it RTP and RTCP will come on separate ports
            comedia: true  // We know the exact IP sending the data, no need to auto-detect
        });

        console.log(`=== INGESTION PORT OPEN ===`);
        console.log(`Send RTP Video to IP: ${plainTransport.tuple.localIp}`);
        console.log(`Send RTP Video to Port: ${plainTransport.tuple.localPort}`);
        console.log(`Send RTCP Telemetry to Port: ${plainTransport.rtcpTuple?.localPort}`);
        console.log(`===========================\n`);
        let ffmpegProcess: ChildProcess | null = null;
        let ssrc=initialSsrc+counter;
        let assignedRtpPort=initialRtpPort+counter;
        ffmpegProcess=startFFmpegBridgeWithArgs(cameraName,ssrc,plainTransport);
        let producer = await plainTransport.produce({
            kind: 'video',
            rtpParameters: {
                codecs: [
                    {
                        mimeType: 'video/H264',
                        clockRate: 90000,
                        payloadType: 112,
                        parameters: { 
                            'packetization-mode': 1,
                            'profile-level-id': '42e028',
                            'level-asymmetry-allowed': 1
                        }
                    }
                ],
                encodings: [
                    { ssrc: ssrc } 
                ]
            }
        });
        console.log(`\nProducer created! ID: ${producer.id}`);
        const statsInterval=setInterval(async () => {
            if(!producer || producer.closed){
                clearInterval(statsInterval); // Kill this zombie loop permanently
                return;
            }
            try {
                const stats = await producer.getStats();
                const byteCount = stats[0]?.byteCount || 0;
                console.log(`[${cameraName}] Bytes received: ${byteCount}`);
            } catch (error: any) {
                // 3. Catch race-condition errors so they don't crash the server
                console.log(`[${cameraName}] Dropping stats request: ${error.message}`);
                clearInterval(statsInterval);
            }
        }, 3000);
        let streamDetails:CustomTypes.sfu.streamDetailsType={
            ffmpeg:ffmpegProcess,
            producer:producer,
            plainTransport:plainTransport,
            assignedRTpPort:assignedRtpPort,
            ssrc:ssrc
        }
        streamRegistry.set(cameraName,streamDetails);
        counter++;
    }
    wss.on("connection",async (ws:WebSocket)=>{
        console.log("connection");
        clients.set(ws,{
            areConsumersMade:false
        }
        );
        let consumerTransport:mediasoup.types.WebRtcTransport<mediasoup.types.AppData>|null=null;
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
                    console.log("[transport-recv-connect]")
                    if(!consumerTransport){
                        console.log("consumerTransport is null");
                        return;
                    }
                    const dtlsParameters:mediasoup.types.DtlsParameters=json_message.dtlsParameters;
                    //@ts-ignore
                    await consumerTransport.connect({dtlsParameters});
                }
                else if(json_message.type=="send-device-rtp-capabilities"){
                    if(!router){
                        console.log("router is null");
                        return;
                    }
                    const rtpCapabilities:mediasoup.types.RtpCapabilities=json_message.rtpCapabilities;
                    for(const [cameraName,streamDetails] of streamRegistry){
                        const {ffmpeg,
                            producer,
                            plainTransport,
                            assignedRTpPort,
                            ssrc,
                            consumer}=streamDetails;
                        if(!producer){
                            console.log("producer is null");
                            return;
                        }
                        if(router.canConsume({
                            producerId:producer.id,
                            rtpCapabilities:rtpCapabilities
                        })){
                            if(!consumerTransport){
                                console.log("consumerTransport is null");
                                return;
                            }
                            //@ts-ignore
                            let consumer = await consumerTransport.consume({
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
                            streamDetails.consumer=consumer;
                            streamRegistry.set(cameraName,streamDetails);
                            const sendParams:CustomTypes.sfu.afterCanConsumeParamsTypeActual={
                                id:consumer.id,
                                kind:consumer.kind,
                                producerId:producer.id,
                                rtpParameters:consumer.rtpParameters,
                                cameraName:cameraName
                            }
                            console.log("ws: send invitation-to-come: for ",cameraName)
                            const send_message:CustomTypes.sfu.invitationToConsumeToFrontendType={
                                type:"invitation-to-consume",
                                params:sendParams
                            }
                            ws.send(JSON.stringify(send_message));
                        }
                        else console.log("cant consume stream with ssrc",ssrc)
                    }
                }
                else if(json_message.type=="consumer-resume"){
                    console.log("[consumer-resume]")
                    const cameraName:string=json_message.cameraName;
                    const streamDetails:CustomTypes.sfu.streamDetailsType|undefined=streamRegistry.get(cameraName);
                    if(!streamDetails){
                        console.log("streamDetails is undefined")
                        return;
                    }
                    const consumer:mediasoup.types.Consumer|undefined=streamDetails.consumer;
                    if(!consumer){
                        console.log("consumer is undefined");
                        return;
                    }
                    consumer.resume();
                    if(!consumerTransport){
                        console.log("consumerTransport is null");
                        return;
                    }
                    clients.set(ws,{
                        areConsumersMade:true,
                        consumerTransport:consumerTransport
                    });
                }
            }
        })
        ws.on('close', () => {
            consumerTransport?.close();
            clients.delete(ws);
        });
    })
    

    app.get("/stream-started",async (req,res)=>{
        let name=req.query.name;
        let cameraName:string=name as string;
        console.log("[stream-started]")
        if(!router){
            console.log("router is null");
            return;
        }
        let plainTransport = await router.createPlainTransport({
            // Listen on localhost since MediaMTX is on the same machine
            listenIp: { ip: '127.0.0.1'}, 
            rtcpMux: false, // Tell it RTP and RTCP will come on separate ports
            comedia: true  // We know the exact IP sending the data, no need to auto-detect
        });

        console.log(`=== INGESTION PORT OPEN ===`);
        console.log(`Send RTP Video to IP: ${plainTransport.tuple.localIp}`);
        console.log(`Send RTP Video to Port: ${plainTransport.tuple.localPort}`);
        console.log(`Send RTCP Telemetry to Port: ${plainTransport.rtcpTuple?.localPort}`);
        console.log(`===========================\n`);
        let ffmpegProcess: ChildProcess | null = null;
        let ssrc=initialSsrc+counter;
        let assignedRtpPort=initialRtpPort+counter;
        function startFFmpegBridge():ChildProcess {
            console.log("Spawning strictly ONE internal FFmpeg bridge...");
            const ffmpegArgs = [
                '-rtsp_transport', 'tcp',
                '-i', `rtsp://localhost:8554/${cameraName}`,
                '-c:v', 'copy', 
                '-ssrc', `${ssrc}`,
                '-payload_type', '112',
                '-bsf:v', 'dump_extra=freq=keyframe',
                '-f', 'rtp',
                '-pkt_size', '1200',
                `rtp://${plainTransport!.tuple.localIp}:${plainTransport!.tuple.localPort}`
            ];

            let ffmpegProcess:ChildProcess = spawn('ffmpeg', ffmpegArgs);

            ffmpegProcess.stderr?.on('data', (data) => {
                const log = data.toString();
                if (log.includes('Error') || log.includes('Failed') || log.includes('Connection refused')) {
                    console.log(`[FFMPEG ALERT]: ${log.trim()}`);
                }
            });

            ffmpegProcess.on('close', (code) => {
                console.log(`FFmpeg died (Code: ${code}). Queuing single restart in 3 seconds...`);
            });
            return ffmpegProcess
        }
        ffmpegProcess=startFFmpegBridge();
        let producer = await plainTransport.produce({
            kind: 'video',
            rtpParameters: {
                codecs: [
                    {
                        mimeType: 'video/H264',
                        clockRate: 90000,
                        payloadType: 112,
                        parameters: { 
                            'packetization-mode': 1,
                            'profile-level-id': '42e028',
                            'level-asymmetry-allowed': 1
                        }
                    }
                ],
                encodings: [
                    { ssrc: ssrc } 
                ]
            }
        });

        console.log(`\nProducer created! ID: ${producer.id}`);

        const statsInterval=setInterval(async () => {
            if(!producer || producer.closed){
                clearInterval(statsInterval); // Kill this zombie loop permanently
                return;
            }
            try {
                const stats = await producer.getStats();
                const byteCount = stats[0]?.byteCount || 0;
                console.log(`[${cameraName}] Bytes received: ${byteCount}`);
            } catch (error: any) {
                // 3. Catch race-condition errors so they don't crash the server
                console.log(`[${cameraName}] Dropping stats request: ${error.message}`);
                clearInterval(statsInterval);
            }
        }, 3000);
        let streamDetails:CustomTypes.sfu.streamDetailsType={
            ffmpeg:ffmpegProcess,
            producer:producer,
            plainTransport:plainTransport,
            assignedRTpPort:assignedRtpPort,
            ssrc:ssrc
        }
        streamRegistry.set(cameraName,streamDetails);
        counter++;
        for(const [ws,clientDetails] of clients){
            console.log("[get-rtp-capabilities]")
            if(!clientDetails.areConsumersMade){
                const send_message:CustomTypes.sfu.getRtpCapabilitiesToFrontendTypeActual={
                    type:"get-rtp-capabilities",
                    rtpCapabilities:router.rtpCapabilities
                }
                ws.send(JSON.stringify(send_message));
            }
            else{
                if(router.canConsume({
                    producerId:producer.id,
                    rtpCapabilities:router.rtpCapabilities
                })){
                    let clientDetails:CustomTypes.sfu.clientDetailsType|undefined=clients.get(ws);
                    if(!clientDetails){
                        console.log("clientDetails is null");
                        return;
                    }
                    let consumerTransport:mediasoup.types.WebRtcTransport|undefined=clientDetails.consumerTransport;
                    if(!consumerTransport){
                        console.log("consumerTransport is undefined");
                        return;
                    }
                    let consumer = await consumerTransport.consume({
                        producerId:producer.id,
                        rtpCapabilities:router.rtpCapabilities,
                        paused:true
                    })
                    consumer.on('transportclose', () => {
                        console.log('transport close from consumer')
                    })

                    consumer.on('producerclose', () => {
                        console.log('producer of consumer closed')
                    })
                    streamDetails.consumer=consumer;
                    streamRegistry.set(cameraName,streamDetails);
                    const sendParams:CustomTypes.sfu.afterCanConsumeParamsTypeActual={
                        id:consumer.id,
                        kind:consumer.kind,
                        producerId:producer.id,
                        rtpParameters:consumer.rtpParameters,
                        cameraName:cameraName
                    }
                    console.log("/stream-started: send invitation-to-consume for ",cameraName)
                    const send_message:CustomTypes.sfu.invitationToConsumeToFrontendType={
                        type:"invitation-to-consume",
                        params:sendParams
                    }
                    ws.send(JSON.stringify(send_message));
                }
                else console.log("cant consume stream with ssrc",ssrc)
            }
        }
        res.sendStatus(200);
    })
    app.get("/stream-stopped",(req,res)=>{
        console.log("[stream-ended]")
        const name=req.query.name;
        const cameraName:string=name as string;
        const streamDetails:streamDetailsType|undefined=streamRegistry.get(cameraName);
        if(!streamDetails){
            console.log("streamDetails is undefined");
            return;
        }
        streamDetails.ffmpeg.kill("SIGKILL");
        streamDetails.producer.close();
        streamDetails.plainTransport.close();
        streamRegistry.delete(cameraName);
        res.sendStatus(200);
    })
}
run().catch(console.error);


/*
api: http://localhost:9997/v3/paths/list

mediaMTX server http response example:
{
    "itemCount": 2,
    "pageCount": 1,
    "items": [
        {
            "name": "camera1",
            "confName": "all_others",
            "ready": true,
            "readyTime": "2026-03-19T19:11:30.826544272+05:30",
            "available": true,
            "availableTime": "2026-03-19T19:11:30.826544272+05:30",
            "online": true,
            "onlineTime": "2026-03-19T19:11:30.826544422+05:30",
            "source": {
                "type": "rtspSession",
                "id": "a1dcd1b2-bb82-488e-b75e-c43bbbc08e24"
            },
            "tracks": [
                "H264"
            ],
            "bytesReceived": 4246579,
            "bytesSent": 4246579,
            "readers": [
                {
                    "type": "rtspSession",
                    "id": "cd3343a1-41eb-45a5-81e7-b1c4f1517b21"
                }
            ]
        },
        {
            "name": "camera2",
            "confName": "all_others",
            "ready": true,
            "readyTime": "2026-03-19T19:11:47.278748763+05:30",
            "available": true,
            "availableTime": "2026-03-19T19:11:47.278748763+05:30",
            "online": true,
            "onlineTime": "2026-03-19T19:11:47.278748803+05:30",
            "source": {
                "type": "rtspSession",
                "id": "3d6aa007-1050-45b0-9c38-a8aaaacd1a96"
            },
            "tracks": [
                "H264"
            ],
            "bytesReceived": 22048,
            "bytesSent": 18222,
            "readers": [
                {
                    "type": "rtspSession",
                    "id": "cb7960b2-e3c7-4438-9421-159424583a61"
                }
            ]
        }
    ]
}
 */