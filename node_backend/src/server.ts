import express from "express"
import cors from "cors"
import { Request,Response,NextFunction } from "express"
import {CustomSchemas,CustomTypes} from "@my-app/shared"
import {z} from "zod"
import jwt from "jsonwebtoken"
import { UserModel,AdminModel,EmergencyModel,CamerasModel,VisitorsModel,HostelsModel} from "./db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url";
import mongoose from "mongoose" 
import QRCode from 'qrcode';
import WebSocket,{WebSocketServer} from "ws";
import { createServer } from "http"

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const app=express()
app.use(cors({
    origin:"*"
}))
app.use(express.json())

const server = createServer(app);
const wss = new WebSocketServer({server})
let list_ws:WebSocket[]=[]

wss.on("connection",function(ws:WebSocket){
    list_ws.push(ws)
    ws.on("message",(msg:WebSocket.RawData)=>{
        const json_message=JSON.parse(msg.toString());
        console.log(json_message)
    })
    ws.onclose=()=>{
        list_ws=list_ws.filter(websocket => websocket!=ws)
    }
})

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


app.post("/face-data",async (req:Request,res:Response)=>{
    console.log(`entered [face-data]`)
    const reqCheck = CustomSchemas.fastapi.faceDataSchema.safeParse(req.body)
    if(!reqCheck.success){
        return res.send({
            approved:false,
            error:`request schema wrong\n${reqCheck.error}`
        })
    }
    else{
        const reqBody:CustomTypes.fastapi.faceDataType=req.body;
        const cameraName:string=reqBody.cameraName;
        const name:string=reqBody.name;
        const cameraFound=await CamerasModel.findOne({
            cameraName:cameraName
        })
        if(!cameraFound) return res.status(401).json({ error: 'camera not found'})
        const user=await UserModel.findOne({
            name:name
        })
        if((!user) || (user.hostel_name!=cameraFound.hostelName)){
            return res.status(401).json({error:'not permitted'})
        }
        console.log(`${name} found`)
        const message=`${name} entered in ${cameraFound.hostelName}`
        for(const ws of list_ws){
            ws.send(JSON.stringify({
                message:message
            }))
        }
        return res.json({
            message:message
        })
    }
})

app.post("/qr-data",async (req:Request,res:Response)=>{
    console.log(`entered [qr-data]`)
    const reqCheck = CustomSchemas.fastapi.qrDataSchema.safeParse(req.body)
    if(!reqCheck.success){
        console.log("[reqcheck-failure]")
        console.log("req.body:")
        for(const [k,v] of Object.entries(req.body)){
            console.log(`${k}:${v}`)
        }
        return res.send({
            approved:false,
            error:`request schema wrong\n${reqCheck.error}`
        })
    }
    else{
        console.log("[reqcheck-success]")
        const reqBody:CustomTypes.fastapi.qrDataType=req.body;
        const cameraName:string=reqBody.cameraName;
        const host_email:string=reqBody.host_email;
        const guest_name:string=reqBody.guest_name;
        const guest_contact_number:string=reqBody.guest_contact_number;
        const cameraFound=await CamerasModel.findOne({
            cameraName:cameraName
        })
        if(!cameraFound) return res.status(401).json({ error: 'camera not found'})
        console.log("[camera-found]")
        const host=await UserModel.findOne({
            email:host_email
        })
        const visitor=await VisitorsModel.findOne({
            host_email:host_email,
            guest_name:guest_name,
            guest_contact_number:guest_contact_number
        })
        if(!host || !visitor){
            return res.send(401).json({error:'not permitted'})
        }
        console.log("[host and visitor found]")
        await VisitorsModel.deleteOne({
            host_email:host_email,
            guest_name:guest_name,
            guest_contact_number:guest_contact_number
        })
        const message=`${guest_name} with phone number ${guest_contact_number} entered in ${cameraFound.hostelName} with host ${host.name}`;
        for(const ws of list_ws){
            try{
                if(ws.readyState == WebSocket.OPEN){
                    ws.send(JSON.stringify({
                        message:message
                    }))
                }
            }
            catch(e){
                console.log(`couldnt send to a ws connection,length of ws_list=${list_ws.length}`)
            }
        }
        return res.json({
            message:message
        })
    }
})


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

