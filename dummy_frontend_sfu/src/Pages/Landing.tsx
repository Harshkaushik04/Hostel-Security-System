import { useEffect, useRef, useState } from "react"
import * as mediasoupClient from "mediasoup-client"
import {CustomSchemas,CustomTypes} from "@my-app/shared"
import type { videoDetailsType } from "../../../shared/types/sfu";
export function Landing(){
    const [buttonPressed,setButtonPressed]=useState<boolean>(false);
    const [socket,setSocket]=useState<WebSocket|null>(null);
    const [device,setDevice]=useState<mediasoupClient.types.Device|null>(null);
    const [consumerTransport,setConsumerTransport]=useState<mediasoupClient.types.Transport<mediasoupClient.types.AppData>|null>(null);
    const numCameras=10;
    let videosRegistry:Map<number,CustomTypes.sfu.videoDetailsType>=new Map<number,CustomTypes.sfu.videoDetailsType>();

    for(let i=0;i<numCameras;i++){
        let remoteVideoRef:React.RefObject<HTMLVideoElement|null>=useRef<HTMLVideoElement>(null);
        let cameraNumber:number=i+1;
        videosRegistry.set(cameraNumber,{
            videoRef:remoteVideoRef
        });
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
                    const dev:mediasoupClient.types.Device=new mediasoupClient.Device();
                    setDevice(dev);
                    await dev.load({
                        routerRtpCapabilities:json_message.rtpCapabilities
                    });
                    const send_message:CustomTypes.sfu.createWebrtcTransportToBackendType={
                        type:"create-webrtc-transport"
                    }
                    socket.send(JSON.stringify(send_message))
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
                    const cameraNumber:number=Number(cameraName.slice(6));
                    const {track}=cons;
                    const videoDetails:videoDetailsType|undefined=videosRegistry.get(cameraNumber);
                    if(!videoDetails){
                        console.log("videoDetails is undefined");
                        return;
                    }
                    videoDetails.consumer=cons;
                    videoDetails.video=track;
                    videosRegistry.set(cameraNumber,videoDetails);
                    const numCamerasAllowed:number=numCameras;
                    if(cameraNumber<=numCamerasAllowed){
                        const actualVideoRefDetails:CustomTypes.sfu.videoDetailsType|undefined=videosRegistry.get(cameraNumber);
                        if(!actualVideoRefDetails){
                            console.log("actualVideoRefDetails is undefined")
                            return;
                        }
                        const actualVideoRef:React.RefObject<HTMLVideoElement|null>|undefined=actualVideoRefDetails.videoRef;
                        if(!actualVideoRef){
                            console.log("remoteVideoRef is null");
                            return;
                        }
                        if(!actualVideoRef){
                            console.log("actualVideoRef is null");
                            return;
                        }
                        const actualVideoElement:HTMLVideoElement|null=actualVideoRef.current;
                        if(!actualVideoElement){
                            console.log("actualVideoElement is null");
                            return;
                        }
                        actualVideoElement.srcObject = new MediaStream([track]);
                        const send_message:CustomTypes.sfu.consumerResumeToBackendType={
                            type:"consumer-resume",
                            cameraName:cameraName
                        }
                        socket.send(JSON.stringify(send_message))
                    }
                    else return;
                }
            }
        }
    },[socket,device,consumerTransport])
    return(<>
        <button disabled={buttonPressed} onClick={pressButton}>recieve video</button>
        {Array.from(videosRegistry.entries())
        .filter(([_, d]) => d.video)
        .map(([id, d]) => (
            <video key={id} ref={d.videoRef} autoPlay playsInline />
        ))}
    </>)
}