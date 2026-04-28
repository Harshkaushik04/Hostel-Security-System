import express from "express"
import cors from "cors"
import { Request,Response,NextFunction } from "express"
import {CustomSchemas,CustomTypes} from "@my-app/shared"
import {z} from "zod"
import jwt from "jsonwebtoken"
import { UserModel,AdminModel,EmergencyModel,CamerasModel,VisitorsModel,HostelsModel,NotificationsModel} from "./db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url";
import mongoose from "mongoose" 
import QRCode from 'qrcode';
import WebSocket,{WebSocketServer} from "ws";
import { createServer } from "http"
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import multer from "multer";
import { parse } from "csv-parse/sync";

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 },
})

function normalizeCsvHeader(header: string): string {
    return header.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")
}

function parseCsvRecords(buf: Buffer): Record<string, string>[] {
    const records = parse(buf.toString("utf8"), {
        bom: true,
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
    }) as Record<string, string>[]
    return records.map((row) => {
        const out: Record<string, string> = {}
        for (const [k, v] of Object.entries(row)) {
            out[normalizeCsvHeader(k)] = String(v ?? "").trim()
        }
        return out
    })
}

const app=express()
app.use(cors({
    origin:"*"
}))
app.use(express.json())

const server = createServer(app);
const wss = new WebSocketServer({server})
/** Each authenticated admin WS maps to their admin.allocatedHostel (literal "all" = see all hostels). */
const notificationClients = new Map<WebSocket, string>()

function adminCanSeeHostel(allocatedHostel: string, targetHostel: string): boolean {
    if (allocatedHostel === "all") return true
    return allocatedHostel === targetHostel
}

const JWT_SECRET=process.env.JWT_SECRET
const MONGO_URL=process.env.MONGO_URL

if(!JWT_SECRET){
    throw new Error("JWT_SECRET not present in .env")
}
if(!MONGO_URL){
    throw new Error("MONGO_URL not present in .env")
}
mongoose.connect(MONGO_URL as string)
.then(() => {
    console.log("Successfully connected to MongoDB");
})
.catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1); // Kill the Node server immediately if DB is unreachable
});

wss.on("connection", function (ws: WebSocket) {
    ws.on("message", async (msg: WebSocket.RawData) => {
        try {
            const json_message = JSON.parse(msg.toString()) as {
                type?: string
                token?: string
            }
            if (
                json_message?.type === "notification-auth" &&
                typeof json_message.token === "string"
            ) {
                const decryptedData = jwt.verify(
                    json_message.token,
                    JWT_SECRET as string
                ) as jwt.JwtPayload
                const admin = await AdminModel.findOne({
                    email: decryptedData.email,
                })
                if (admin?.allocatedHostel) {
                    notificationClients.set(ws, admin.allocatedHostel as string)
                }
            }
        } catch (e) {
            console.log("[notification-ws]", e)
        }
    })
    ws.on("close", () => {
        notificationClients.delete(ws)
    })
})

type CsvAdminGate =
    | { ok: true; host: { privelege: string } }
    | { ok: false; reason: "no_token" | "no_admin" }

