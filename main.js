const express = require("express");
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const jwtSecret = "iamsecret";
const { auth } = require('./auth');
const port = 5000;
const { initizeDB, db } = require('./db.js');

app.use(express.json());

app.get('/api/article', async (req, res)=>{
    const query = { isDelete: { $exists: false } };
    const cursor = await db().collection("article").find(query);
    const docs = await cursor.toArray();
    return res.json(docs);
})

app.get('/api/article/:articleId', async (req, res)=>{
    let id = req.params.articleId;
    const query = {id: id, isDelete: { $exists: false }}
    const target = await db().collection("article").findOne(query);
    if(target){
        return res.json({success: true, data: target});
    }else{
        return res.status(404).json({success: false});
    }
})

app.get('/api/article/category/:category', async (req, res)=>{
    let cate = req.params.category;
    const query = {path: cate,  isDelete: { $exists: false }}
    const cursor = await db().collection("article").find(query);
    const docs = await cursor.toArray();
    if(docs){
        return res.json({success: true, data: docs});
    }else{
        return res.json({success: false});
    }
})

//admin management system
app.post('/api/admin/article', auth, async (req, res)=>{
    const {createDate, title, abstract, content, id, code, image, cate} = req.body;
    const query = {code: code}
    const target = await db().collection("validcode").findOne(query);
    console.log(target);
    if(target){
        const table = {
            "western": "西餐",
            "interview": "專訪",
            "travel": "搵食"
        }
        const newRecord = {
            title,
            abstract,
            cate: table[cate],
            path: cate,
            content,
            id,
            date: createDate,
            readTime: "3分鐘",
            image
        }
        
        await db().collection("article").insertOne(newRecord);
        return res.json({
            success: true
        })
    }else{
        return res.json({
            success: false,
            message: "Wrong Validation Code (Admin)"
        })
    }
})

app.delete('/api/admin/article', auth, async (req, res)=>{
    const {toBeRemovedList} = req.body;
    if(toBeRemovedList.length===0){
        return res.json({
            success: false,
            message: "List Empty"
        })
    }
    const update = {
        $set: {isDelete: true}
    };
    let target;
    if(toBeRemovedList.length===1){
        const filter = {id: toBeRemovedList[0]};
        target = await db().collection("article").updateOne(filter, update);
    }else if(toBeRemovedList.length>1){
        let bulkArr = [];
        toBeRemovedList.forEach((id)=> {
            let update_op = {updateOne: {filter: {id: id}, update} };
            bulkArr.push(update_op);
        })
        target = await db().collection("article").bulkWrite(bulkArr);
    }
    return res.json({
        success: true,
        message: "Article(s) removed"
    });
})

app.post('/api/admin/login', async (req, res)=>{
    let result = {
        success: false
    };
    const name = req.body.username;
    const password = req.body.password;
    if(!name || !password || name === "" || password === ""){
        result.message = "Please enter username and password";
        return res.json(result);
    }
    const target = await db().collection("admin").findOne({name: name});
    if (target){
        const comparedResult = await bcrypt.compare(password, target.password);
        if(comparedResult){
            const date = Date.now();
            const payload = {
                id: target._id.toString(),
                name,
                exp: Math.floor(date/1000)+(60*60)
            };
            const token = jwt.sign(payload, jwtSecret);
            result.success = true;
            result.token = token;
            result.message = "Login Successful";
            return res.json(result);
        } else {
            result.message = "Invalid username or Password";
            return res.json(result);
        }
    } else {
        result.message = "Invalid Username or password";
        return res.json(result);
    }
})

app.post('/api/admin/register', async (req, res)=>{
    const result = {
        success: false
    };
    const name = req.body.username;
    const password = req.body.password;
    if(!name || !password || name === "" || password === ""){
        result.message = "Please provide complete user information";
        return res.json(result);
    }

    const query = { name: name };
    const target = await db().collection("admin").findOne(query);
    if(target){
        result.message = "User already exists";
        return res.json(result);
    }else{
        const hashed = await bcrypt.hash(password, saltRounds);
        const newMember = { 
            name: name,
            password: hashed
        }
        await db().collection("admin").insertOne(newMember);

        const target = await db().collection("admin").findOne({name: name});
        const date = Date.now();
        const payload = {
            id: target._id.toString(),
            name,
            exp: Math.floor(date/1000) + (60*60)
        }
        const token = jwt.sign(payload, jwtSecret);
        result.success = true;
        result.token = token;
        result.message = "Registration Successful. Thank you."
        return res.json(result);
    }
})

initizeDB().then(() => {
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}!`);
    });
}).catch(
    console.error
);

