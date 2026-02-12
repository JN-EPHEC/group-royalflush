import  {Router } from 'express'

export const userRouter = Router()

const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    ]

userRouter.get("/api/users",(req,res)=>{
    res.json(users)
})

