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
exports.getCSVFromJSON = exports.getFilterMonthDateYear = exports.createFolder = exports.deleteMany = exports.deleteById = exports.update = exports.upsert = exports.getAllWithoutPaging = exports.getAggregation = exports.getAlls = exports.getAll = exports.getAllBySort = exports.findAll = exports.findOne = exports.getById = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
const json2csv_1 = require("json2csv");
const getById = (model, id, project = null) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield model.findById(id, project, { lean: { virtuals: true } });
    return data;
});
exports.getById = getById;
const findOne = (model, query, project = null) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield model.findOne(query, project, { lean: { virtuals: true } });
    return data;
});
exports.findOne = findOne;
const findAll = (model, query, project = null) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield model.find(query, project, { lean: { virtuals: true } });
    return data;
});
exports.findAll = findAll;
const getAllBySort = (model, query, pageNumber = 1, pageSize = 20, project = null, includeSkip = true, sort) => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield model.find(query, project, { lean: { virtuals: true } }).skip(includeSkip ? ((pageNumber - 1) * pageSize) : 0).limit(includeSkip ? pageSize : 0).sort(sort);
    const totalItems = yield model.find(query).count();
    return { items, pageNumber, pageSize, totalItems };
});
exports.getAllBySort = getAllBySort;
const getAll = (model, query, pageNumber = 1, pageSize = 20, fieldsToExclude = [], aggregate = [], project = null, includeSkip = true) => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield model.find(query, project, { lean: { virtuals: true } }).select(fieldsToExclude.map(field => `-${field}`).join(' ')).skip(includeSkip ? ((pageNumber - 1) * pageSize) : 0).limit(includeSkip ? pageSize : 0).sort({ createdAt: -1 });
    const totalItems = yield model.find(query).count();
    return { items, pageNumber, pageSize, totalItems };
});
exports.getAll = getAll;
const getAlls = (model, query, pageNumber = 1, pageSize = 20, fieldsToExclude = [], aggregate = [], project = null, includeSkip = true) => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield model.find(query, project, { lean: { virtuals: true } }).select(fieldsToExclude.map(field => `-${field}`).join(' ')).skip(includeSkip ? ((pageNumber - 1) * pageSize) : 0).limit(includeSkip ? pageSize : 0).sort({ createdAt: -1 });
    const totalItems = yield model.find(query).countDocuments();
    return { items, pageNumber, pageSize, totalItems };
});
exports.getAlls = getAlls;
const getAggregation = (model, aggregate = [], pageNumber = 1, pageSize = 20, project = null, includeSkip = true) => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield model.aggregate(aggregate).sort({ createdAt: -1 }).skip(includeSkip ? ((pageNumber - 1) * pageSize) : 0).limit(includeSkip ? pageSize : 0);
    const count = yield model.aggregate(aggregate);
    const totalItems = count.length;
    return { items, pageNumber, pageSize, totalItems };
});
exports.getAggregation = getAggregation;
const getAllWithoutPaging = (model, query, project = null) => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield model.find(query, project, { lean: { virtuals: true } });
    const totalItems = yield model.find(query).count();
    return { items, totalItems };
});
exports.getAllWithoutPaging = getAllWithoutPaging;
// insert or update
const upsert = (model, data, id) => __awaiter(void 0, void 0, void 0, function* () {
    let dataRes = null;
    if (id) {
        // update
        delete data.id;
        dataRes = yield model.findByIdAndUpdate(id, Object.assign({}, data), { new: true });
    }
    else {
        dataRes = yield model.create(data);
    }
    return dataRes;
});
exports.upsert = upsert;
// update
const update = (model, data, matchData) => __awaiter(void 0, void 0, void 0, function* () {
    let dataRes = yield model.updateMany(Object.assign({}, matchData), Object.assign({}, data));
    return dataRes;
});
exports.update = update;
const deleteById = (model, id) => __awaiter(void 0, void 0, void 0, function* () {
    const deleteResp = yield model.deleteOne({ _id: id });
    // @ts-ignore
    return deleteResp.deletedCount > 0;
});
exports.deleteById = deleteById;
const deleteMany = (model, query) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield model.deleteMany(query);
    return res.deletedCount;
});
exports.deleteMany = deleteMany;
const createFolder = (folderName) => __awaiter(void 0, void 0, void 0, function* () {
    return yield fs_1.default.mkdir(path_1.default.join(__dirname, '../', '../', 'public', `uploads/${folderName}`), { recursive: true }, function (err) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("New directory successfully created.");
        }
    });
});
exports.createFolder = createFolder;
const getFilterMonthDateYear = (date) => {
    return (0, moment_1.default)(date).add(1, 'day').format('YYYY-MM-DD');
};
exports.getFilterMonthDateYear = getFilterMonthDateYear;
const getCSVFromJSON = (fields, json) => {
    const parser = new json2csv_1.Parser({ fields });
    return parser.parse(json);
};
exports.getCSVFromJSON = getCSVFromJSON;
