import {z} from "zod"

export const AddHostelRequestSchema=z.object({
    hostel_name:z.string()
})

export const AddHostelWrongResponseSchema=z.object({
    approved:z.literal(false),
    error:z.string()
})

export const AddHostelRightResponseSchema=z.object({
    approved:z.literal(true)
})

export const AddHostelResponseSchema=z.union([AddHostelWrongResponseSchema,AddHostelRightResponseSchema])

export const GetHostelStudentsListRequestSchema=z.object({
    hostel_name:z.string(),
    start:z.number(),
    num_students:z.number()
})

export const GetHostelsListResponseSchema=z.object({
    hostelsList:z.array(z.string())
})

export const GetHostelStudentsListWrongResponseSchema=z.object({
    approved:z.literal(false),
    error:z.string()
})

export const GetHostelStudentsListRightResponseSchema=z.object({
    studentsList:z.array(z.array(z.string()))
})

export const GetHostelStudentsListResponseSchema=z.union([GetHostelStudentsListWrongResponseSchema,GetHostelStudentsListRightResponseSchema])

export const GetAdminUsersListRequestSchema=z.object({
    admin_privelege_name:z.enum(["super_user","top_privelege","gaurd"]),
    start:z.number(),
    num_users:z.number()
})