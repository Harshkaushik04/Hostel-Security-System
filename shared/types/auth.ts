import {CustomSchemas} from  "../index.js"
import {z} from "zod"
import {JwtPayload} from "jsonwebtoken"

export type SignInWrongResponseType = z.infer<typeof CustomSchemas.auth.SignInWrongResponseSchema>
export type SignInRightResponseType = z.infer<typeof CustomSchemas.auth.SignInRightResponseSchema>
export type SignInResponseType = z.infer<typeof CustomSchemas.auth.SignInResponseSchema>
export type SignInCompleteRightResponseSchema = z.infer<typeof CustomSchemas.auth.SignInCompleteRightResponseSchema>

export type SignInRequestType = z.infer<typeof CustomSchemas.auth.SignInRequestSchema>
// export type SignInRequestHeadersType = z.infer<typeof CustomSchemas.auth.SignInRequestHeadersSchema>

export interface JwtDecryptedType extends JwtPayload{
    email:string
}

