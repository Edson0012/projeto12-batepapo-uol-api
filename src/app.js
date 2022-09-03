import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs"
dotenv.config();

const app = express();
app.use(cors())
app.use(express.json())

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("batepapoUOL");
});

const userSchema = joi.object({
    name: joi.string().required()
})


app.get('/participants', async (req, res) => {

    const listParticipants = await db.collection('participants').find({}).toArray()

    res.send(listParticipants)
});


app.post('/participants', async (req, res) => {
    
    try {
        const user = req.body
        const validation = userSchema.validate(user);
        
        if (validation.error) {
            return res.status(402).send('name deve ser strings não vazio')
        };

        const confirmUser = await db.collection('participants').findOne(user)

        if(confirmUser){
            return res.status(409).send('usuario existente.')
        } else {

            await db.collection('participants').insertOne({
                name: user.name,
                lastStatus: Date.now(),
            })
        };
        
        await db.collection('mensagem').insertOne({
            from: user.name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:mm:ss'),
        })

        return res.status(201)

    }catch(error){
        return res.status(500).send({message: "erro no servidor"})
    }

});

app.post('messages', async (req, res) => {
    const {to, text, type} = req.body;
})

app.listen(5000, () => console.log("server listen 5000")
);