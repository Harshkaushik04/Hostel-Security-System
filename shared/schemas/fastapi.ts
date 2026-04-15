import {z} from "zod"

export const faceDataSchema=z.object({
    cameraName:z.string(),
    name:z.string()
})

export const qrDataSchema=z.object({
    cameraName:z.string(),
    type:z.string(),
    issued_at:z.string(),
    host_email:z.string(),
    guest_name:z.string(),
    guest_contact_number:z.string()
})