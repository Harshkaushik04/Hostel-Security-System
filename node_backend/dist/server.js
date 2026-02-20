"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const shared_1 = require("@my-app/shared");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = require("./db.js");
const bcrypt_1 = __importDefault(require("bcrypt"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const JWT_SECRET = "random_num_1";
function authMiddleware(req, res, next) {
    if (req.headers.token) {
        try {
            const decryptedData = jsonwebtoken_1.default.verify(req.headers.token, JWT_SECRET);
            return next();
        }
        catch (e) {
            return res.send({
                valid: false,
                error: "jwt is wrong"
            });
        }
    }
    else {
        return res.send({
            valid: false,
            error: "no jwt"
        });
    }
}
// app.get("/",(req:Request,res:Response)=>{
//     // 
//     return res.send({
//         "message":"hello"
//     })
// })
app.post("/student-sign-in", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`entered [student-sign-in]`);
    const studentSignInRequestCheck = shared_1.CustomSchemas.auth.SignInRequestSchema.safeParse(req.body);
    if (!studentSignInRequestCheck.success) {
        return res.send({
            valid: false,
            error: `wrong request structure\n${studentSignInRequestCheck.error}`
        });
    }
    else {
        const reqBody = req.body;
        if (req.headers.token) {
            try {
                //@ts-ignore
                const decryptedData = jsonwebtoken_1.default.verify(req.headers.token, JWT_SECRET);
                if (decryptedData.email == reqBody.email) {
                    const user = yield db_js_1.UserModel.findOne({
                        email: reqBody.email
                    });
                    if (!user) {
                        return res.send({
                            valid: false,
                            error: "user not found in database"
                        });
                    }
                    else {
                        const whetherSamePassword = yield bcrypt_1.default.compare(reqBody.password, user.password);
                        if (whetherSamePassword) {
                            return res.send({
                                valid: true
                            });
                        }
                        else {
                            return res.send({
                                valid: false,
                                error: "wrong password"
                            });
                        }
                    }
                }
                else {
                    const user = yield db_js_1.UserModel.findOne({
                        email: reqBody.email
                    });
                    if (!user) {
                        return res.send({
                            valid: false,
                            error: "user not found in database"
                        });
                    }
                    else {
                        const whetherSamePassword = yield bcrypt_1.default.compare(reqBody.password, user.password);
                        if (whetherSamePassword) {
                            const jwt_token = jsonwebtoken_1.default.sign({
                                email: reqBody.email
                            }, JWT_SECRET);
                            return res.send({
                                valid: true,
                                token: jwt_token
                            });
                        }
                        else {
                            return res.send({
                                valid: false,
                                error: "wrong password"
                            });
                        }
                    }
                }
            }
            catch (e) {
                const user = yield db_js_1.UserModel.findOne({
                    email: reqBody.email
                });
                if (!user) {
                    return res.send({
                        valid: false,
                        error: "user not found in database"
                    });
                }
                else {
                    const jwt_token = jsonwebtoken_1.default.sign({
                        email: reqBody.email
                    }, JWT_SECRET);
                    return res.send({
                        valid: true,
                        token: jwt_token
                    });
                }
            }
        }
        else {
            const user = yield db_js_1.UserModel.findOne({
                email: reqBody.email
            });
            if (!user) {
                return res.send({
                    valid: false,
                    error: "user not found in database"
                });
            }
            else {
                const whetherSamePassword = yield bcrypt_1.default.compare(reqBody.password, user.password);
                if (whetherSamePassword) {
                    const jwt_token = jsonwebtoken_1.default.sign({
                        email: reqBody.email
                    }, JWT_SECRET);
                    return res.send({
                        valid: true,
                        token: jwt_token
                    });
                }
                else {
                    return res.send({
                        valid: false,
                        error: "wrong password"
                    });
                }
            }
        }
    }
}));
app.post("/admin-sign-in", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`entered [admin-sign-in]`);
    const adminSignInRequestCheck = shared_1.CustomSchemas.auth.SignInRequestSchema.safeParse(req.body);
    if (!adminSignInRequestCheck.success) {
        return res.send({
            valid: false,
            error: `wrong request structure\n${adminSignInRequestCheck.error}`
        });
    }
    else {
        const reqBody = req.body;
        if (req.headers.token) {
            try {
                //@ts-ignore
                const decryptedData = jsonwebtoken_1.default.verify(req.headers.token, JWT_SECRET);
                if (decryptedData.email == reqBody.email) {
                    const user = yield db_js_1.AdminModel.findOne({
                        email: reqBody.email
                    });
                    if (!user) {
                        return res.send({
                            valid: false,
                            error: "user not found in database"
                        });
                    }
                    else {
                        const whetherSamePassword = yield bcrypt_1.default.compare(reqBody.password, user.password);
                        if (whetherSamePassword) {
                            return res.send({
                                valid: true
                            });
                        }
                        else {
                            return res.send({
                                valid: false,
                                error: "wrong password"
                            });
                        }
                    }
                }
                else {
                    const user = yield db_js_1.AdminModel.findOne({
                        email: reqBody.email
                    });
                    if (!user) {
                        return res.send({
                            valid: false,
                            error: "user not found in database"
                        });
                    }
                    else {
                        const whetherSamePassword = yield bcrypt_1.default.compare(reqBody.password, user.password);
                        if (whetherSamePassword) {
                            const jwt_token = jsonwebtoken_1.default.sign({
                                email: reqBody.email
                            }, JWT_SECRET);
                            return res.send({
                                valid: true,
                                token: jwt_token
                            });
                        }
                        else {
                            return res.send({
                                valid: false,
                                error: "wrong password"
                            });
                        }
                    }
                }
            }
            catch (e) {
                const user = yield db_js_1.AdminModel.findOne({
                    email: reqBody.email
                });
                if (!user) {
                    return res.send({
                        valid: false,
                        error: "user not found in database"
                    });
                }
                else {
                    const jwt_token = jsonwebtoken_1.default.sign({
                        email: reqBody.email
                    }, JWT_SECRET);
                    return res.send({
                        valid: true,
                        token: jwt_token
                    });
                }
            }
        }
        else {
            const user = yield db_js_1.AdminModel.findOne({
                email: reqBody.email
            });
            if (!user) {
                return res.send({
                    valid: false,
                    error: "user not found in database"
                });
            }
            else {
                const whetherSamePassword = yield bcrypt_1.default.compare(reqBody.password, user.password);
                if (whetherSamePassword) {
                    const jwt_token = jsonwebtoken_1.default.sign({
                        email: reqBody.email
                    }, JWT_SECRET);
                    return res.send({
                        valid: true,
                        token: jwt_token
                    });
                }
                else {
                    return res.send({
                        valid: false,
                        error: "wrong password"
                    });
                }
            }
        }
    }
}));
app.use(authMiddleware);
app.post("/invite", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`entered [invite]`);
    const inviteCheck = shared_1.CustomSchemas.invite.InviteRequestSchema.safeParse(req.body);
    if (!inviteCheck.success) {
        return res.send({
            approved: false,
            error: "request schema invalid"
        });
    }
    else {
        const reqBody = req.body; // host_email,guest_name,guest_contact_number
        const user = yield db_js_1.UserModel.findOne({
            email: reqBody.host_email
        });
        if (!user) {
            return res.send({
                approved: false,
                error: "host email not found in database"
            });
        }
        else {
            yield db_js_1.InviteModel.create({
                host_email: reqBody.host_email,
                guest_name: reqBody.guest_name,
                guest_contact_number: reqBody.guest_contact_number
            });
            return res.send({
                approved: true
            });
        }
    }
}));
app.get("/emergencies", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`entered [emergencies]`);
    const emergencies = yield db_js_1.EmergencyModel.findOne({
        name: "main"
    });
    if (!emergencies) {
        return res.send({
            error: "no emergencies found"
        });
    }
    else {
        return res.send({
            info: emergencies.info
        });
    }
}));
app.listen(3000, () => {
    console.log("listening at port 3000");
});
