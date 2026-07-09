# Healthcare Assistant - Full Stack

A modern AI-powered healthcare symptom assistant with voice chat, appointment booking, and admin management.

## ✨ Features

- 🎤 **Voice Chat**: Speak to the AI, hear responses read aloud
- 💬 **Smart Symptom Analysis**: Describe symptoms and get instant guidance
- 👨‍⚕️ **Doctor Appointments**: Book appointments with qualified doctors
- 📚 **Knowledge Base**: Comprehensive medical information
- 🔐 **Secure**: Privacy-first design, no personal data storage
- 📊 **Admin Dashboard**: Manage doctors, bookings, and analytics
- ⚡ **Real-time**: Instant AI responses powered by Google Gemini
- 📱 **Responsive**: Works on desktop, tablet, and mobile

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 + React + Tailwind CSS (port 3000)
- **Backend**: Python Flask + Google Gemini/OpenAI LLM (port 5000)
- **Database**: MongoDB (Docker) for appointments & bookings
- **Voice**: Web Speech API (browser-native, no dependencies needed)

## 📁 Project Structure

```
ai-project/
├── frontend/                    # Next.js React frontend
│   ├── app/
│   │   ├── page.jsx            # Landing page (enhanced)
│   │   ├── consult/page.jsx    # Consultation page
│   │   ├── admin/page.jsx      # Admin dashboard (enhanced)
│   │   ├── layout.jsx          # Global layout (enhanced)
│   │   └── globals.css         # Tailwind styles (enhanced)
│   ├── components/
│   │   ├── Chat.jsx            # Main chat component (with voice)
│   │   └── VoiceChat.jsx       # Voice input/output component
│   ├── package.json
│   └── .env.local
│
├── backend/                     # Python Flask backend
│   ├── app.py                  # Main Flask app with voice support
│   ├── db.py                   # MongoDB connection & CRUD
│   ├── rag_simple.py          # RAG system for knowledge base
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables
│   ├── knowledge_base/
│   │   └── documents.json      # Medical knowledge base
│   ├── data/
│   │   └── chats.json         # Chat history
│   └── run.sh                 # Startup script
│
├── VOICE_CHAT_GUIDE.md        # Detailed voice chat documentation
├── PROJECT_REPORT.md          # Project overview
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker (for MongoDB)
- Google Gemini API key or OpenAI API key

### Backend (Python Flask)

```bash
cd backend
./run.sh                          # Runs Flask on http://localhost:5000
```

Or manually:
```bash
cd backend
source venv/bin/activate
python3 app.py
```

**Test backend:**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"I have a headache","conversationId":"test-123"}'
```

### Frontend (Next.js)

In a new terminal:

```bash
cd frontend
npm run dev                        # Start Next.js on http://localhost:3000
```

Open browser: `http://localhost:3000` → Navigate to `/consult` → Chat works!

---

## 🎤 Voice Chat Feature

### What's Included
✅ **Speech-to-Text**: Speak to the AI using your microphone
✅ **Text-to-Speech**: Hear AI responses read aloud
✅ **No Extra Dependencies**: Uses browser-native Web Speech API
✅ **Works Offline**: Voice processing happens locally in your browser
✅ **Multi-Device**: Works on desktop, tablet, and mobile

### How to Use Voice

**Speaking to the AI:**
1. Click and **hold** the 🎤 microphone button in the input area
2. Speak clearly about your symptoms or question
3. Release the button when done
4. Your speech is converted to text and sent automatically

**Hearing Responses:**
1. When the AI responds, look for the 🔊 speaker icon on the message
2. Click it to hear the response read aloud
3. Click again to stop playback

### Browser Compatibility
| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Firefox | ✅ Full | Works well |
| Safari | ✅ Full | Uses webkit prefix |
| Edge | ✅ Full | Same as Chrome |
| Mobile | ✅ Most | Depends on OS |

### Configuration
You can customize voice settings in `frontend/components/VoiceChat.jsx`:
```javascript
recognitionRef.current.lang = 'en-US'        // Change language
utterance.rate = 1                            // Adjust speed (0.1-10)
utterance.pitch = 1                           // Adjust pitch (0-2)
utterance.volume = 1                          // Adjust volume (0-1)
```

For detailed voice documentation, see [VOICE_CHAT_GUIDE.md](./VOICE_CHAT_GUIDE.md)

---

## 🏥 Key Features Explained

### 1. AI Chat with RAG
- **Real-time Responses**: Uses Google Gemini API
- **Knowledge Base**: 13+ medical documents for context
- **Symptom Guidance**: Analyzes symptoms and provides recommendations
- **Conversation Memory**: Remembers chat history during session

### 2. Appointment Booking
- **Doctor Search**: Find doctors by symptom/specialty
- **Slot Selection**: View available appointment times
- **Email Confirmation**: Get booking confirmation details
- **Admin Tracking**: All bookings visible in admin panel

### 3. Admin Dashboard
- **Doctor Management**: Add/remove doctors
- **Booking Oversight**: View and cancel bookings
- **Analytics**: Statistics on slots and occupancy
- **Secure Login**: Password-protected admin access

### 4. Voice Features
- **Hands-free Input**: Speak instead of typing
- **Audio Output**: Hear medical information read aloud
- **Accessibility**: Better for users with typing difficulties
- **Privacy**: All processing happens in your browser

---

## 📡 API Endpoints

