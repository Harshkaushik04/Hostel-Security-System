import express from "express"
import cors from "cors"
import { Request,Response,NextFunction } from "express"
import {CustomSchemas,CustomTypes} from "@my-app/shared"
import {z} from "zod"
import jwt from "jsonwebtoken"
import { UserModel,AdminModel,InviteModel,EmergencyModel } from "./db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url";
import mongoose from "mongoose" 

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const app=express()
app.use(cors())
app.use(express.json())
const JWT_SECRET=process.env.JWT_SECRET
const MONGO_URL=process.env.MONGO_URL

if(!JWT_SECRET){
    throw new Error("JWT_SECRET not present in .env")
}
if(!MONGO_URL){
    throw new Error("MONGO_URL not present in .env")
}
mongoose.connect(MONGO_URL as string).catch((err) => {
    console.log("Database connection failed", err);
});

function authMiddleware(req:Request,res:Response,next:NextFunction){
    if(req.headers.token){
        try{
            //@ts-ignore
            const decryptedData=jwt.verify(req.headers.token as string,JWT_SECRET) as CustomTypes.auth.JwtDecryptedType
            return next()
        }
        catch(e){
            return res.send({
                valid:false,
                error:"jwt is wrong"
            })
        }
    }
    else{
        return res.send({
            valid:false,
            error:"no jwt"
        })
    }
}

// app.get("/",(req:Request,res:Response)=>{
//     // 
//     return res.send({
//         "message":"hello"
//     })
// })

app.post("/student-sign-in",async(req:Request,res:Response)=>{
    console.log(`entered [student-sign-in]`)
    const studentSignInRequestCheck=CustomSchemas.auth.SignInRequestSchema.safeParse(req.body)
    if(!studentSignInRequestCheck.success){
        return res.send({
            valid:false,
            error:`wrong request structure\n${studentSignInRequestCheck.error}`
        })
    }
    else{
        const reqBody:CustomTypes.auth.SignInRequestType=req.body
        if(req.headers.token){
            try{
                //@ts-ignore
                const decryptedData=jwt.verify(req.headers.token,JWT_SECRET)
                if(decryptedData.email==reqBody.email){
                    const user = await UserModel.findOne({
                        email:reqBody.email
                    }) 
                    if(!user){
                        return res.send({
                            valid:false,
                            error:"user not found in database"
                        })
                    }
                    else{
                        const whetherSamePassword = await bcrypt.compare(reqBody.password,user.password)
                        if(whetherSamePassword){
                            return res.send({
                                valid:true
                            })
                        }
                        else{
                            return res.send({
                                valid:false,
                                error:"wrong password"
                            })
                        }
                    }
                }
                else{
                    const user = await UserModel.findOne({
                        email:reqBody.email
                    })
                    if(!user){
                        return res.send({
                            valid:false,
                            error:"user not found in database"
                        })
                    }
                    else{
                        const whetherSamePassword = await bcrypt.compare(reqBody.password,user.password)
                        if(whetherSamePassword){
                            const jwt_token=jwt.sign({
                                email:reqBody.email
                            },JWT_SECRET)
                            return res.send({
                                valid:true,
                                token:jwt_token
                            })
                        }
                        else{
                            return res.send({
                                valid:false,
                                error:"wrong password"
                            })
                        }
                    }
                }
            }
            catch(e){
                const user = await UserModel.findOne({
                    email:reqBody.email
                })
                if(!user){
                    return res.send({
                        valid:false,
                        error:"user not found in database"
                    })
                }
                else{
                    const passwordCheck = await bcrypt.compare(reqBody.password,user.password)
                    if(!passwordCheck){
                        return res.json({
                            valid:false,
                            error:"wrong password"
                        })
                    }
                    else{
                        const jwt_token=jwt.sign({
                            email:reqBody.email
                        },JWT_SECRET)
                        return res.send({
                            valid:true,
                            token:jwt_token
                        })
                    }
                }
            }
        }
        else{
            const user = await UserModel.findOne({
                email:reqBody.email
            })
            if(!user){
                return res.send({
                    valid:false,
                    error:"user not found in database"
                })
            }
            else{
                const whetherSamePassword = await bcrypt.compare(reqBody.password,user.password)
                if(whetherSamePassword){
                    const jwt_token = jwt.sign({
                        email:reqBody.email
                    },JWT_SECRET)
                    return res.send({
                        valid:true,
                        token:jwt_token
                    })
                }
                else{
                    return res.send({
                        valid:false,
                        error:"wrong password"
                    })
                }
            }
        }
    }
})

