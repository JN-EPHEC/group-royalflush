import express from 'express';
import {userRouter} from './routes/userRoutes'

const app = express();
const port = 80

app.get('/', (req, res)=>{
    res.send("Bienvenue sur mon serveur api");
})

app.get("/api/hello/:name", (req,res)=>{
    const name = req.params.name;
    const response = {
        message: `Bonjour ${name}`,
        timestamp: new Date()
    }
    res.json(response)
})

app.use(userRouter)



app.listen(port,() =>{
    console.log(`Serveur lancé sur http://localhost:${port}`)
})




