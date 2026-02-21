import {z} from "zod"

export const AddHostelRequestSchema=z.object({
    hostel_name:z.string()
})

export const getHostelStudentsListRequestSchema=z.object({
    hostel_name:z.string(),
    start:z.number(),
    num_students:z.number()
})

export const getAdminUsersListRequestSchema=z.object({
    admin_privelege_name:z.string(),
    start:z.number(),
    num_users:z.number()
})