import {z} from "zod"

export const faceDataSchema=z.object({
    cameraName:z.string(),
    name:z.string()
})

export const internalQrDataSchema=z.object({
    type:z.string(),
    issued_at:z.number(),
    host_email:z.string(),
    guest_name:z.string(),
    guest_contact_number:z.string()
})

export const qrDataSchema=z.object({
    cameraName:z.string(),
    qr_data:internalQrDataSchema
})