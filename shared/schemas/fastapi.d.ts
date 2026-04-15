import { z } from "zod";
export declare const faceDataSchema: z.ZodObject<{
    cameraName: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const qrDataSchema: z.ZodObject<{
    cameraName: z.ZodString;
    type: z.ZodString;
    issued_at: z.ZodString;
    host_email: z.ZodString;
    guest_name: z.ZodString;
    guest_contact_number: z.ZodString;
}, z.core.$strip>;
