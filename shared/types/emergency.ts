import { CustomSchemas } from "../index.js";
import {z} from "zod"

export type EmergencyRightResponseType = z.infer<typeof CustomSchemas.emergency.EmergencyRightResponseSchema>
export type EmergencyWrongResponseType = z.infer<typeof CustomSchemas.emergency.EmergencyWrongResponseSchema>
export type EmergencyResponseType = z.infer<typeof CustomSchemas.emergency.EmergencyResponseSchema>