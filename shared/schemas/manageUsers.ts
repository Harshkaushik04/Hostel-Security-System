import {z} from "zod"
import { CustomSchemas } from "../index.js"


export const RightResponseSchema=z.object({
    approved:z.literal(true)
})

export const WrongResponseSchema=z.object({
    approved:z.literal(false),
    error:z.string()
})

export const AddHostelRequestSchema=z.object({
    hostel_name:z.string()
})

export const AddHostelResponseSchema=z.union([WrongResponseSchema,RightResponseSchema])

export const GetHostelStudentsListRequestSchema=z.object({
    hostel_name:z.string(),
    start:z.number(),
    num_students:z.number()
})

export const GetHostelsListResponseSchema=z.object({
    hostelsList:z.array(z.string())
})

export const GetHostelStudentsListRightResponseSchema=z.object({
    studentsList:z.array(z.array(z.string()))
})

export const GetHostelStudentsListResponseSchema=z.union([WrongResponseSchema,GetHostelStudentsListRightResponseSchema])

export const GetAdminUsersListRequestSchema=z.object({
    admin_privelege_name:z.enum(["super_user","top_privelege","gaurd"]),
    start:z.number(),
    num_users:z.number()
})

export const GetAdminUsersListRightResponseSchema=z.object({
    usersList:z.array(z.array(z.string()))
})

export const GetAdminUsersListResponseSchema=z.union([GetAdminUsersListRightResponseSchema,WrongResponseSchema])

export const UploadManuallyStudentRequestSchema=z.object({
    type:z.literal("student"),
    name:z.string(),
    entry_number:z.string(),
    hostel_name:z.string(),
    email:z.string(),
    password:z.string()
})

export const UploadManuallyAdminRequestSchema=z.object({
    type:z.literal("admin"),
    name:z.string(),
    email:z.string(),
    password:z.string(),
    privelege:z.enum(["super_user","top_privelege","gaurd"]),
    allocatedHostel:z.string()
})

export const EditStudentRequestSchema=z.object({
    type:z.literal("student"),
    filterBy:z.enum({
        entry_number:"entry_number",
        email:"email"
    }),
    value:z.string(),
    changed:z.object({
        name:z.string(),
        email:z.string(),
        password:z.string(),
        entry_number:z.string(),
        hostel_name:z.string()
    })
})

export const EditAdminRequestSchema=z.object({
    type:z.literal("admin"),
    filterBy:z.enum({
        email:"email"
    }),
    value:z.string(),
    changed:z.object({
        name:z.string(),
        email:z.string(),
        password:z.string(),
        privelege:z.string(),
        allocatedHostel:z.string()
    })
})

export const DeleteAdminRequestSchema=z.object({
    type:z.literal("admin"),
    filterBy:z.enum({
        email:"email"
    }),
    value:z.string()
})

export const DeleteStudentRequestSchema=z.object({
    type:z.literal("student"),
    filterBy:z.enum({
        email:"email",
        entry_number:"entry_number"
    }),
    value:z.string()
})

export const UploadManuallyRequestSchema=z.union([UploadManuallyStudentRequestSchema,UploadManuallyAdminRequestSchema])
export const EditRequestSchema=z.union([EditStudentRequestSchema,EditAdminRequestSchema])
export const UploadManuallyResponseSchema=z.union([WrongResponseSchema,RightResponseSchema])
export const DeleteRequestSchema=z.union([DeleteStudentRequestSchema,DeleteAdminRequestSchema])