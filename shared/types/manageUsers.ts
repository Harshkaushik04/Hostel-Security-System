import { CustomSchemas } from "../index.js";
import {z} from "zod"

export type AddHostelRequestType = z.infer<typeof CustomSchemas.manageUsers.AddHostelRequestSchema>
export type getHostelStudentsListRequestType = z.infer<typeof CustomSchemas.manageUsers.getHostelStudentsListRequestSchema>
export type getAdminUsersListRequestSchemaType = z.infer<typeof CustomSchemas.manageUsers.getAdminUsersListRequestSchema>