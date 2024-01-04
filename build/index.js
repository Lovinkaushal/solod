"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const morgan_1 = __importDefault(require("morgan"));
// import swaggerUi from "swagger-ui-express";
const swagger_ui_express_1 = require("swagger-ui-express");
const bootstrap_util_1 = require("./utils/bootstrap.util");
const routes_1 = __importDefault(require("./routes"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env') });
// connect to mongodb
require("./configs/mongoose.config");
let swaggerDoc = require('../public/swagger/swagger.json');
const PORT = process.env.PORT || 8000;
const app = (0, express_1.default)();
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", 1);
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authtoken");
    next();
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)("tiny"));
app.use(express_1.default.static("public"));
app.use(express_1.default.static(path_1.default.resolve('./public')));
app.use("/swagger", swagger_ui_express_1.serve, (0, swagger_ui_express_1.setup)(swaggerDoc));
app.use(body_parser_1.default.urlencoded({
    extended: true,
}));
app.use(body_parser_1.default.json());
app.use("/api", routes_1.default);
(0, bootstrap_util_1.bootstrapAdmin)(() => {
    console.log("Bootstraping finished!");
});
app.get('/health', (req, res) => {
    res.send('Okay!!');
});
app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
    console.log("swagger link ", `localhost:${PORT}/swagger`);
});
