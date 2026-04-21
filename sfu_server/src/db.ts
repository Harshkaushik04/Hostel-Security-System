import mongoose from "mongoose";
import dotenv from "dotenv"
import path from "path"
import { CustomTypes} from "@my-app/shared";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__dirname)
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
    host_email:String,
    guest_name:String,
    guest_contact_number:String
})

const hostels= new mongoose.Schema<CustomTypes.db.hostelsSchemaType>({
    hostel_name:String
})

export const UserModel=mongoose.model("users",users)
export const AdminModel=mongoose.model("admin",admin)
export const EmergencyModel=mongoose.model("emergencies",emergencies)
export const CamerasModel=mongoose.model("cameras",cameras)
export const VisitorsModel=mongoose.model("visitors",visitors)
export const HostelsModel=mongoose.model("hostels",hostels)