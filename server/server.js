require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const express = require('express');
const { init: initSocket } = require('./socket');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(require('cors')());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/investigations', require('./routes/investigations'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/monitor', require('./routes/monitor'));
app.use('/api/dashboard', require('./routes/dashboard'));



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB error:', err));

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

io.on('connection', (socket) => {
  socket.on('join-investigation', (investigationId) => {
    socket.join(investigationId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

