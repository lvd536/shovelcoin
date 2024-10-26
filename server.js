const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

let leaderboard = [];

app.post('/update-leaderboard', (req, res) => {
    const { userId, userName, score } = req.body;
    
    const existingUserIndex = leaderboard.findIndex(user => user.id === userId);

    if (existingUserIndex !== -1) {
        leaderboard[existingUserIndex].score = score;
    } else {
        leaderboard.push({ id: userId, name: userName, score: score });
    }

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);

    res.json({ success: true, leaderboard });
});

app.get('/get-leaderboard', (req, res) => {
    res.json(leaderboard);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
