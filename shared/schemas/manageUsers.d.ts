import { z } from "zod";
export declare const RightResponseSchema: z.ZodObject<{
    approved: z.ZodLiteral<true>;
}, z.core.$strip>;
export declare const WrongResponseSchema: z.ZodObject<{
    approved: z.ZodLiteral<false>;
    error: z.ZodString;
}, z.core.$strip>;
export declare const AddHostelRequestSchema: z.ZodObject<{
    hostel_name: z.ZodString;
}, z.core.$strip>;
export declare const AddHostelResponseSchema: z.ZodUnion<readonly [z.ZodObject<{
    approved: z.ZodLiteral<false>;
    error: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    approved: z.ZodLiteral<true>;
}, z.core.$strip>]>;
export declare const GetHostelStudentsListRequestSchema: z.ZodObject<{
    hostel_name: z.ZodString;
    start: z.ZodNumber;
    num_students: z.ZodNumber;
}, z.core.$strip>;
export declare const GetHostelsListResponseSchema: z.ZodObject<{
    hostelsList: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const GetHostelStudentsListRightResponseSchema: z.ZodObject<{
    studentsList: z.ZodArray<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const GetHostelStudentsListResponseSchema: z.ZodUnion<readonly [z.ZodObject<{
    approved: z.ZodLiteral<false>;
    error: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    studentsList: z.ZodArray<z.ZodArray<z.ZodString>>;
}, z.core.$strip>]>;
export declare const GetAdminUsersListRequestSchema: z.ZodObject<{
    admin_privelege_name: z.ZodEnum<{
        super_user: "super_user";
        top_privelege: "top_privelege";
        gaurd: "gaurd";
    }>;
    start: z.ZodNumber;
    num_users: z.ZodNumber;
}, z.core.$strip>;
export declare const GetAdminUsersListRightResponseSchema: z.ZodObject<{
    usersList: z.ZodArray<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const GetAdminUsersListResponseSchema: z.ZodUnion<readonly [z.ZodObject<{
    usersList: z.ZodArray<z.ZodArray<z.ZodString>>;
}, z.core.$strip>, z.ZodObject<{
    approved: z.ZodLiteral<false>;
    error: z.ZodString;
}, z.core.$strip>]>;
export declare const UploadManuallyStudentRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"student">;
    name: z.ZodString;
    entry_number: z.ZodString;
    hostel_name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const UploadManuallyAdminRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"admin">;
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    privelege: z.ZodEnum<{
        super_user: "super_user";
        top_privelege: "top_privelege";
        gaurd: "gaurd";
    }>;
}, z.core.$strip>;
export declare const UploadManuallyRequestSchema: z.ZodUnion<readonly [z.ZodObject<{
    type: z.ZodLiteral<"student">;
    name: z.ZodString;
    entry_number: z.ZodString;
    hostel_name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"admin">;
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    privelege: z.ZodEnum<{
        super_user: "super_user";
        top_privelege: "top_privelege";
        gaurd: "gaurd";
    }>;
}, z.core.$strip>]>;
export declare const UploadManuallyResponseSchema: z.ZodUnion<readonly [z.ZodObject<{
    approved: z.ZodLiteral<false>;
    error: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    approved: z.ZodLiteral<true>;
}, z.core.$strip>]>;
