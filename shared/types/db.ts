export type UsersSchemaType={
    name:string,
    email:string,
    password:string
}

export type AdminSchemaType={
    name:string,
    email:string,
    password:string,
    privelege:string
}

export type InviteSchemaType={
    host_email:string,
    guest_name:string,
    guest_contact_number:string
}

export type EmergencySchemaType={
    name:string,
    info:Record<string,string>
}