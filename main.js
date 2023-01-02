const express = require("express");
const app = express();
const port = 5000;
const { initizeDB, db } = require('./db.js');

app.use(express.json());

app.get('/api/article', async (req, res)=>{
    const cursor = await db().collection("article").find();
    const docs = await cursor.toArray();
    return res.json(docs);
})

app.get('/api/article/:articleId', async (req, res)=>{
    let id = req.params.articleId;
    const query = {id: id}
    const target = await db().collection("article").findOne(query);
    if(target){
        return res.json(target);
    }else{
        return res.json({success: false});
    }
})

app.get('/api/article/category/:category', async (req, res)=>{
    let cate = req.params.category;
    const query = {path: cate}
    const cursor = await db().collection("article").find(query);
    const docs = await cursor.toArray();
    if(docs){
        return res.json(docs);
    }else{
        return res.json({success: false});
    }
})


app.post('/api/admin/create', async (req, res)=>{
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


initizeDB().then(() => {
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}!`);
    });
}).catch(
    console.error
);

