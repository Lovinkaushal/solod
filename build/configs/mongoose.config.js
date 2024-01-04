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
const mongoose_1 = __importDefault(require("mongoose"));
let mongoURI = process.env.MONGODB_URI;
let mongoDB = process.env.DBNAME;
mongoose_1.default
    .connect(mongoURI, {
    dbName: mongoDB,
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => { })
    .catch((err) => console.log(err));
mongoose_1.default.set('useFindAndModify', true);
mongoose_1.default.connection.on("connected", function () {
    console.info("connected to " + mongoDB);
});
// If the connection throws an error
mongoose_1.default.connection.on("error", function (err) {
    console.info("DB connection error: " + err);
});
// When the connection is disconnected
mongoose_1.default.connection.on("disconnected", function () {
    console.info("DB connection disconnected");
});
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connection.close();
    process.exit(0);
}));