// app.post("/invite", async(req:Request,res:Response)=>{
//     console.log(`entered [invite]`)
//     const inviteCheck = CustomSchemas.invite.InviteRequestSchema.safeParse(req.body)
//     if(!inviteCheck.success){
//         return res.send({
//             approved:false,
//             error:`request schema invalid\n${inviteCheck.error}`
//         })
//     }
//     else{
//         const reqBody:CustomTypes.invite.InviteRequestType=req.body // host_email,guest_name,guest_contact_number
//         const user = await UserModel.findOne({
//             email:reqBody.host_email
//         })
//         if(!user){
//             return res.send({
//                 approved:false,
//                 error:"host email not found in database"
//             })
//         }
//         else{
//             await InviteModel.create({
//                 host_email:reqBody.host_email,
//                 guest_name:reqBody.guest_name,
//                 guest_contact_number:reqBody.guest_contact_number
//             })
//             return res.send({
//                 approved:true
//             })
//         }
//     }
// })

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
        const hostelRow=await HostelsModel.findOne({
            hostel_name:reqBody.hostel_name
        })
        if(hostelRow){
            return res.send({
                approved:false,
                error:"duplicate hostel"
            })
        }
        else{
            await HostelsModel.create({
                hostel_name:reqBody.hostel_name,
            })
            return res.send({
                approved:true
            })
        }
    }
})

app.post("/get-hostels-list",async(req:Request,res:Response)=>{
    const docs=await HostelsModel.find()
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
            studentsList.push([doc.name,doc.entry_number,doc.email])
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
            usersList.push([doc.name,doc.email,doc.allocatedHostel])
        }
        return res.send({
            usersList:usersList
        })
    }
})

app.post("/upload-manually",async(req:Request,res:Response)=>{
    const reqCheck = CustomSchemas.manageUsers.UploadManuallyRequestSchema.safeParse(req.body)
    if(!reqCheck.success){
        return res.send({
            approved:false,
            error:`request schema wrong\n${reqCheck.error}`
        })
    }
    else{
        const reqBody:CustomTypes.manageUsers.UploadManuallyRequestType=req.body
        let token=req.headers.token;
        if(!token){
            return res.json({
                error:"req.headers.token is null"
            })
        }
        token = token as string;
        const decryptedData=jwt.verify(token,JWT_SECRET) as jwt.JwtPayload; //will always work because validated in authMiddleware
        const host_email:string=decryptedData.email;
        const host=await AdminModel.findOne({
            email:host_email
        })
        if(!host){
            return res.json({
                error:"host user not in db"
            })
        }
        if(host.privelege=="gaurd"){
            return res.json({
                error:"gaurd privelege cant add students"
            })
        }
        else if(host.privelege=="top_privelege"){
            if(reqBody.type=="admin" && reqBody.privelege=="super_user"){
                return res.json({
                    error:"top_privelege cant add super_user"
                })
            }
        }
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
                privelege:reqBody.privelege,
                allocatedHostel:reqBody.allocatedHostel
            })
        }
        return res.send({
            approved:true
        })
    }
})

app.post("/edit",async (req:Request,res:Response)=>{
    const reqCheck = CustomSchemas.manageUsers.EditRequestSchema.safeParse(req.body);
    if(!reqCheck){
        const error="request schema wrong at server end"
        console.log(error)
        return res.json({
            error:error
        })
    }
    let token=req.headers.token;
    if(!token){
        return res.json({
            error:"req.headers.token is null"
        })
    }
    token = token as string;
    const decryptedData=jwt.verify(token,JWT_SECRET) as jwt.JwtPayload; //will always work because validated in authMiddleware
    const host_email:string=decryptedData.email;
    const host=await AdminModel.findOne({
        email:host_email
    })
    if(!host){
        return res.json({
            error:"host user not in db"
        })
    }
    if(host.privelege=="gaurd"){
        return res.json({
            error:"editing not allowed for gaurd privelege"
        })
    }
    const reqBody:CustomTypes.manageUsers.EditRequestType=req.body;
    if(reqBody.type=="admin"){
        if(reqBody.filterBy!="email"){
            return res.json({
                error:"request filterby other than email"
            })
        }
        let row=await AdminModel.findOne({
            email:reqBody.value
        })
        if(!row){
            return res.json({
                error:"no user found"
            })
        }
        /*
        name:z.string(),
        email:z.string(),
        password:z.string(),
        privelege:z.string(),
        allocatedHostel:z.string()
         */
        if(host.privelege=="top_privelege"){
            if(row.privelege=="top_privelege" || row.privelege=="super_user"){
                return res.json({
                    error:"top_prievelege cant edit other top_privelege and super_user"
                })
            }
            if(reqBody.changed.privelege=="super_user"){
                return res.json({
                    error:"top_privelege cant make someone super_user"
                })
            }
        }
        row.email=reqBody.changed.email;
        row.name=reqBody.changed.name;
        row.password=reqBody.changed.password;
        row.privelege=reqBody.changed.privelege;
        row.allocatedHostel=reqBody.changed.allocatedHostel;
        row.save()
        return res.json({
            approved:true
        })       
    }
    else if(reqBody.type=="student"){
        let row;
        if(reqBody.filterBy=="email"){
            row=await UserModel.findOne({
                email:reqBody.value
            })
        }
        else if(reqBody.filterBy=="entry_number"){
            row=await UserModel.findOne({
                entry_number:reqBody.value
            })
        }
        else{
            return res.json({
                error:"filterBy cant be other than email or entry_number"
            })
        }
        if(!row){
            return res.json({
                error:"no user found"
            })
        }
        row.email=reqBody.changed.email;
        row.name=reqBody.changed.name;
        row.password=reqBody.changed.password;
        row.entry_number=reqBody.changed.entry_number;
        row.hostel_name=reqBody.changed.hostel_name;
        row.save()
        return res.json({
            approved:true
        })     
    }
    else{
        return res.json({
            error:"error: type is neither student nor admin"
        })
    }
})

