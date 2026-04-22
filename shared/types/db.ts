export type UsersSchemaType={
    name:string,
    email:string,
    password:string,
    entry_number:string,
    hostel_name:string
}

export type AdminSchemaType={
    name:string,
    email:string,
    password:string,
    privelege:string,
    allocatedHostel:string
}

export type EmergencySchemaType={
    name:string,
    info:Record<string,string>
}

export type camerasSchemaType={
    cameraName:string,
    hostelName:string
}

export type visitorsSchemaType={
    hostel_name:string,
    host_email:string,
    guest_name:string,
    guest_contact_number:string
}

export type hostelsSchemaType={
    hostel_name:string
}