app.post("/admin-sign-in", async(req:Request,res:Response)=>{
    console.log(`entered [admin-sign-in]`)
    const adminSignInRequestCheck=CustomSchemas.auth.SignInRequestSchema.safeParse(req.body)
    if(!adminSignInRequestCheck.success){
        return res.send({
            valid:false,
            error:`wrong request structure\n${adminSignInRequestCheck.error}`
        })
    }
    else{
        const reqBody:CustomTypes.auth.SignInRequestType=req.body
        if(req.headers.token){
            try{
                //@ts-ignore
                const decryptedData=jwt.verify(req.headers.token,JWT_SECRET)
                if(decryptedData.email==reqBody.email){
                    const user = await AdminModel.findOne({
                        email:reqBody.email
                    }) 
                    if(!user){
                        return res.send({
                            valid:false,
                            error:"user not found in database"
                        })
                    }
                    else{
                        const whetherSamePassword = await bcrypt.compare(reqBody.password,user.password)
                        if(whetherSamePassword){
                            return res.send({
                                valid:true
                            })
                        }
                        else{
                            return res.send({
                                valid:false,
                                error:"wrong password"
                            })
                        }
                    }
                }
                else{
                    const user = await AdminModel.findOne({
                        email:reqBody.email
                    })
                    if(!user){
                        return res.send({
                            valid:false,
                            error:"user not found in database"
                        })
                    }
                    else{
                        const whetherSamePassword = await bcrypt.compare(reqBody.password,user.password)
                        if(whetherSamePassword){
                            const jwt_token=jwt.sign({
                                email:reqBody.email
                            },JWT_SECRET)
                            return res.send({
                                valid:true,
                                token:jwt_token
                            })
                        }
                        else{
                            return res.send({
                                valid:false,
                                error:"wrong password"
                            })
                        }
                    }
                }
            }
            catch(e){
                const user = await AdminModel.findOne({
                    email:reqBody.email
                })
                if(!user){
                    return res.send({
                        valid:false,
                        error:"user not found in database"
                    })
                }
                else{
                    const passwordCheck = await bcrypt.compare(reqBody.password,user.password)
                    if(!passwordCheck){
                        return res.json({
                            valid:false,
                            error:"wrong password"
                        })
                    }
                    else{
                        const jwt_token=jwt.sign({
                            email:reqBody.email
                        },JWT_SECRET)
                        return res.send({
                            valid:true,
                            token:jwt_token
                        })
                    }
                }
            }
        }
        else{
            const user = await AdminModel.findOne({
                email:reqBody.email
            })
            if(!user){
                return res.send({
                    valid:false,
                    error:"user not found in database"
                })
            }
            else{
                const whetherSamePassword = await bcrypt.compare(reqBody.password,user.password)
                if(whetherSamePassword){
                    const jwt_token = jwt.sign({
                        email:reqBody.email
                    },JWT_SECRET)
                    return res.send({
                        valid:true,
                        token:jwt_token
                    })
                }
                else{
                    return res.send({
                        valid:false,
                        error:"wrong password"
                    })
                }
            }
        }
    }
})

app.use(authMiddleware)

app.post("/invite", async(req:Request,res:Response)=>{
    console.log(`entered [invite]`)
    const inviteCheck = CustomSchemas.invite.InviteRequestSchema.safeParse(req.body)
    if(!inviteCheck.success){
        return res.send({
            approved:false,
            error:`request schema invalid\n${inviteCheck.error}`
        })
    }
    else{
        const reqBody:CustomTypes.invite.InviteRequestType=req.body // host_email,guest_name,guest_contact_number
        const user = await UserModel.findOne({
            email:reqBody.host_email
        })
        if(!user){
            return res.send({
                approved:false,
                error:"host email not found in database"
            })
        }
        else{
            await InviteModel.create({
                host_email:reqBody.host_email,
                guest_name:reqBody.guest_name,
                guest_contact_number:reqBody.guest_contact_number
            })
            return res.send({
                approved:true
            })
        }
    }
})

app.get("/emergencies",async (req:Request,res:Response)=>{
    console.log(`entered [emergencies]`)
    const emergencies=await EmergencyModel.findOne({
        name:"main"
    })
    if(!emergencies){
        return res.send({
            error:"no emergencies found"
        })
    }
    else{
        return res.send({
            info:emergencies.info
        })
    }
})

