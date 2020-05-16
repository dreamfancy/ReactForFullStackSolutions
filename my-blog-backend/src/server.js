import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/build')));

const withDB = async (callback, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true }); //the sentence after await returns a promise
        const db = client.db('my-blog');
        await callback(db);
        client.close();
    } catch (error) {
            res.status(500).json({message: 'Error connecting db', error});
    }
};

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection("articles").findOne({name: articleName});
        res.status(200).json(articleInfo);
    }, res);
});

app.post('/api/articles/:name/upvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection("articles").findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName}, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
            }
        });
        const updatedArticlesInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updatedArticlesInfo);
    }, res);
});


app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName}, {'$set': {
            comments: articleInfo.comments.concat({ username, text })
        }});
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
        console.log(updatedArticleInfo);
        res.status(200).json(updatedArticleInfo);
    },res);

});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + "/build/index.html"));
})

app.listen(9000, () => console.log("Listening on port 9000"));