import {z} from "zod"
import { CustomSchemas } from "../index.js"

export type faceDataType = z.infer<typeof CustomSchemas.fastapi.faceDataSchema>
export type qrDataType = z.infer<typeof CustomSchemas.fastapi.qrDataSchema>
export type internalQrDataType = z.infer<typeof CustomSchemas.fastapi.internalQrDataSchema>