### Chat & Conversation
**POST /api/chat**
```json
Request: { "message": "I have a headache", "conversationId": "xyz" }
Response: { "reply": "Here's what you should know..." }
```

**GET /api/conversation/{id}**
```json
Response: { "messages": [{"role": "user", "content": "..."}, ...] }
```

### Doctor & Appointment Management
**GET /api/doctors/search**
```json
Request: { "symptom": "fever" }
Response: { "doctors": [...] }
```

**GET /api/doctors/{id}/slots?days=7**
```json
Response: { "slots": [...] }
```

**POST /api/appointments/book**
```json
Request: { "slot_id": "xyz", "email": "user@example.com", "phone": "..." }
Response: { "success": true, "booking_id": "..." }
```

### RAG Knowledge Base
**POST /api/rag/add**
```json
Request: { "title": "...", "content": "...", "source": "..." }
Response: { "success": true, "doc_id": "..." }
```

**POST /api/rag/search**
```json
Request: { "query": "fever" }
Response: { "results": [...], "count": 5 }
```

### Admin Management
**GET /api/admin/doctors**
```json
Response: { "doctors": [...] }
```

**GET /api/admin/bookings**
```json
Response: { "bookings": [...] }
```

**GET /api/admin/stats**
```json
Response: { "stats": [...] }
```

---

## 🧠 How It Works

### Chat Flow
1. **User Input** (Text or Voice)
   - Text: Type in input field
   - Voice: Hold microphone button to record

2. **Processing**
   - Frontend sends to Flask backend
   - Backend retrieves conversation history
   - LLM (Gemini/OpenAI) generates response
   - Response includes RAG context from knowledge base

3. **Output** (Text or Voice)
   - Text: Displayed in chat bubble
   - Voice: User clicks speaker icon to hear response

### Appointment Booking Flow
1. User clicks "📅 Book" button
2. Selects symptom/condition
3. Searches for matching doctors
4. Selects preferred doctor
5. Chooses available time slot
6. Enters email and phone
7. Confirms booking (stored in MongoDB)

### Admin Access Flow
1. Admin navigates to `/admin`
2. Enters password: `admin123`
3. Views/manages:
   - Doctor list
   - All bookings
   - System statistics

---

## 📊 Data Storage

### Chat History
```
backend/data/chats.json
```
Stores all conversations with timestamps

### Appointments
```
MongoDB: healthcare.appointments
```
Stores booked appointment slots

### Doctors
```
MongoDB: healthcare.doctors
```
Stores doctor profiles and specialties

### Knowledge Base
```
backend/knowledge_base/documents.json
```
13 medical reference documents for RAG

---

## 🔧 Development & Debugging

### Enable Debug Mode
In `backend/.env`:
```bash
DEBUG_AI=true
```

### Check API Health
```bash
curl http://localhost:5000/health
```

### Test Chat Endpoint
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","conversationId":"test"}'
```

### Test Voice Feature
- Open `/consult` page
- Click microphone button
- Check browser console (F12) for any errors
- Verify microphone permissions granted

### View Logs
```bash
# Backend Flask logs
tail -f /tmp/backend.log

# Frontend build logs
npm run dev  # Shows real-time logs
```

---

## 🐛 Troubleshooting

### Chat not responding
- ✅ Check backend is running: `curl http://localhost:5000/health`
- ✅ Verify API keys in `backend/.env` are valid
- ✅ Check browser console for CORS errors
- ✅ Restart backend if made code changes

### Voice input not working
- ✅ Check microphone permissions (browser settings)
- ✅ Ensure microphone hardware is working
- ✅ Try Chrome browser (best support)
- ✅ Check browser console for Web Speech API errors

### Voice output not working
- ✅ Check system volume is not muted
- ✅ Check browser speaker settings
- ✅ Ensure text-to-speech is enabled
- ✅ Try a different browser

### Appointments not booking
- ✅ Check MongoDB is running: `docker ps`
- ✅ Verify MongoDB URI in `.env` is correct
- ✅ Check for network errors in browser console
- ✅ Try booking again with valid email

### Admin page not loading
- ✅ Navigate to `http://localhost:3000/admin`
- ✅ Password: `admin123`
- ✅ Check browser console for errors
- ✅ Clear cache if stuck on login

---

## 🚀 Performance Tips

- **Browser Caching**: Conversation loads from session storage
- **Voice Processing**: Happens locally, no server delay
- **LLM Responses**: Uses fast Gemini 2.5-Flash model
- **Database**: MongoDB optimized with indexes

---

## 📝 License

This project is provided as-is for educational and demo purposes.

---

## 👨‍💻 Support & Contribution

Found a bug? Have a feature request?

1. Check existing issues
2. Provide browser/OS details
3. Include error messages from console
4. Describe steps to reproduce

---

**Made with ❤️ for better healthcare access**

🎤 Speak • 💬 Chat • 🏥 Connect • 👨‍⚕️ Book


- Check Flask logs for API call errors
- Test backend directly: `curl -X POST http://localhost:5000/api/chat ...`

---

## 📦 Dependencies

### Backend
- Flask 3.0.0
- requests 2.31.0
- google-generativeai 0.3.0
- openai 1.3.0

### Frontend
- Next.js 14
- React 18
- Tailwind CSS 3

---

## 🎯 Next Steps

- Deploy backend to cloud (Heroku, Google Cloud, AWS)
- Deploy frontend to Vercel
- Add user authentication
- Implement streaming responses
- Add more LLM providers
- Improve medical accuracy with better prompts

---

## 📄 License

MIT
