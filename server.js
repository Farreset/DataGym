const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Serve static assets from root (css, js)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
// Serve assets if they are in root (like icons if any, though likely in css) - generic static for root files
app.use(express.static(path.join(__dirname, 'public'))); // If public exists, otherwise just specific folders is safer to avoid exposing server.js if strictly mapped, but simpler:

// Explicit Routes for Clean URLs
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

app.get('/swimming', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'swimming.html','html/swimming.html'));
});

app.get('/running', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'running.html'));
});

app.get('/plyometrics', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'plyometrics.html'));
});

app.get('/gym', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'gym.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
});
