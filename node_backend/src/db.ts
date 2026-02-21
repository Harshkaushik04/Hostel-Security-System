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
    password:String
})

const admin=new mongoose.Schema<CustomTypes.db.AdminSchemaType>({
    name:String,
    email:String,
    password:String,
    privelege:String
})

const invites=new mongoose.Schema<CustomTypes.db.InviteSchemaType>({
    host_email:String,
    guest_name:String,
    guest_contact_number:String
})

const emergencies=new mongoose.Schema<CustomTypes.db.EmergencySchemaType>({
    name:String,
    info:{
        type:Map,
        of:String
    }
})

const hostelStudents=new mongoose.Schema<CustomTypes.db.hostelStudentsSchemaType>({
    hostel_name:String,
    student_name:String,
    student_entry_number:String
})

export const UserModel=mongoose.model("users",users)
export const AdminModel=mongoose.model("admin",admin)
export const InviteModel=mongoose.model("invites",invites)
export const EmergencyModel=mongoose.model("emergencies",emergencies)
export const hostelStudentsModel=mongoose.model("hostelStudents",hostelStudents)