app.post("/add-hostel",async (req:Request,res:Response)=>{
    const reqCheck = CustomSchemas.manageUsers.AddHostelRequestSchema.safeParse(req.body)
    if(!reqCheck.success){
        return res.send({
            approved:false,
            error:`request schema invalid\n${reqCheck.error}`
        })
    }
    else{
        const reqBody:CustomTypes.manageUsers.AddHostelRequestType=req.body
        const hostelRow=await UserModel.findOne({
            hostel_name:reqBody.hostel_name
        })
        if(hostelRow){
            return res.send({
                approved:false,
                error:"duplicate hostel"
            })
        }
        else{
            await UserModel.create({
                hostel_name:reqBody.hostel_name,
                name:process.env.NAME_SECRET,
                entry_number:process.env.ENTRY_NUMBER_SECRET,
                password:process.env.PASSWORD_SECRET,
                email:process.env.EMAIL_SECRET
            })
            return res.send({
                approved:true
            })
        }
    }
})

app.post("/get-hostels-list",async(req:Request,res:Response)=>{
    const docs=await UserModel.find({
        name:process.env.NAME_SECRET,
        entry_number:process.env.ENTRY_NUMBER_SECRET,
        password:process.env.PASSWORD_SECRET,
        email:process.env.EMAIL_SECRET
    })
    let hostelsList:string[]=[]
    for(const doc of docs){
        hostelsList.push(doc.hostel_name)
    }
    return res.send({
        hostelsList:hostelsList
    })
})

app.post("/get-hostel-students-list",async (req:Request,res:Response)=>{
    const reqCheck = CustomSchemas.manageUsers.GetHostelStudentsListRequestSchema.safeParse(req.body)
    if(!reqCheck.success){
        return res.send({
            approved:false,
            error:`request schema wrong\n${reqCheck.error}`
        })
    }
    else{
        const reqBody:CustomTypes.manageUsers.GetHostelStudentsListRequestType=req.body
        const docs=await UserModel.find({
            hostel_name:reqBody.hostel_name
        }).skip(reqBody.start-1).limit(reqBody.num_students)
        let studentsList:string[][]=[]
        for(const doc of docs){
            if(doc.name!=process.env.NAME_SECRET){
                studentsList.push([doc.name,doc.entry_number,doc.email])
            }
        }
        return res.json({
            studentsList:studentsList
        })
    }
})

app.post("/get-admin-users-list",async (req:Request,res:Response)=>{
    const reqCheck = CustomSchemas.manageUsers.GetAdminUsersListRequestSchema.safeParse(req.body)
    if(!reqCheck.success){
        return res.send({
            approved:false,
            error:`request schema wrong\n${reqCheck.error}`
        })
    }
    else{
        const reqBody:CustomTypes.manageUsers.GetAdminUsersListRequestType=req.body
        const docs=await AdminModel.find({
            privelege:reqBody.admin_privelege_name
        }).skip(reqBody.start-1).limit(reqBody.num_users)
        let usersList:string[][]=[]
        for(const doc of docs){
            if(doc.name!=process.env.NAME_SECRET){
                usersList.push([doc.name,doc.email])
            }
        }
        return res.send({
            usersList:usersList
        })
    }
})

app.post("/upload-manually",async(req:Request,res:Response)=>{
    const reqCheck = CustomSchemas.manageUsers.UploadManuallyAdminRequestSchema.safeParse(req.body)
    if(!reqCheck.success){
        return res.send({
            approved:false,
            error:`request schema wrong\n${reqCheck.error}`
        })
    }
    else{
        const reqBody:CustomTypes.manageUsers.UploadManuallyRequestType=req.body
        const hashed_password = await bcrypt.hash(reqBody.password,5)
        if(reqBody.type=="student"){
            await UserModel.create({
                name:reqBody.name,
                entry_number:reqBody.entry_number,
                hostel_name:reqBody.hostel_name,
                email:reqBody.email,
                password:hashed_password
            })
        }
        else{
            await AdminModel.create({
                name:reqBody.name,
                email:reqBody.email,
                password:hashed_password,
                privelege:reqBody.privelege
            })
        }
        return res.send({
            approved:true
        })
    }
})

app.listen(3000,()=>{
    console.log("listening at port 3000")
})