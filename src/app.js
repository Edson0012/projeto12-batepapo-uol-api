import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
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


 setInterval( async () => {
        const checkStatus = Date.now()
        const listUser =  await db.collection('participants').find().toArray()

        listUser.forEach(async (value) => {
            const leaveRoom = {
                from: value.name ,
                to: "Todos",
                text: "sai da sala",
                type: "status",
                time: dayjs().format('HH:mm:ss'),
            }

            if(checkStatus - value.lastStatus > 10000){
                await db.collection('participants').deleteOne({name: value.name})
                await db.collection('mensagem').insertOne(leaveRoom)
            }

        })

}, 15000); 


app.get('/participants', async (req, res) => {
    try {
        const listParticipants = await db.collection('participants').find().toArray()

        res.send(listParticipants)

    }catch(err){
        res.status(500).send('error no servidor')
    }
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

        return res.status(201).send('created')

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
            return res.sendStatus(201)
        } else {
            return res.status(422).send('usuario não encontrado.')
        }
    }catch(err){
        return res.status(500).send('error no servidor')
    }
})

app.get('/messages', async (req, res) => {
    
    try {
        const msg = [];
        const {limit} = req.query
        const {user} = req.headers
        const messages = await db.collection('mensagem').find({}).toArray()
        const privateMessages = messages.filter((message) => {
            if(message.from === user || message.to === user || message.to === 'Todos'){           
                return message
            }
        }) 

        if(limit){
            for(let i = 0; i < limit ; i++){
                if(privateMessages[i].from === user || privateMessages[i].to === user || privateMessages[i].to === 'Todos'){
                    msg.push(privateMessages[i])
                }
            }

            return res.send(msg.reverse())

        } else {
            return res.send(privateMessages.reverse())
        }
 
            

    }catch (err) {
        return res.status(500).send('error no servidor')
    }
    
})

app.post('/status', async (req, res) => {
    const {user} = req.headers
    try {
        const checkUser = await db.collection('participants').findOne({
            name: user
        })
        if(checkUser){
            await db.collection('participants').updateOne({
                name: user
            }, { $set: {lastStatus: Date.now()}})
          return  res.status(200)

        } else {

            return res.status(404)
        }

    }catch(err){
        
        return res.status(500).send('error no servidor')
    }
})
 

app.listen(5000, () => console.log("server listen 5000")
);