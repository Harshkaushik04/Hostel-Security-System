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
    allocatedHostel: z.ZodString;
}, z.core.$strip>;
export declare const EditStudentRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"student">;
    filterBy: z.ZodEnum<{
        readonly entry_number: "entry_number";
        readonly email: "email";
    }>;
    value: z.ZodString;
    changed: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        entry_number: z.ZodString;
        hostel_name: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const EditAdminRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"admin">;
    filterBy: z.ZodEnum<{
        readonly email: "email";
    }>;
    value: z.ZodString;
    changed: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        privelege: z.ZodString;
        allocatedHostel: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const DeleteAdminRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"admin">;
    filterBy: z.ZodEnum<{
        readonly email: "email";
    }>;
    value: z.ZodString;
}, z.core.$strip>;
export declare const DeleteStudentRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"student">;
    filterBy: z.ZodEnum<{
        readonly email: "email";
        readonly entry_number: "entry_number";
    }>;
    value: z.ZodString;
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
    allocatedHostel: z.ZodString;
}, z.core.$strip>]>;
export declare const EditRequestSchema: z.ZodUnion<readonly [z.ZodObject<{
    type: z.ZodLiteral<"student">;
    filterBy: z.ZodEnum<{
        readonly entry_number: "entry_number";
        readonly email: "email";
    }>;
    value: z.ZodString;
    changed: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        entry_number: z.ZodString;
        hostel_name: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"admin">;
    filterBy: z.ZodEnum<{
        readonly email: "email";
    }>;
    value: z.ZodString;
    changed: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        privelege: z.ZodString;
        allocatedHostel: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>]>;
export declare const UploadManuallyResponseSchema: z.ZodUnion<readonly [z.ZodObject<{
    approved: z.ZodLiteral<false>;
    error: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    approved: z.ZodLiteral<true>;
}, z.core.$strip>]>;
export declare const DeleteRequestSchema: z.ZodUnion<readonly [z.ZodObject<{
    type: z.ZodLiteral<"student">;
    filterBy: z.ZodEnum<{
        readonly email: "email";
        readonly entry_number: "entry_number";
    }>;
    value: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"admin">;
    filterBy: z.ZodEnum<{
        readonly email: "email";
    }>;
    value: z.ZodString;
}, z.core.$strip>]>;
/** Camera ↔ hostel (CamerasModel / camerasSchemaType) */
export declare const CameraRowSchema: z.ZodObject<{
    cameraName: z.ZodString;
    hostelName: z.ZodString;
}, z.core.$strip>;
export declare const GetCamerasListRightResponseSchema: z.ZodObject<{
    cameras: z.ZodArray<z.ZodObject<{
        cameraName: z.ZodString;
        hostelName: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const AddCameraRequestSchema: z.ZodObject<{
    cameraName: z.ZodString;
    hostelName: z.ZodString;
}, z.core.$strip>;
export declare const EditCameraRequestSchema: z.ZodObject<{
    cameraName: z.ZodString;
    hostelName: z.ZodString;
    newCameraName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const DeleteCameraRequestSchema: z.ZodObject<{
    cameraName: z.ZodString;
}, z.core.$strip>;
