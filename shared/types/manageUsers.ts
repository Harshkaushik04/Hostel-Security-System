import { CustomSchemas } from "../index.js";
import {z} from "zod"

export type AddHostelRequestType = z.infer<typeof CustomSchemas.manageUsers.AddHostelRequestSchema>
export type AddHostelWrongResponseType = z.infer<typeof CustomSchemas.manageUsers.AddHostelWrongResponseSchema>
export type AddHostelRightResponseType = z.infer<typeof CustomSchemas.manageUsers.AddHostelRightResponseSchema>
export type AddHostelResponseType = z.infer<typeof CustomSchemas.manageUsers.AddHostelResponseSchema>
export type GetHostelsListResponseType = z.infer<typeof CustomSchemas.manageUsers.GetHostelsListResponseSchema>
export type GetHostelStudentsListRequestType = z.infer<typeof CustomSchemas.manageUsers.GetHostelStudentsListRequestSchema>
export type GetHostelStudentsListWrongResponseType = z.infer<typeof CustomSchemas.manageUsers.GetHostelStudentsListWrongResponseSchema>
export type GetHostelStudentsListRightResponseType = z.infer<typeof CustomSchemas.manageUsers.GetHostelStudentsListRightResponseSchema>
export type GetHostelStudentsListResponseType = z.infer<typeof CustomSchemas.manageUsers.GetHostelStudentsListResponseSchema>
export type GetAdminUsersListRequestSchemaType = z.infer<typeof CustomSchemas.manageUsers.GetAdminUsersListRequestSchema>