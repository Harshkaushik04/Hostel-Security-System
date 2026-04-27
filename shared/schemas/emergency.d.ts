import { z } from "zod";
export declare const EmergencyRightResponseSchema: z.ZodObject<{
    info: z.ZodRecord<z.ZodString, z.ZodString>;
}, z.core.$strip>;
export declare const EmergencyWrongResponseSchema: z.ZodObject<{
    error: z.ZodString;
}, z.core.$strip>;
export declare const EmergencyResponseSchema: z.ZodUnion<readonly [z.ZodObject<{
    info: z.ZodRecord<z.ZodString, z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    error: z.ZodString;
}, z.core.$strip>]>;