app.post("delete",async (req:Request,res:Response)=>{
    const reqCheck = CustomSchemas.manageUsers.DeleteRequestSchema.safeParse(req.body)
    if(!reqCheck.success){
        return res.send({
            approved:false,
            error:`request schema wrong\n${reqCheck.error}`
        })
    }
    else{
        const reqBody:CustomTypes.manageUsers.DeleteRequestType=req.body
        let token=req.headers.token;
        if(!token){
            return res.json({
                error:"req.headers.token is null"
            })
        }
        token = token as string;
        const decryptedData=jwt.verify(token,JWT_SECRET) as jwt.JwtPayload; //will always work because validated in authMiddleware
        const host_email:string=decryptedData.email;
        const host=await AdminModel.findOne({
            email:host_email
        })
        if(!host){
            return res.json({
                error:"host user not in db"
            })
        }
        if(host.privelege=="gaurd"){
            return res.json({
                error:"gaurd privelege cant delete students"
            })
        }
        if(reqBody.type=="student"){
            if(reqBody.filterBy=="email"){
                await UserModel.deleteOne({
                    email:reqBody.value
                })
                return res.json({
                    approved:true
                })
            }
            else if(reqBody.filterBy=="entry_number"){
                await UserModel.deleteMany({
                    entry_number:reqBody.value
                })
                return res.json({
                    approved:true
                })
            }
            else{
                return res.json({
                    error:"filterBy not permitted except by email or entry_number"
                })
            }
        }
        //admin delete
        const row=await AdminModel.findOne({
            email:reqBody.value
        })
        if(!row){
            return res.json({
                error:"user not found in db"
            })
        }
        if(host.privelege=="top_privelege" && (row.privelege=="super_user" || row.privelege=="top_privelege")){
            return res.json({
                error:"top_privelege cant delete super_user or top_privelege"
            })
        }
        if(host.privelege=="super_user" && row.privelege=="super_user"){
            return res.json({
                error:"super_user cant be deleted normally"
            })
        }
        await AdminModel.deleteOne({
            email:row.email
        })
        return res.send({
            approved:true
        })
    }
})

app.post('/invite', async (req: Request, res: Response) => {
    console.log(`entered [invite]`)
  try {
    const reqCheck = CustomSchemas.invite.InviteRequestSchema.safeParse(req.body);
    if(!reqCheck.success){
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const inviteData:CustomTypes.invite.InviteRequestType=req.body;
    let token=req.headers.token;
    if(!token){
        return res.json({
            error:"req.headers.token is null"
        })
    }
    token = token as string;
    const decryptedData=jwt.verify(token,JWT_SECRET) as jwt.JwtPayload; //will always work because validated in authMiddleware
    const host_email:string=decryptedData.email;
    const found=await UserModel.findOne({
        email:host_email
    })
    if(!found){
        res.json({
            error:"host is unregistered"
        })
    }
    const qrPayload = {
      ...inviteData,
      invite_id: crypto.randomUUID(), 
      created_at: new Date().toISOString()
    };
    const qrString = JSON.stringify(qrPayload);
    const qrDataUrl = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H', // High error correction 
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    await VisitorsModel.create({
        host_email:host_email,
        guest_name:inviteData.guest_name,
        guest_contact_number:inviteData.guest_contact_number
    })
    return res.status(200).json({
      approved: true,
      message: 'Invite successfully created',
      qrCode: qrDataUrl
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return res.status(500).json({ error: 'Failed to generate invite' });
  }
});

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

server.listen(PORT,  () => {
  console.log(`Server running on port ${PORT}`);
});