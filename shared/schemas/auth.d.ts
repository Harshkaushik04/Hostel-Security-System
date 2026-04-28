import { z } from "zod";
export declare const SignInWrongResponseSchema: z.ZodObject<{
    valid: z.ZodLiteral<false>;
    error: z.ZodString;
}, z.core.$strip>;
export declare const SignInRightResponseSchema: z.ZodObject<{
    valid: z.ZodLiteral<true>;
    token: z.ZodString;
}, z.core.$strip>;
export declare const SignInCompleteRightResponseSchema: z.ZodObject<{
    valid: z.ZodLiteral<true>;
}, z.core.$strip>;
export declare const SignInResponseSchema: z.ZodUnion<readonly [z.ZodObject<{
    valid: z.ZodLiteral<false>;
    error: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    valid: z.ZodLiteral<true>;
    token: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    valid: z.ZodLiteral<true>;
}, z.core.$strip>]>;
export declare const SignInRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
