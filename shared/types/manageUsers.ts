import { CustomSchemas } from "../index.js";
import {z} from "zod"

export type WrongResponseType = z.infer<typeof CustomSchemas.manageUsers.WrongResponseSchema>
export type AddHostelRequestType = z.infer<typeof CustomSchemas.manageUsers.AddHostelRequestSchema>
export type AddHostelResponseType = z.infer<typeof CustomSchemas.manageUsers.AddHostelResponseSchema>
export type GetHostelsListResponseType = z.infer<typeof CustomSchemas.manageUsers.GetHostelsListResponseSchema>
export type GetHostelStudentsListRequestType = z.infer<typeof CustomSchemas.manageUsers.GetHostelStudentsListRequestSchema>
export type GetHostelStudentsListRightResponseType = z.infer<typeof CustomSchemas.manageUsers.GetHostelStudentsListRightResponseSchema>
export type GetHostelStudentsListResponseType = z.infer<typeof CustomSchemas.manageUsers.GetHostelStudentsListResponseSchema>
export type GetAdminUsersListRequestType = z.infer<typeof CustomSchemas.manageUsers.GetAdminUsersListRequestSchema>
export type GetAdminUsersListRightResponseType = z.infer<typeof CustomSchemas.manageUsers.GetAdminUsersListRightResponseSchema>
export type GetAdminUsersListResponseType = z.infer<typeof CustomSchemas.manageUsers.GetAdminUsersListResponseSchema>
export type UploadManuallyStudentRequestType = z.infer<typeof CustomSchemas.manageUsers.UploadManuallyStudentRequestSchema>
export type UploadManuallyAdminRequestType = z.infer<typeof CustomSchemas.manageUsers.UploadManuallyAdminRequestSchema>
export type UploadManuallyRequestType = z.infer<typeof CustomSchemas.manageUsers.UploadManuallyRequestSchema>
export type UploadManuallyResponseType = z.infer<typeof CustomSchemas.manageUsers.UploadManuallyResponseSchema>