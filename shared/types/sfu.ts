import {CustomSchemas} from "./../index.js"
import {z} from "zod"
import * as mediasoup from "mediasoup" 
import * as mediasoupClient from "mediasoup-client"
import type { ChildProcess } from "child_process"

export type getRtpCapabilitiesToBackendType = z.infer<typeof CustomSchemas.sfu.getRtpCapabilitiesToBackendSchema>
export type getRtpCapabilitiesToFrontendType = z.infer<typeof CustomSchemas.sfu.getRtpCapabilitiesToFrontendSchema>
export type sendConsumerTransportParamsToFrontendType = z.infer<typeof CustomSchemas.sfu.sendConsumerTransportParamsToFrontendSchema>
export type invitationToConsumeToFrontendType = z.infer<typeof CustomSchemas.sfu.invitationToConsumeToFrontendSchema>
export type errMessageType = z.infer<typeof CustomSchemas.sfu.errMessageSchema>
export type createWebrtcTransportToBackendType = z.infer<typeof CustomSchemas.sfu.createWebrtcTransportToBackendSchema>
export type transportRecvConnectToBackendType = z.infer<typeof CustomSchemas.sfu.transportRecvConnectToBackendSchema>
export type sendDeviceRtpCapabilitiesToBackendType = z.infer<typeof CustomSchemas.sfu.sendDeviceRtpCapabilitiesToBackendSchema>
export type consumerResumeToBackendType = z.infer<typeof CustomSchemas.sfu.consumerResumeToBackendSchema>
export type wsMessageToBackendType = z.infer<typeof CustomSchemas.sfu.wsMessageToBackendSchema>
export type wsMessageToFrontendType = z.infer<typeof CustomSchemas.sfu.wsMessageToFrontendSchema>

export type consumerTransportParamsType={
    id:string,
    iceParameters:mediasoup.types.IceParameters,
    iceCandidates:mediasoup.types.IceCandidate[],
    dtlsParameters:mediasoup.types.DtlsParameters
}

export type sendConsumerTransportParamsToFrontendTypeActual={
    type:"send-consumer-transport-params",
    params:consumerTransportParamsType
}

export type getRtpCapabilitiesToFrontendTypeActual={
    type:"get-rtp-capabilities",
    rtpCapabilities:mediasoup.types.RtpCapabilities
}

export type transportRecvConnectToBackendSchemaActual={
    type:"transport-recv-connect",
    transportId:string,
    dtlsParameters:mediasoupClient.types.DtlsParameters
}

export type afterCanConsumeParamsTypeActual={
    id:string,
    kind:mediasoup.types.MediaKind,
    producerId:string,
    rtpParameters:mediasoup.types.RtpParameters,
    cameraName:string
}

export type streamDetailsType={
    ffmpeg:ChildProcess,
    producer:mediasoup.types.Producer,
    plainTransport:mediasoup.types.PlainTransport,
    assignedRTpPort:number,
    ssrc:number,
    consumer?:mediasoup.types.Consumer
}

export type videoDetailsType={
    consumer?:mediasoupClient.types.Consumer,
    videoRef:React.RefObject<HTMLVideoElement|null>,
    video?:MediaStreamTrack
}

export type mediaMTXResponseType={
    itemCount:number,
    pageCount:number,
    items: [
        {
            name:string,
            confName:string,
            ready:boolean,
            readyTime:string,
            available:boolean,
            availableTime:string,
            online:boolean,
            onlineTime:string,
            source:{
                type:string,
                id:string
            },
            tracks:string[],
            bytesReceived:number,
            bytesSent:number,
            readers:{
                type:string,
                id:string
            }[]
        }
    ]
}