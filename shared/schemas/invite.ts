import {z} from "zod"
//in future can add blacklist too
export const InviteRequestSchema=z.object({
    host_email:z.string(),
    guest_name:z.string(),
    guest_contact_number:z.string()
})

export const InviteRightResponseSchema=z.object({
    approved:z.literal(true)
})

export const InviteWrongResponseSchema=z.object({
    approved:z.literal(false),
    error:z.string()
})

export const InviteResponseSchema=z.union([InviteRightResponseSchema,InviteWrongResponseSchema])