import {z} from "zod"

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
    rtpParameters:z.any(),
    cameraName:z.string(),
    hostelName:z.string().optional()
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
    rtpCapabilities:z.any(),
    /** @deprecated Ignored when token is present; SFU resolves hostel from JWT + AdminModel */
    allocatedHostel:z.string().optional(),
    /** JWT from admin sign-in — required for hostel-scoped camera access */
    token:z.string().optional(),
})

export const consumerResumeToBackendSchema=z.object({
    type:z.literal("consumer-resume"),
    cameraName:z.string()
})

export const wsMessageToBackendSchema=z.union([getRtpCapabilitiesToBackendSchema,errMessageSchema,createWebrtcTransportToBackendSchema,transportRecvConnectToBackendSchema,sendDeviceRtpCapabilitiesToBackendSchema,consumerResumeToBackendSchema])
export const wsMessageToFrontendSchema=z.union([getRtpCapabilitiesToFrontendSchema,errMessageSchema,sendConsumerTransportParamsToFrontendSchema,invitationToConsumeToFrontendSchema])