async function getAdminForCsv(req: Request): Promise<CsvAdminGate> {
    let token = req.headers.token
    if (!token) {
        return { ok: false, reason: "no_token" }
    }
    token = token as string
    const decryptedData = jwt.verify(token, JWT_SECRET as string) as jwt.JwtPayload
    const host = await AdminModel.findOne({
        email: decryptedData.email,
    })
    if (!host) {
        return { ok: false, reason: "no_admin" }
    }
    return { ok: true, host: { privelege: host.privelege as string } }
}

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
        await NotificationsModel.create({
            hostelName:cameraFound.hostelName,
            message,
            kind:"face_entry",
            cameraName:cameraName,
        })
        for(const [wsConn, allocated] of notificationClients){
            if(!adminCanSeeHostel(allocated,cameraFound.hostelName)){
                continue
            }
            try{
                if(wsConn.readyState===WebSocket.OPEN){
                    wsConn.send(JSON.stringify({
                        message:message
                    }))
                }
            }
            catch(_){
                // ignore send errors
            }
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
        const qr_data:CustomTypes.fastapi.internalQrDataType=reqBody.qr_data;
        const host_email:string=qr_data.host_email;
        const guest_name:string=qr_data.guest_name;
        const guest_contact_number:string=qr_data.guest_contact_number;
        const cameraFound=await CamerasModel.findOne({
            cameraName:cameraName
        })
        if(!cameraFound) return res.status(401).json({ error: 'camera not found'})
        console.log("[camera-found]")
        const host=await UserModel.findOne({
            email:host_email,
            hostel_name:cameraFound.hostelName
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
        await NotificationsModel.create({
            hostelName:cameraFound.hostelName,
            message,
            kind:"visitor_qr",
            cameraName:cameraName,
        })
        for(const [wsConn, allocated] of notificationClients){
            if(!adminCanSeeHostel(allocated,cameraFound.hostelName)){
                continue
            }
            try{
                if(wsConn.readyState == WebSocket.OPEN){
                    wsConn.send(JSON.stringify({
                        message:message
                    }))
                }
            }
            catch(e){
                console.log(`couldnt send notification ws: ${e}`)
            }
        }
        return res.json({
            message:message
        })
    }
})

//=========================== MediaMTX->node_backend recordings save ============================
const RECORDINGS_BASE_DIR = '/home/harsh/recordings';
const recordingProcesses = new Map<string, ChildProcess>();

// Make sure base directory exists
if (!fs.existsSync(RECORDINGS_BASE_DIR)) {
    fs.mkdirSync(RECORDINGS_BASE_DIR, { recursive: true });
}

/*
  1. START RECORDING (Save from MediaMTX)
  Body: { cameraName: "camera1" }
 */
app.post('/recordings/start', (req: Request, res: Response) => {
    const cameraName = req.query.cameraName as string;
    if (!cameraName) return res.status(400).json({ error: 'cameraName is required' });

    if (recordingProcesses.has(cameraName)) {
        return res.status(400).json({ error: `Recording already running for ${cameraName}` });
    }

    const cameraDir = path.join(RECORDINGS_BASE_DIR, cameraName);
    if (!fs.existsSync(cameraDir)) {
        fs.mkdirSync(cameraDir, { recursive: true });
    }
    // Connects to your local MediaMTX container
    const rtspUrl = `rtsp://${process.env.MEDIAMTX_IP || 'localhost'}:8554/${cameraName}`;
    const outputPattern = path.join(cameraDir, '%Y-%m-%d_%H-%M-%S.mp4');

    const ffmpegArgs = [
        '-rtsp_transport', 'tcp',
        '-timeout', '5000000',
        '-fflags', '+genpts',
        '-i', rtspUrl,
        '-c:v', 'copy',
        '-an',
        '-f', 'segment',
        '-segment_time', '30',
        '-segment_format', 'mp4',
        '-segment_format_options', 'movflags=+faststart',
        '-reset_timestamps', '1',
        '-strftime', '1',
        outputPattern
    ];
    let ffmpeg:ChildProcess = spawn('ffmpeg', ffmpegArgs);
    recordingProcesses.set(cameraName, ffmpeg);

    ffmpeg.stderr?.on('data', (data) => {
        const message = data.toString().trim();
        if (message.length > 0) {
            console.log(`[FFmpeg ${cameraName}] ${message}`);
        }
    });

    ffmpeg.on('close', (code) => {
        if (code === 0 || code === null) {
            console.log(`Recording stopped for ${cameraName} (Code: ${code})`);
        } else {
            console.error(`Recording crashed for ${cameraName} (Code: ${code})`);
        }
        recordingProcesses.delete(cameraName);
    });

    return res.json({ message: `Recording started for ${cameraName}` });
});

/*
  2. STOP RECORDING
  Body: { cameraName: "camera1" }
 */
