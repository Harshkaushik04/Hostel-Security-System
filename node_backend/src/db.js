"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorsModel = exports.camerasModel = exports.EmergencyModel = exports.InviteModel = exports.AdminModel = exports.UserModel = void 0;
var mongoose_1 = require("mongoose");
var dotenv_1 = require("dotenv");
var path_1 = require("path");
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, "../.env")
});
var MONGO_URL = process.env.MONGO_URL;
var users = new mongoose_1.default.Schema({
    name: String,
    email: String,
    password: String,
    entry_number: String,
    hostel_name: String
});
var admin = new mongoose_1.default.Schema({
    name: String,
    email: String,
    password: String,
    privelege: String
});
var invites = new mongoose_1.default.Schema({
    host_email: String,
    guest_name: String,
    guest_contact_number: String
});
var emergencies = new mongoose_1.default.Schema({
    name: String,
    info: {
        type: Map,
        of: String
    }
});
var cameras = new mongoose_1.default.Schema({
    cameraName: String,
    hostelName: String
});
var visitors = new mongoose_1.default.Schema({
    host_email: String,
    guest_name: String,
    guest_contact_number: String
});
exports.UserModel = mongoose_1.default.model("users", users);
exports.AdminModel = mongoose_1.default.model("admin", admin);
exports.InviteModel = mongoose_1.default.model("invites", invites);
exports.EmergencyModel = mongoose_1.default.model("emergencies", emergencies);
exports.camerasModel = mongoose_1.default.model("cameras", cameras);
exports.visitorsModel = mongoose_1.default.model("visitors", visitors);
exports.camerasModel.create({ "cameraName": "camera3", "hostelName": "chenab west" });
