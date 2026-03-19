import { createRef, useEffect, useRef, useState } from "react"
import * as mediasoupClient from "mediasoup-client"
import {CustomSchemas,CustomTypes} from "@my-app/shared"
import type { videoDetailsType } from "../../../shared/types/sfu";
export function Landing(){
    const [buttonPressed,setButtonPressed]=useState<boolean>(false);
    const [socket,setSocket]=useState<WebSocket|null>(null);
    const [device,setDevice]=useState<mediasoupClient.types.Device|null>(null);
    const [consumerTransport,setConsumerTransport]=useState<mediasoupClient.types.Transport<mediasoupClient.types.AppData>|null>(null);
    const [connectedToSfu,setConnectedToSfu]=useState<boolean>(false);
    const numCameras=10;
    const mpp:Map<number,CustomTypes.sfu.videoDetailsType>=new Map<number,CustomTypes.sfu.videoDetailsType>();
    let videosRegistry:React.RefObject<Map<number,CustomTypes.sfu.videoDetailsType>|null>=useRef<Map<number,CustomTypes.sfu.videoDetailsType>>(mpp);
    let actualVideoRegistry=videosRegistry.current;
    const [render,setRender]=useState<boolean>(false);

    function forceRender(){
        if(render) setRender(false);
        else setRender(true);
    }

    function wait(milsec:number) {
    return new Promise(resolve => {
        setTimeout(resolve, milsec);
    });
}
/**
  let clientDetails:CustomTypes.sfu.clientDetailsType|undefined=clients.get(ws);
                    if(!clientDetails){
                        console.log("clientDetails is undefined");
                        return;
                    }
                    let mpp:Map<string,mediasoup.types.Consumer>=clientDetails.consumers;
                    mpp.set(cameraName,consumer);
                    clients.set(ws,{
                        areConsumersMade:true,
                        consumerTransport:consumerTransport
                    });
 */

    if(actualVideoRegistry && actualVideoRegistry.size===0){
        for(let i=0;i<numCameras;i++){
            let remoteVideoRef:React.RefObject<HTMLVideoElement|null>=createRef<HTMLVideoElement>();
            let cameraNumber:number=i+1;
            if(!actualVideoRegistry){
                console.log("actualVideoRegistry is null");
                return <></>
            }
            actualVideoRegistry.set(cameraNumber,{
                videoRef:remoteVideoRef
            });
        }
    }
    function pressButton(){
        setButtonPressed(true);
        if(!socket){
            console.log("socket is null");
            return;
        }
        const json_message:CustomTypes.sfu.getRtpCapabilitiesToBackendType={
            type:"get-rtp-capabilities"
        }
        console.log("[button-pressed]")
        socket.send(JSON.stringify(json_message));
    }
    useEffect(()=>{
        const ws=new WebSocket("ws://127.0.0.1:2000");
        setSocket(ws);
        return ()=> ws.close();
    },[])
    useEffect(()=>{
        const dev:mediasoupClient.types.Device=new mediasoupClient.Device();
        setDevice(dev);
    },[])
    useEffect(()=>{
        if(!socket) return;
        socket.onmessage=async (msg:MessageEvent<string>)=>{
            console.log("[A message recieved]");
            const recv_message=JSON.parse(msg.data);
            const whetherCorrect=CustomSchemas.sfu.wsMessageToFrontendSchema.safeParse(recv_message);
            if(!whetherCorrect.success){
                const err:string="message recieved from server not matching socketMessageToFrontendSchema"
                console.log(err)
                const err_message:CustomTypes.sfu.errMessageType={
                    type:"error",
                    error:err
                }
                socket.send(JSON.stringify(err_message))
            }
            else{
                const json_message:CustomTypes.sfu.wsMessageToFrontendType=whetherCorrect.data;
                if(json_message.type=="get-rtp-capabilities"){
                    console.log("[get-rtp-capabilities]")
                    if(!device){
                        console.log("device is null");
                        return;
                    }
                    if(!connectedToSfu){
                        await device.load({
                            routerRtpCapabilities:json_message.rtpCapabilities
                        })
                    }
                    const send_message:CustomTypes.sfu.createWebrtcTransportToBackendType={
                        type:"create-webrtc-transport"
                    }
                    socket.send(JSON.stringify(send_message))
                    setConnectedToSfu(true);
                }
                else if(json_message.type=="send-consumer-transport-params"){
                    console.log("[send-consumer-transport-params]")
                    const params:CustomTypes.sfu.consumerTransportParamsType=json_message.params;
                    if(!device){
                        console.log("device is null");
                        return;
                    }
                    const transport=device.createRecvTransport(params);
                    setConsumerTransport(transport);
                    transport.on("connect", async ({ dtlsParameters }, callback, errback) =>{
                        try{
                            const send_message:CustomTypes.sfu.transportRecvConnectToBackendSchemaActual={
                                type:"transport-recv-connect",
                                transportId:transport.id,
                                dtlsParameters:dtlsParameters
                            }
                            socket.send(JSON.stringify(send_message));
                            // Tell the transport that parameters were transmitted.
                            callback();
                        }catch (error){
                            // Tell the transport that something was wrong.
                            const e = error as Error;
                            errback(e);
                        }
                    });
                    const send_message:CustomTypes.sfu.sendDeviceRtpCapabilitiesToBackendType={
                        type:"send-device-rtp-capabilities",
                        rtpCapabilities:device.recvRtpCapabilities
                    }
                    socket.send(JSON.stringify(send_message));
                }
                else if(json_message.type=="error"){
                    console.log("[error]")
                    const error:string=json_message.error;
                    console.log("error came from backend:",error);
                }
                else if(json_message.type=="invitation-to-consume"){
                    console.log("[invitation-to-consume]")
                    const params:CustomTypes.sfu.afterCanConsumeParamsTypeActual=json_message.params;
                    if(!consumerTransport){
                        console.log("consumerTransport is null");
                        return;
                    }
                    const cons:mediasoupClient.types.Consumer<mediasoupClient.types.AppData> = await consumerTransport.consume(params);
                    const cameraName:string=params.cameraName;
                    console.log("consume for:",cameraName)
                    const cameraNumber:number=Number(cameraName.slice(6));
                    const {track}=cons;
                    if(!actualVideoRegistry){
                        console.log("actualVideoRegistry is null");
                        return;
                    }
                    const videoDetails:videoDetailsType|undefined=actualVideoRegistry.get(cameraNumber);
                    if(!videoDetails){
                        console.log("videoDetails is undefined");
                        return;
                    }
                    videoDetails.consumer=cons;
                    videoDetails.video=track;
                    actualVideoRegistry.set(cameraNumber,videoDetails);
                    const numCamerasAllowed:number=numCameras;
                    if(cameraNumber<=numCamerasAllowed){
                        const actualVideoRefDetails = actualVideoRegistry.get(cameraNumber);
                        const actualVideoRef = actualVideoRefDetails?.videoRef;
                        const actualVideoElement = actualVideoRef?.current;
                        
                        if(!actualVideoElement){
                            console.log("actualVideoElement is null");
                            return;
                        }

                        // 1. Assign the stream directly. 
                        actualVideoElement.srcObject = new MediaStream([track]);

                        // 2. Wrap the manual play in a tiny timeout so the MediaStream has time to attach,
                        // though autoPlay will likely handle it automatically now.
                        setTimeout(() => {
                            actualVideoElement.play().catch(e => {
                                console.log("Play warning (safe to ignore if video is rendering):", e.message);
                            });
                        }, 50);

                        // 3. Keep React state in sync (React will now safely ignore the video DOM nodes)
                        forceRender(); 
                        
                        // 4. Tell the backend to resume sending packets
                        const send_message = {
                            type: "consumer-resume",
                            cameraName: cameraName
                        };
                        socket.send(JSON.stringify(send_message));
                    }
                    else return;
                }
            }
        }
    },[socket,device,consumerTransport])
    return(<>
        <button disabled={buttonPressed} onClick={pressButton}>recieve video</button>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {actualVideoRegistry ? Array.from(actualVideoRegistry.entries())
        .map(([id, d]) => (
            <video 
                key={id} 
                ref={d.videoRef} 
                muted 
                autoPlay 
                playsInline 
                style={{ 
                    display: "block",
                    width: "320px",  
                    height: "240px",
                    backgroundColor: "#111" 
                }} 
            />
        )) : null}
    </div>
    </>)
}
