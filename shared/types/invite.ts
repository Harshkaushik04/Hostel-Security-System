import {z} from "zod"
import { CustomSchemas } from "../index.js"

export type InviteRequestType = z.infer<typeof CustomSchemas.invite.InviteRequestSchema>
export type InviteRightResponseType = z.infer<typeof CustomSchemas.invite.InviteRightResponseSchema>
export type InviteWrongResponseSchema = z.infer<typeof CustomSchemas.invite.InviteWrongResponseSchema>
export type InviteResponseType = z.infer<typeof CustomSchemas.invite.InviteResponseSchema>