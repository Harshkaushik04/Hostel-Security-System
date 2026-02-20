import {z} from "zod"

export const EmergencyRightResponseSchema=z.object({
    info:z.record(z.string(),z.string())
})

export const EmergencyWrongResponseSchema=z.object({
    error:z.string()
})

export const EmergencyResponseSchema=z.union([EmergencyRightResponseSchema,EmergencyWrongResponseSchema])