app.post('/recordings/stop', (req: Request, res: Response) => {
    const cameraName  = req.query.cameraName as string;
    const ffmpegProcess = recordingProcesses.get(cameraName);

    if (!ffmpegProcess) {
        return res.status(400).json({ error: 'No active recording found' });
    }

    // SIGINT allows FFmpeg to safely finalize the MP4 file before closing
    ffmpegProcess.kill('SIGINT');
    recordingProcesses.delete(cameraName);

    return res.json({ message: `Recording stopped for ${cameraName}` });
});

//=========================== Frontend->node_backend recordings quering ============================
/*
  1. GET LIST OF RECORDINGS
  Example: GET /recordings/camera1
 */
type singleCameraType={
    cameraName:string
}
type singleCameraTypeWthFileNameType={
    cameraName:string,
    filename:string
}

app.get('/recordings/:cameraName', (req: Request, res: Response) => {
    const { cameraName } = req.params as singleCameraType;
    const cameraDir = path.join(RECORDINGS_BASE_DIR, cameraName);

    if (!fs.existsSync(cameraDir)) {
        return res.json({ files: [] });
    }

    const files = fs.readdirSync(cameraDir)
        .filter(file => file.endsWith('.mp4'))
        .sort(); // Chronological order based on timestamp filenames

    // While recording, the newest segment can still be open and not playable yet.
    const playableFiles = recordingProcesses.has(cameraName) ? files.slice(0, -1) : files;

    return res.json({ files: playableFiles });
});

/*
  2. STREAM RECORDING (Supports Play, Pause, Seek natively)
  Example: GET /recordings/stream/camera1/2026-04-28_12-00-00.mp4
 */
