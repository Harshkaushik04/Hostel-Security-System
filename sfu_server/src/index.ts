import * as mediasoup from 'mediasoup';

async function run() {
    console.log("Starting Mediasoup Worker...");

    // 1. Spawn the C++ Worker thread
    const worker = await mediasoup.createWorker({
        logLevel: 'warn',
        rtcMinPort: 40000, // The port range Mediasoup is allowed to use
        rtcMaxPort: 49999
    });

    worker.on('died', () => {
        console.error('Mediasoup Worker died, exiting...');
        process.exit(1);
    });

    // 2. Create the Router (The logical room)
    // We MUST define the codec we expect to receive from MediaMTX (H.264)
    const router = await worker.createRouter({
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

    // 3. Create the PlainTransport (The Ingestion Port)
    const plainTransport = await router.createPlainTransport({
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
    // 4. Create the Producer (Tell Mediasoup to accept the video)
    const producer = await plainTransport.produce({
        kind: 'video',
        rtpParameters: {
            codecs: [
                {
                    mimeType: 'video/H264',
                    clockRate: 90000,
                    payloadType: 112,
                    parameters: { // <--- THESE MUST MATCH THE ROUTER EXACTLY
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

    // 5. The Ultimate Proof of Life (Check C++ memory stats)
    setInterval(async () => {
        const stats = await producer.getStats();
        const byteCount = stats[0]?.byteCount || 0;
        console.log(`[DATA PLANE] Bytes received: ${byteCount}`);
    }, 2000);
}

run().catch(console.error);