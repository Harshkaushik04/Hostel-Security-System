import {z} from "zod"
import { CustomSchemas } from "../index.js"

export const getRtpCapabilitiesToBackendSchema=z.object({
    type:z.literal("get-rtp-capabilities")
})

export const getRtpCapabilitiesToFrontendSchema=z.object({
    type:z.literal("get-rtp-capabilities"),
    rtpCapabilities:z.any()
})

export const sendConsumerTransportParamsToFrontendSchema=z.object({
    type:z.literal("send-consumer-transport-params"),
    params:z.object({
        id:z.string(),
        iceParameters:z.any(),
        iceCandidates:z.any(),
        dtlsParameters:z.any()
    })
})

export const afterCanConsumeParamsSchema=z.object({
    id:z.string(),
    kind:z.any(),
    producerId:z.string(),
    rtpParameters:z.any()
})

export const invitationToConsumeToFrontendSchema=z.object({
    type:z.literal("invitation-to-consume"),
    params:afterCanConsumeParamsSchema
})

export const errMessageSchema=z.object({
    type:z.literal("error"),
    error:z.string()
})

export const createWebrtcTransportToBackendSchema=z.object({
    type:z.literal("create-webrtc-transport")
})

export const transportRecvConnectToBackendSchema=z.object({
    type:z.literal("transport-recv-connect"),
    transportId:z.string(),
    dtlsParameters:z.any()
})

export const sendDeviceRtpCapabilitiesToBackendSchema=z.object({
    type:z.literal("send-device-rtp-capabilities"),
    rtpCapabilities:z.any()
})

export const consumerResumeToBackendSchema=z.object({
    type:z.literal("consumer-resume")
})

export const wsMessageToBackendSchema=z.union([getRtpCapabilitiesToBackendSchema,errMessageSchema,createWebrtcTransportToBackendSchema,transportRecvConnectToBackendSchema,sendDeviceRtpCapabilitiesToBackendSchema,consumerResumeToBackendSchema])
export const wsMessageToFrontendSchema=z.union([getRtpCapabilitiesToFrontendSchema,errMessageSchema,sendConsumerTransportParamsToFrontendSchema,invitationToConsumeToFrontendSchema])