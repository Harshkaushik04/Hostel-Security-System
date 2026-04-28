import mongoose from "mongoose";
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url";
import { CustomTypes} from "@my-app/shared";

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});
const MONGO_URL=process.env.MONGO_URL

const users=new mongoose.Schema<CustomTypes.db.UsersSchemaType>({ 
    name:String,
    email:String,
    password:String,
    entry_number:String,
    hostel_name:String
})

const admin=new mongoose.Schema<CustomTypes.db.AdminSchemaType>({
    name:String,
    email:String,
    password:String,
    privelege:String,
    allocatedHostel:String
})

const emergencies=new mongoose.Schema<CustomTypes.db.EmergencySchemaType>({
    name:String,
    info:{
        type:Map,
        of:String
    }
})

const cameras=new mongoose.Schema<CustomTypes.db.camerasSchemaType>({
    cameraName:String,
    hostelName:String
})

const visitors= new mongoose.Schema<CustomTypes.db.visitorsSchemaType>({
    hostel_name:String,
    host_email:String,
    guest_name:String,
    guest_contact_number:String
})

const hostels= new mongoose.Schema<CustomTypes.db.hostelsSchemaType>({
    hostel_name:String
})

const notifications = new mongoose.Schema<CustomTypes.db.notificationsSchemaType>(
    {
        hostelName: { type: String, required: true, index: true },
        message: { type: String, required: true },
        kind: {
            type: String,
            required: true,
            enum: ["face_entry", "visitor_qr"],
        },
        cameraName: { type: String },
    },
    { timestamps: true }
)

export const UserModel=mongoose.model("users",users)
export const AdminModel=mongoose.model("admin",admin)
export const EmergencyModel=mongoose.model("emergencies",emergencies)
export const CamerasModel=mongoose.model("cameras",cameras)
export const VisitorsModel=mongoose.model("visitors",visitors)
export const HostelsModel=mongoose.model("hostels",hostels)
export const NotificationsModel=mongoose.model("notifications",notifications)