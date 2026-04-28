import { z } from "zod";
export declare const getRtpCapabilitiesToBackendSchema: z.ZodObject<{
    type: z.ZodLiteral<"get-rtp-capabilities">;
}, z.core.$strip>;
export declare const getRtpCapabilitiesToFrontendSchema: z.ZodObject<{
    type: z.ZodLiteral<"get-rtp-capabilities">;
    rtpCapabilities: z.ZodAny;
}, z.core.$strip>;
export declare const sendConsumerTransportParamsToFrontendSchema: z.ZodObject<{
    type: z.ZodLiteral<"send-consumer-transport-params">;
    params: z.ZodObject<{
        id: z.ZodString;
        iceParameters: z.ZodAny;
        iceCandidates: z.ZodAny;
        dtlsParameters: z.ZodAny;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const afterCanConsumeParamsSchema: z.ZodObject<{
    id: z.ZodString;
    kind: z.ZodAny;
    producerId: z.ZodString;
    rtpParameters: z.ZodAny;
    cameraName: z.ZodString;
}, z.core.$strip>;
export declare const invitationToConsumeToFrontendSchema: z.ZodObject<{
    type: z.ZodLiteral<"invitation-to-consume">;
    params: z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodAny;
        producerId: z.ZodString;
        rtpParameters: z.ZodAny;
        cameraName: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const errMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"error">;
    error: z.ZodString;
}, z.core.$strip>;
export declare const createWebrtcTransportToBackendSchema: z.ZodObject<{
    type: z.ZodLiteral<"create-webrtc-transport">;
}, z.core.$strip>;
export declare const transportRecvConnectToBackendSchema: z.ZodObject<{
    type: z.ZodLiteral<"transport-recv-connect">;
    transportId: z.ZodString;
    dtlsParameters: z.ZodAny;
}, z.core.$strip>;
export declare const sendDeviceRtpCapabilitiesToBackendSchema: z.ZodObject<{
    type: z.ZodLiteral<"send-device-rtp-capabilities">;
    rtpCapabilities: z.ZodAny;
    allocatedHostel: z.ZodOptional<z.ZodString>;
    token: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const consumerResumeToBackendSchema: z.ZodObject<{
    type: z.ZodLiteral<"consumer-resume">;
    cameraName: z.ZodString;
}, z.core.$strip>;
export declare const wsMessageToBackendSchema: z.ZodUnion<readonly [z.ZodObject<{
    type: z.ZodLiteral<"get-rtp-capabilities">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"error">;
    error: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"create-webrtc-transport">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"transport-recv-connect">;
    transportId: z.ZodString;
    dtlsParameters: z.ZodAny;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"send-device-rtp-capabilities">;
    rtpCapabilities: z.ZodAny;
    allocatedHostel: z.ZodOptional<z.ZodString>;
    token: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"consumer-resume">;
    cameraName: z.ZodString;
}, z.core.$strip>]>;
export declare const wsMessageToFrontendSchema: z.ZodUnion<readonly [z.ZodObject<{
    type: z.ZodLiteral<"get-rtp-capabilities">;
    rtpCapabilities: z.ZodAny;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"error">;
    error: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"send-consumer-transport-params">;
    params: z.ZodObject<{
        id: z.ZodString;
        iceParameters: z.ZodAny;
        iceCandidates: z.ZodAny;
        dtlsParameters: z.ZodAny;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"invitation-to-consume">;
    params: z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodAny;
        producerId: z.ZodString;
        rtpParameters: z.ZodAny;
        cameraName: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>]>;
