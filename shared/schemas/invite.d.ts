import { z } from "zod";
export declare const InviteRequestSchema: z.ZodObject<{
    host_email: z.ZodString;
    guest_name: z.ZodString;
    guest_contact_number: z.ZodString;
}, z.core.$strip>;
export declare const InviteRightResponseSchema: z.ZodObject<{
    approved: z.ZodLiteral<true>;
}, z.core.$strip>;
export declare const InviteWrongResponseSchema: z.ZodObject<{
    approved: z.ZodLiteral<false>;
    error: z.ZodString;
}, z.core.$strip>;
export declare const InviteResponseSchema: z.ZodUnion<readonly [z.ZodObject<{
    approved: z.ZodLiteral<true>;
}, z.core.$strip>, z.ZodObject<{
    approved: z.ZodLiteral<false>;
    error: z.ZodString;
}, z.core.$strip>]>;
