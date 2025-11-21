const express = require('express');
const cors = require('cors');
const expressWs = require('express-ws');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize express-ws
expressWs(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WebSocket endpoint for ElevenLabs STT
app.ws('/api/stt', function (ws, req) {
  console.log('WebSocket connection established for ElevenLabs STT');
  
  // Handle incoming messages from frontend
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.event) {
        case 'audio':
          // Process incoming audio from frontend
          console.log('Received audio data from frontend');
          // For now, we'll just send back a mock transcript
          // In a real implementation, you would process the audio with ElevenLabs STT
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({
                event: 'transcript',
                text: 'Hello, this is a test transcript from ElevenLabs STT'
              }));
            }
          }, 1000);
          break;
        default:
          console.log('Unknown frontend event:', data.event);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  // Handle WebSocket connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed for ElevenLabs STT');
  });
  
  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error('WebSocket error for ElevenLabs STT:', error);
  });
});

app.listen(PORT, () => {
  console.log(`Minimal server is running on port ${PORT}`);
});