import {z} from "zod"
export const SignInWrongResponseSchema=z.object({
    valid:z.literal(false),
    error:z.string()
})

export const SignInRightResponseSchema=z.object({
    valid:z.literal(true),
    token:z.string()
})

export const SignInCompleteRightResponseSchema=z.object({
    valid:z.literal(true)
})
export const SignInResponseSchema=z.union([SignInWrongResponseSchema,SignInRightResponseSchema,SignInCompleteRightResponseSchema])

export const SignInRequestSchema=z.object({
    email:z.string(),
    password:z.string()
})

