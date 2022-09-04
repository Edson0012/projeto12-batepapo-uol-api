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

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message' , 'private_message')
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

    }catch(err){
        return res.status(500).send({message: "erro no servidor"})
    }

});

app.post('/messages', async (req, res) => {
    try {
        const {user} = req.headers
        const messageInfo = req.body
        const validation = messageSchema.validate(messageInfo)

        if(validation.error){
            return res.status(422).send('error na mensagem')
        }

        const checkUser = await db.collection('participants').findOne({
            name: user
        })

        if(checkUser){
            await db.collection('mensagem').insertOne({
                to: user,
                text: messageInfo.text,
                type: messageInfo.type,
                time: dayjs().format('HH:mm:ss')
            })
        } else {
            return res.status(422).send('usuario não encontrado.')
        }


        
        res.send(201)
    }catch(err){
        return res.status(500).send('error no servidor')
    }
})

app.get('/messages', async (req, res) => {
    try {
        const {user} = req.headers
        const checkUser = await db.collection('participants').findOne({
            name: user
        })
        if(checkUser){
            db.collection('mensagem').find({
                name: user
            }).toArray()
        }
    } catch (err) {

    }
    res.send(returnMessage)
})


app.listen(5000, () => console.log("server listen 5000")
);