require("dotenv").config()
require("./database/database").connect()
const User = require("./model/user")
const bcrypt = require("bcryptjs")
const express = require("express")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")

const app = express()
app.use(express.json())
app.use(cookieParser())

app.get("/", (req,res)=>{
    res.send("<h1>Working</h1>");
})

app.post("/register", async (req, res)=>{
    try{
        const {firstname, lastname, email, password} = req.body

        if(!(firstname && lastname && email && password)){
            res.status(400).send("All fields are compulsory")
        }

        const existingUser = await User.findOne({ email })
        if(existingUser){
            res.status(401).send("User already exist")
        }

        const EncryptPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            firstname,
            lastname,
            email,
            password: EncryptPassword
        })

        const token = jwt.sign(
            {id: user._id, email},
            "shhhh",
            {
                expiresIn: "2h"
            }
        );
        user.token = token
        user.password = undefined

        res.status(201).json(user)
    }catch(error){
        console.log(error);
    }
})

app.post("/login", async (req, res)=>{
    try {
        const {email, password} = req.body

        if(!(email && password)){
            res.status(400).send("Enter all fields")
        }
        const user = await User.findOne({email})
        if(user && (await bcrypt.compare(password, user.password))){
            const token = jwt.sign(
                {id: user._id},
                "shhhh",
                {
                    expiresIn: "2h"
                }
                );
                user.token = token
                user.password = undefined

                const options = {
                    expires: new Date(Date.now() + 3*24*60*60*1000),
                    httpOnly: true
                };
                res.status(200).cookie("token",token,options).json(
                    {
                        success: true,
                        token,
                        user
                    }
                )
            }

       
        
    } catch (error) {
        console.log(error)
    }
})


module.exports = app