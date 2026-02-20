"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyModel = exports.InviteModel = exports.AdminModel = exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, "../.env")
});
const MONGO_URL = process.env.MONGO_URL;
const users = new mongoose_1.default.Schema({
    name: String,
    email: String,
    password: String
});
const admin = new mongoose_1.default.Schema({
    name: String,
    email: String,
    password: String,
    privelege: String
});
const invites = new mongoose_1.default.Schema({
    host_email: String,
    guest_name: String,
    guest_contact_number: String
});
//every info on name="main"
const emergencies = new mongoose_1.default.Schema({
    name: String,
    info: {
        type: Map,
        of: String
    }
});
exports.UserModel = mongoose_1.default.model("users", users);
exports.AdminModel = mongoose_1.default.model("admin", admin);
exports.InviteModel = mongoose_1.default.model("invites", invites);
exports.EmergencyModel = mongoose_1.default.model("emergencies", emergencies);