app.get('/recordings/stream/:cameraName/:filename', (req: Request, res: Response) => {
    const { cameraName, filename } = req.params as singleCameraTypeWthFileNameType;
    const videoPath = path.join(RECORDINGS_BASE_DIR, cameraName, filename);
    const cameraDir = path.join(RECORDINGS_BASE_DIR, cameraName);

    if (!fs.existsSync(videoPath)) {
        return res.status(404).send('Video file not found');
    }

    if (recordingProcesses.has(cameraName) && fs.existsSync(cameraDir)) {
        const mp4Files = fs.readdirSync(cameraDir)
            .filter(file => file.endsWith('.mp4'))
            .sort();
        const latestFile = mp4Files[mp4Files.length - 1];
        if (latestFile === filename) {
            return res.status(409).send('Recording is still in progress for this file. Try an older segment or stop recording first.');
        }
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        // The browser is asking for a specific chunk (Seeking or continuing playback)
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        // 206 Partial Content is critical for pausing/seeking to work
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        // Fallback if the browser doesn't send a Range header (rare for modern <video> tags)
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
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

app.post("/fetch-previous-notifications",async (req:Request,res:Response)=>{
    try{
        const kRaw=(req.body as { k?: number }).k ?? 20
        const k=Math.min(200,Math.max(1,Number(kRaw)||20))
        let token=req.headers.token;
        if(!token){
            return res.json({
                error:"req.headers.token is null"
            })
        }
        token = token as string;
        const decryptedData=jwt.verify(token,JWT_SECRET as string) as jwt.JwtPayload;
        const admin=await AdminModel.findOne({
            email:decryptedData.email
        })
        if(!admin){
            return res.json({
                error:"admin users only"
            })
        }
        const query: Record<string, unknown>={}
        if(admin.allocatedHostel!=="all"){
            query.hostelName=admin.allocatedHostel
        }
        const docs=await NotificationsModel.find(query)
            .sort({ createdAt: -1 })
            .limit(k)
            .lean()
        return res.json({
            notifications:docs,
        })
    }
    catch{
        return res.status(401).json({ error:"invalid token" })
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

//=========================== Camera -- hostel (CamerasModel) ============================
app.post("/get-cameras-list", async (req: Request, res: Response) => {
    let token = req.headers.token;
    if(!token){
        return res.json({
            error:"req.headers.token is null"
        })
    }
    token = token as string;
    try {
        const decryptedData=jwt.verify(token,JWT_SECRET) as jwt.JwtPayload;
        const admin = await AdminModel.findOne({
            email:decryptedData.email
        })
        if(!admin){
            return res.json({
                error:"admin users only"
            })
        }
        const camQuery: Record<string, unknown>={}
        if(admin.allocatedHostel!=="all"){
            camQuery.hostelName=admin.allocatedHostel
        }
        const docs = await CamerasModel.find(camQuery).sort({ cameraName: 1 })
        const cameras = docs.map((d) => ({
            cameraName: d.cameraName,
            hostelName: d.hostelName,
        }))
        return res.json({ cameras })
    } catch {
        return res.status(401).json({ error: "invalid token" })
    }
})

app.post("/add-camera", async (req: Request, res: Response) => {
    const reqCheck = CustomSchemas.manageUsers.AddCameraRequestSchema.safeParse(req.body)
    if(!reqCheck.success){
        return res.send({
            approved:false,
            error:`request schema invalid\n${reqCheck.error}`
        })
    }
    let token = req.headers.token;
    if(!token){
        return res.json({
            error:"req.headers.token is null"
        })
    }
    token = token as string;
    const decryptedData=jwt.verify(token,JWT_SECRET) as jwt.JwtPayload;
    const host = await AdminModel.findOne({
        email:decryptedData.email
    })
    if(!host){
        return res.json({
            error:"host user not in db"
        })
    }
    if(host.privelege==="gaurd"){
        return res.json({
            error:"gaurd privelege cant manage cameras"
        })
    }
    const reqBody: CustomTypes.manageUsers.AddCameraRequestType = req.body
    const hostelOk = await HostelsModel.findOne({
        hostel_name: reqBody.hostelName
    })
    if(!hostelOk){
        return res.send({
            approved:false,
            error:"hostel does not exist — add it first under Manage hostels"
        })
    }
    if(host.allocatedHostel!=="all" && reqBody.hostelName!==host.allocatedHostel){
        return res.send({
            approved:false,
            error:"cannot assign camera to a hostel outside your allocation"
        })
    }
    const dup = await CamerasModel.findOne({
        cameraName: reqBody.cameraName
    })
    if(dup){
        return res.send({
            approved:false,
            error:"camera name already exists"
        })
    }
    await CamerasModel.create({
        cameraName: reqBody.cameraName,
        hostelName: reqBody.hostelName,
    })
    return res.send({
        approved:true
    })
})

app.post("/edit-camera", async (req: Request, res: Response) => {
    const reqCheck = CustomSchemas.manageUsers.EditCameraRequestSchema.safeParse(req.body)
    if(!reqCheck.success){
        return res.send({
            approved:false,
            error:`request schema invalid\n${reqCheck.error}`
        })
    }
    let token = req.headers.token;
    if(!token){
        return res.json({
            error:"req.headers.token is null"
        })
    }
    token = token as string;
    const decryptedData=jwt.verify(token,JWT_SECRET) as jwt.JwtPayload;
    const host = await AdminModel.findOne({
        email:decryptedData.email
    })
    if(!host){
        return res.json({
            error:"host user not in db"
        })
    }
    if(host.privelege==="gaurd"){
        return res.json({
            error:"gaurd privelege cant manage cameras"
        })
    }
    const reqBody: CustomTypes.manageUsers.EditCameraRequestType = req.body
    const hostelOk = await HostelsModel.findOne({
        hostel_name: reqBody.hostelName
    })
    if(!hostelOk){
        return res.send({
            approved:false,
            error:"hostel does not exist — add it first under Manage hostels"
        })
    }
    const row = await CamerasModel.findOne({
        cameraName: reqBody.cameraName
    })
    if(!row){
        return res.send({
            approved:false,
            error:"camera not found"
        })
    }
    if(host.allocatedHostel!=="all"){
        if(row.hostelName!==host.allocatedHostel){
            return res.send({
                approved:false,
                error:"cannot edit cameras outside your hostel allocation"
            })
        }
        if(reqBody.hostelName!==host.allocatedHostel){
            return res.send({
                approved:false,
                error:"cannot reassign camera to another hostel"
            })
        }
    }
    const nextName = reqBody.newCameraName?.trim()
    if(nextName && nextName !== row.cameraName){
        const clash = await CamerasModel.findOne({
            cameraName: nextName
        })
        if(clash){
            return res.send({
                approved:false,
                error:"new camera name already in use"
            })
        }
        row.cameraName = nextName
    }
    row.hostelName = reqBody.hostelName
    await row.save()
    return res.send({
        approved:true
    })
})

app.post("/delete-camera", async (req: Request, res: Response) => {
    const reqCheck = CustomSchemas.manageUsers.DeleteCameraRequestSchema.safeParse(req.body)
    if(!reqCheck.success){
        return res.send({
            approved:false,
            error:`request schema invalid\n${reqCheck.error}`
        })
    }
    let token = req.headers.token;
    if(!token){
        return res.json({
            error:"req.headers.token is null"
        })
    }
    token = token as string;
    const decryptedData=jwt.verify(token,JWT_SECRET) as jwt.JwtPayload;
    const host = await AdminModel.findOne({
        email:decryptedData.email
    })
    if(!host){
        return res.json({
            error:"host user not in db"
        })
    }
    if(host.privelege==="gaurd"){
        return res.json({
            error:"gaurd privelege cant manage cameras"
        })
    }
    const reqBody: CustomTypes.manageUsers.DeleteCameraRequestType = req.body
    const existing = await CamerasModel.findOne({
        cameraName: reqBody.cameraName
    })
    if(!existing){
        return res.send({
            approved:false,
            error:"camera not found"
        })
    }
    if(host.allocatedHostel!=="all" && existing.hostelName!==host.allocatedHostel){
        return res.send({
            approved:false,
            error:"cannot delete cameras outside your hostel allocation"
        })
    }
    await CamerasModel.deleteOne({
        cameraName: reqBody.cameraName
    })
    return res.send({
        approved:true
    })
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

app.post(
    "/upload-student-csv",
    csvUpload.single("file"),
    async (req: Request, res: Response) => {
        const gate = await getAdminForCsv(req)
        if (!gate.ok) {
            if (gate.reason === "no_token") {
                return res.json({
                    error: "req.headers.token is null",
                })
            }
            return res.json({
                error: "host user not in db",
            })
        }
        const { host } = gate
        if (host.privelege === "gaurd") {
            return res.json({
                error: "gaurd privelege cant add students",
            })
        }
        const f = req.file
        if (!f?.buffer) {
            return res.status(400).json({
                approved: false,
                error: "no file — use multipart field name: file",
            })
        }
        let rows: Record<string, string>[]
        try {
            rows = parseCsvRecords(f.buffer)
        } catch (e) {
            return res.status(400).json({
                approved: false,
                error: e instanceof Error ? e.message : "invalid csv",
            })
        }
        if (rows.length === 0) {
            return res.json({
                approved: false,
                error: "csv has no data rows",
            })
        }
        const rowErrors: { row: number; message: string }[] = []
        let created = 0
        let skipped = 0
        const maxErrors = 100
        for (let i = 0; i < rows.length; i++) {
            const rowNum = i + 2
            const r = rows[i]
            const name = r.name
            const email = r.email
            const password = r.password
            const entry_number = r.entry_number
            const hostel_name = r.hostel_name
            if (!name || !email || !password || !entry_number || !hostel_name) {
                rowErrors.push({
                    row: rowNum,
                    message:
                        "missing column — need name, email, password, entry_number, hostel_name",
                })
                skipped++
                if (rowErrors.length >= maxErrors) break
                continue
            }
            const dup = await UserModel.findOne({
                $or: [{ email }, { entry_number }],
            })
            if (dup) {
                rowErrors.push({
                    row: rowNum,
                    message: "duplicate email or entry_number",
                })
                skipped++
                if (rowErrors.length >= maxErrors) break
                continue
            }
            try {
                const hashed_password = await bcrypt.hash(password, 5)
                await UserModel.create({
                    name,
                    email,
                    password: hashed_password,
                    entry_number,
                    hostel_name,
                })
                created++
            } catch (err) {
                rowErrors.push({
                    row: rowNum,
                    message:
                        err instanceof Error ? err.message : "insert failed",
                })
                skipped++
                if (rowErrors.length >= maxErrors) break
            }
        }
        return res.json({
            approved: true,
            created,
            skipped,
            rowErrors,
        })
    }
)

app.post(
    "/upload-admin-csv",
    csvUpload.single("file"),
    async (req: Request, res: Response) => {
        const gate = await getAdminForCsv(req)
        if (!gate.ok) {
            if (gate.reason === "no_token") {
                return res.json({
                    error: "req.headers.token is null",
                })
            }
            return res.json({
                error: "host user not in db",
            })
        }
        const { host } = gate
        if (host.privelege === "gaurd") {
            return res.json({
                error: "gaurd privelege cant add admins",
            })
        }
        const f = req.file
        if (!f?.buffer) {
            return res.status(400).json({
                approved: false,
                error: "no file — use multipart field name: file",
            })
        }
        let rows: Record<string, string>[]
        try {
            rows = parseCsvRecords(f.buffer)
        } catch (e) {
            return res.status(400).json({
                approved: false,
                error: e instanceof Error ? e.message : "invalid csv",
            })
        }
        if (rows.length === 0) {
            return res.json({
                approved: false,
                error: "csv has no data rows",
            })
        }
        const validPriv = new Set(["super_user", "top_privelege", "gaurd"])
        const rowErrors: { row: number; message: string }[] = []
        let created = 0
        let skipped = 0
        const maxErrors = 100
        for (let i = 0; i < rows.length; i++) {
            const rowNum = i + 2
            const r = rows[i]
            const name = r.name
            const email = r.email
            const password = r.password
            const privelege = r.privelege
            const allocatedHostel =
                r.allocated_hostel || r.allocatedhostel || ""
            if (!name || !email || !password || !privelege || !allocatedHostel) {
                rowErrors.push({
                    row: rowNum,
                    message:
                        "missing column — need name, email, password, privelege, allocated_hostel",
                })
                skipped++
                if (rowErrors.length >= maxErrors) break
                continue
            }
            if (!validPriv.has(privelege)) {
                rowErrors.push({
                    row: rowNum,
                    message: `invalid privelege (use super_user, top_privelege, gaurd): ${privelege}`,
                })
                skipped++
                if (rowErrors.length >= maxErrors) break
                continue
            }
            if (host.privelege === "top_privelege" && privelege === "super_user") {
                rowErrors.push({
                    row: rowNum,
                    message: "top_privelege cant add super_user",
                })
                skipped++
                if (rowErrors.length >= maxErrors) break
                continue
            }
            const dup = await AdminModel.findOne({
                email,
            })
            if (dup) {
                rowErrors.push({
                    row: rowNum,
                    message: "duplicate email",
                })
                skipped++
                if (rowErrors.length >= maxErrors) break
                continue
            }
            try {
                const hashed_password = await bcrypt.hash(password, 5)
                await AdminModel.create({
                    name,
                    email,
                    password: hashed_password,
                    privelege,
                    allocatedHostel,
                })
                created++
            } catch (err) {
                rowErrors.push({
                    row: rowNum,
                    message:
                        err instanceof Error ? err.message : "insert failed",
                })
                skipped++
                if (rowErrors.length >= maxErrors) break
            }
        }
        return res.json({
            approved: true,
            created,
            skipped,
            rowErrors,
        })
    }
)

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

app.post("/delete",async (req:Request,res:Response)=>{
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
        return res.json({
            error:"host is unregistered"
        })
    }

    const qrPayload = {
      ...inviteData,
      host_email:host_email,
      hostel_name:found.hostel_name,
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
        hostel_name:found.hostel_name,
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
