import { Model } from 'mongoose'
import fs from 'fs'
import path from 'path'
import moment from 'moment'
import { Parser } from 'json2csv'

    export const getById = async (model: Model<any>, id: string, project: any = null) => {
        const data = await model.findById(id, project, {lean: { virtuals: true }});
        return data;
    }

export const findOne = async (model: Model<any>, query: object, project: any = null) => {
    const data = await model.findOne(query, project, {lean: { virtuals: true }});
    return data;
}

export const findAll = async (model: Model<any>, query: object, project: any = null) => {
    const data = await model.find(query, project, {lean: { virtuals: true }});
    return data;
}

export const getAllBySort = async (model: Model<any>, query: any, pageNumber: number = 1, pageSize: number = 20, project: any = null, includeSkip: boolean = true,sort:any) => {
    const items = await model.find(query, project, {lean: { virtuals: true }}).skip(includeSkip ? ((pageNumber - 1) * pageSize) : 0).limit(includeSkip ? pageSize : 0).sort(sort)
    const totalItems = await model.find(query).count();
    return {items, pageNumber, pageSize, totalItems};
}

export const getAll = async (model: Model<any>, query: any, pageNumber: number = 1, pageSize: number = 20, fieldsToExclude: String[] = [], aggregate: String[] = [], project: any = null, includeSkip: boolean = true) => {
    const items = await model.find(query, project, {lean: { virtuals: true }}).select(fieldsToExclude.map(field => `-${field}`).join(' ')).skip(includeSkip ? ((pageNumber - 1) * pageSize) : 0).limit(includeSkip ? pageSize : 0).sort({createdAt: -1})
    const totalItems = await model.find(query).count();
    return {items, pageNumber, pageSize, totalItems};
}
export const getAlls = async (model: Model<any>, query: any, pageNumber: number = 1, pageSize: number = 20, fieldsToExclude: String[] = [], aggregate: String[] = [], project: any = null, includeSkip: boolean = true) => {
    const items = await model.find(query, project, {lean: { virtuals: true }}).select(fieldsToExclude.map(field => `-${field}`).join(' ')).skip(includeSkip ? ((pageNumber - 1) * pageSize) : 0).limit(includeSkip ? pageSize : 0).sort({createdAt: -1})
    const totalItems = await model.find(query).countDocuments();
    return {items, pageNumber, pageSize, totalItems};
}

export const getAggregation = async (model: Model<any>, aggregate: any[] = [], pageNumber: number = 1, pageSize: number = 20, project: any = null, includeSkip: boolean = true) => {
    const items = await model.aggregate(aggregate).sort({createdAt: -1}).skip(includeSkip ? ((pageNumber - 1) * pageSize) : 0).limit(includeSkip ? pageSize : 0)
    const count = await model.aggregate(aggregate);
    const totalItems = count.length;
    return {items, pageNumber, pageSize, totalItems};
}

export const getAllWithoutPaging = async (model: Model<any>, query: any, project: any = null) => {
    const items = await model.find(query, project, {lean: { virtuals: true }})
    const totalItems = await model.find(query).count();
    return {items, totalItems};
}

// insert or update
export const upsert = async(model: Model<any>, data: any, id?: any) => {
    let dataRes = null;
    if(id) {
        // update
        delete data.id;
        dataRes = await model.findByIdAndUpdate(id, {...data}, {new: true})
    } else {
        dataRes = await model.create(data);
    }
    return dataRes;
}

// update
export const update = async(model: Model<any>, data: any, matchData: any) => {
    let dataRes = await model.updateMany({...matchData}, {...data});
    return dataRes;
}

export const deleteById = async(model: Model<any>, id: string) => {
    const deleteResp = await model.deleteOne({_id: id})
    // @ts-ignore
    return deleteResp.deletedCount > 0
}
export const deleteMany = async (model: Model<any>, query: object) =>{
    const res = await model.deleteMany(query);
    return res.deletedCount;
}  

export const createFolder = async (folderName: string) => {
    return await fs.mkdir(path.join(__dirname, '../', '../', 'public', `uploads/${folderName}`),{ recursive: true }, function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log("New directory successfully created.")
        }
      })
}




export const getFilterMonthDateYear = (date: string) => {
    return moment(date).add(1, 'day').format('YYYY-MM-DD')
}

export const getCSVFromJSON = (fields: any, json: any) => {
    const parser = new Parser({ fields });
    return parser.parse(json);
}