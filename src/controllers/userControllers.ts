import type { Request, Response} from "express"
import User from "../models/User"
import router from "../routes/userRoutes";
import { error } from "node:console";

export const getAllUsers = async (req: Request,res: Response)=>{
    try{
        const users = await User.findAll()
        res.status(200).json(users)
    } catch (error){
        res.status(500).json({error: (error as any).message})
    }
}