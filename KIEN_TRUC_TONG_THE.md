# 🏗️ KIẾN TRÚC TỔNG THỂ HỆ THỐNG

## Ứng dụng Bác sĩ Lúa - Kiến trúc hệ thống

---

## 1. GIỚI THIỆU

### 1.1 Tổng quan
Hệ thống **Bác sĩ Lúa** được xây dựng theo kiến trúc **3 tầng** (3-Tier Architecture) kết hợp với các dịch vụ bên ngoài (External Services) để tạo thành một hệ thống hoàn chỉnh hỗ trợ nông dân trong việc phát hiện và quản lý bệnh lúa.

### 1.2 Mô hình kiến trúc
- **Presentation Layer**: React Native Mobile App (Android)
- **Application Layer**: Node.js Backend API + Python AI Service
- **Data Layer**: MongoDB Atlas + Firebase Realtime Database + Cloudinary Storage

---

## 2. SƠ ĐỒ KIẾN TRÚC TỔNG THỂ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LAYER 1: PRESENTATION                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │          APP ANDROID (React Native + Expo SDK 54)                  │ │
│  │                                                                     │ │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐         │ │
│  │  │  Home    │ Weather  │ Camera   │  MapFarm │ Account  │         │ │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┘         │ │
│  │                                                                     │ │
│  │  Components:                                                       │ │
│  │  - CameraScreen (Camera + GPS capture)                             │ │
│  │  - ResultScreen (AI prediction display)                             │ │
│  │  - MapScreen (Leaflet.js WebView)                                  │ │
│  │  - ExpertChatScreen (Socket.io client)                             │ │
│  │  - FieldManagementScreen (IoT connection)                           │ │
│  │                                                                     │ │
│  │  Services Layer (Client):                                          │ │
│  │  - api.ts (Axios instance)                                         │ │
│  │  - socket.service.ts (Socket.io client)                            │ │
│  │  - gemini.service.ts (Gemini API client)                           │ │
│  │  - firebase-iot.service.ts (Firebase Realtime DB)                  │ │
│  │  - weather.service.ts (OpenWeatherMap API)                         │ │
│  │                                                                     │ │
│  │  State Management:                                                 │ │
│  │  - React Hooks (useState, useEffect)                               │ │
│  │  - Context API (Auth, Theme)                                       │ │
│  │  - AsyncStorage (Local storage)                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS REST API
                                 │ WebSocket (Socket.io)
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         LAYER 2: APPLICATION                            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │        BACKEND NODE.JS (Express.js + TypeScript)                   │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │                    API Routes Layer                           │  │ │
│  │  │  ┌────────────────────────────────────────────────────────┐  │  │ │
│  │  │  │ /api/auth/*      - Authentication (JWT, Firebase, OAuth)│  │  │ │
│  │  │  │ /api/photos/*    - Photo upload, list, stats, map        │  │  │ │
│  │  │  │ /api/fields/*    - Field management (CRUD)               │  │  │ │
│  │  │  │ /api/iot/*       - IoT connection, images, analysis      │  │  │ │
│  │  │  │ /api/experts/*   - Expert list, reviews                  │  │  │ │
│  │  │  │ /api/conversations/* - Chat messages (REST fallback)    │  │  │ │
│  │  │  │ /api/treatment/* - Treatment logs                        │  │  │ │
│  │  │  │ /api/user/*      - User profile management               │  │  │ │
│  │  │  │ /api/health      - Health check                          │  │  │ │
│  │  │  │ /api/docs        - Swagger UI documentation              │  │  │ │
│  │  │  └────────────────────────────────────────────────────────┘  │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Middleware Layer                           │  │ │
│  │  │  - Authentication Middleware (JWT verification)               │  │ │
│  │  │  - Rate Limiting (100 req/15min per IP)                       │  │ │
│  │  │  - CORS Configuration                                          │  │ │
│  │  │  - Error Handling                                              │  │ │
│  │  │  - Request Logging                                             │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Services Layer                             │  │ │
│  │  │  ├─ cloudinary.service.ts                                     │  │ │
│  │  │  │  └─→ Cloudinary API (Image upload, watermark, thumbnail)   │  │ │
│  │  │  │                                                             │  │ │
│  │  │  ├─ ai.service.ts                                             │  │ │
│  │  │  │  └─→ Backend AI (Python Flask)                             │  │ │
│  │  │  │                                                             │  │ │
│  │  │  ├─ firebase-admin.service.ts                                 │  │ │
│  │  │  │  └─→ Firebase Admin SDK (Phone auth verification)          │  │ │
│  │  │  │                                                             │  │ │
│  │  │  ├─ firebase-iot.service.ts                                   │  │ │
│  │  │  │  └─→ Firebase Realtime DB (IoT images & sensors)           │  │ │
│  │  │  │                                                             │  │ │
│  │  │  ├─ email.service.ts                                          │  │ │
│  │  │  │  └─→ SendGrid/Nodemailer (Email notifications)             │  │ │
│  │  │  │                                                             │  │ │
│  │  │  └─ socket.io (Socket.io server)                              │  │ │
│  │  │     └─→ Real-time chat (Expert Chat)                          │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Controllers Layer                          │  │ │
│  │  │  - auth.controller.ts (Login, Register, OAuth)                │  │ │
│  │  │  - photo.controller.ts (Upload, List, Delete)                 │  │ │
│  │  │  - field.controller.ts (CRUD Fields, IoT code generation)     │  │ │
│  │  │  - iot.controller.ts (Connect, Fetch images, Analyze)         │  │ │
│  │  │  - expert.controller.ts (List, Reviews)                       │  │ │
│  │  │  - conversation.controller.ts (Chat messages)                 │  │ │
│  │  │  - treatment.controller.ts (Treatment logs)                   │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │        BACKEND AI (Python Flask + TensorFlow Lite)                 │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │              Flask Application                                │  │ │
│  │  │                                                               │  │ │
│  │  │  Endpoints:                                                   │  │ │
│  │  │  - POST /predict (Image disease detection)                    │  │ │
│  │  │  - GET /health (Health check)                                 │  │ │
│  │  │                                                               │  │ │
│  │  │  ┌────────────────────────────────────────────────────────┐  │  │ │
│  │  │  │         TensorFlow Lite Model                          │  │  │ │
│  │  │  │                                                         │  │  │ │
│  │  │  │  Input: 224x224 RGB image                               │  │  │ │
│  │  │  │  Output: 4 classes with confidence scores               │  │  │ │
│  │  │  │                                                         │  │  │ │
│  │  │  │  Classes:                                               │  │  │ │
│  │  │  │  1. bacterial_leaf_blight (Bệnh bạc lá vi khuẩn)       │  │  │ │
│  │  │  │  2. blast (Bệnh đạo ôn)                                 │  │  │ │
│  │  │  │  3. brown_spot (Bệnh đốm nâu)                           │  │  │ │
│  │  │  │  4. healthy (Lá khỏe mạnh)                              │  │  │ │
│  │  │  └────────────────────────────────────────────────────────┘  │  │ │
│  │  │                                                               │  │ │
│  │  │  Processing Pipeline:                                        │  │  │ │
│  │  │  1. Receive image file (multipart/form-data)                 │  │  │ │
│  │  │  2. Preprocess (Resize 224x224, Normalize 0-1)               │  │  │ │
│  │  │  3. Run TensorFlow Lite model                                │  │  │ │
│  │  │  4. Process predictions (Top class, confidence)              │  │  │ │
│  │  │  5. Return JSON response                                     │  │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  Server: Gunicorn (1 worker, 2 threads, 120s timeout)             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────┬──────────────────┘
                           │                          │
                           │                          │
                           ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         LAYER 3: DATA                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              MONGODB ATLAS (Cloud Database)                        │ │
│  │                                                                     │ │
│  │  Collections:                                                      │ │
│  │  ├─ users          - User accounts, profiles                       │ │
│  │  ├─ photos         - Photos with AI predictions                    │ │
│  │  ├─ fields         - Field management                              │ │
│  │  ├─ iotConnections - IoT device connections                        │ │
│  │  ├─ iotConnectionCodes - IoT connection codes                      │ │
│  │  ├─ conversations  - Chat conversations                            │ │
│  │  ├─ messages       - Chat messages                                 │ │
│  │  ├─ experts        - Expert profiles and ratings                   │ │
│  │  ├─ reviews        - Expert reviews                                │ │
│  │  └─ treatments     - Treatment logs                                │ │
│  │                                                                     │ │
│  │  Features:                                                         │ │
│  │  - Auto-scaling (M0 free tier)                                     │ │
│  │  - Automatic backups                                               │ │
│  │  - Indexing for performance                                        │ │
│  │  - Aggregation pipeline for statistics                             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │        FIREBASE REALTIME DATABASE (IoT Data)                       │ │
│  │                                                                     │ │
│  │  Structure:                                                        │ │
│  │  fields/                                                            │ │
│  │    {fieldId}/                                                      │ │
│  │      devices/                                                      │ │
│  │        {deviceId}/                                                 │ │
│  │          captures/                                                 │ │
│  │            {captureId}/                                            │ │
│  │              imageUrl: string                                      │ │
│  │              timestamp: number                                     │ │
│  │              gps: {lat, lng}                                       │ │
│  │              sensors: {                                            │ │
│  │                temp: number                                        │ │
│  │                humidity: number                                    │ │
│  │                ph: number                                          │ │
│  │                soil: number                                        │ │
│  │                lux: number                                         │ │
│  │                wind: number                                        │ │
│  │              }                                                     │ │
│  │                                                                     │ │
│  │  Features:                                                         │ │
│  │  - Real-time synchronization                                       │ │
│  │  - Offline support                                                 │ │
│  │  - Event listeners                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              CLOUDINARY (Image Storage)                            │ │
│  │                                                                     │ │
│  │  Features:                                                         │ │
│  │  - Image upload and storage                                        │ │
│  │  - GPS watermark generation                                        │ │
│  │  - Thumbnail generation (300x300)                                  │ │
│  │  - Image transformations (resize, crop, quality)                   │ │
│  │  - CDN delivery                                                    │ │
│  │                                                                     │ │
│  │  Storage Structure:                                                │ │
│  │  doctorrice/photos/                                                │ │
│  │    photo_{userId}_{timestamp}.jpg                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES & APIs                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  FIREBASE AUTHENTICATION                                           │ │
│  │  - Phone Authentication (OTP)                                      │ │
│  │  - Google Sign-In                                                  │ │
│  │  - Facebook Sign-In                                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  GOOGLE GEMINI API                                                 │ │
│  │  - AI Chat (Gemini 2.5 Flash Lite)                                 │ │
│  │  - Image analysis                                                  │ │
│  │  - Text generation                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  OPENWEATHERMAP API                                                │ │
│  │  - Current weather                                                 │ │
│  │  - 7-day forecast                                                  │ │
│  │  - Weather warnings                                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  SENDGRID / NODEMAILER                                             │ │
│  │  - Email notifications                                             │ │
│  │  - Password reset emails                                           │ │
│  │  - OTP emails                                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. MÔ TẢ CHI TIẾT CÁC LAYER

### 3.1 PRESENTATION LAYER (Client Side)

#### **App Android - React Native + Expo**

**Công nghệ:**
- Framework: React Native 0.81
- Expo SDK: 54
- Language: TypeScript
- Routing: Expo Router (file-based)
- State Management: React Hooks + Context API

**Cấu trúc:**
```
app/                    # Expo Router screens
├── (tabs)/             # Tab Navigator
│   ├── index.tsx       # Home screen
│   ├── weather.tsx     # Weather screen
│   ├── mapFarm.tsx     # Map screen
│   └── account.tsx     # Account screen
├── camera-modal.tsx    # Camera screen
├── result.tsx          # AI result screen
├── expert-chat.tsx     # Expert chat screen
└── ...

src/                    # Business logic
├── components/         # Reusable components
├── screens/            # Screen components
├── hooks/              # Custom hooks
├── services/           # API clients
│   ├── api.ts          # Axios instance
│   ├── socket.service.ts
│   ├── gemini.service.ts
│   └── firebase-iot.service.ts
├── i18n/               # Internationalization
└── ...
```

**Chức năng chính:**
- Camera capture với GPS
- UI/UX với React Native components
- Navigation với Expo Router
- Real-time chat với Socket.io client
- Image processing (resize, compression)
- Local storage với AsyncStorage
- Secure storage với Expo SecureStore

---

### 3.2 APPLICATION LAYER (Server Side)

#### **A. Backend Node.js (Express.js)**

**Công nghệ:**
- Runtime: Node.js 20+
- Framework: Express.js
- Language: TypeScript
- ORM: Mongoose (MongoDB)

**Cấu trúc:**
```
backend/
├── src/
│   ├── config/         # Configuration files
│   │   ├── database.ts
│   │   ├── cloudinary.ts
│   │   └── swagger.ts
│   │
│   ├── models/         # Mongoose models
│   │   ├── User.ts
│   │   ├── Photo.ts
│   │   ├── Field.ts
│   │   └── ...
│   │
│   ├── controllers/    # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── photo.controller.ts
│   │   └── ...
│   │
│   ├── routes/         # Express routes
│   │   ├── auth.routes.ts
│   │   ├── photo.routes.ts
│   │   └── ...
│   │
│   ├── services/       # Business logic services
│   │   ├── cloudinary.service.ts
│   │   ├── ai.service.ts
│   │   ├── firebase-admin.service.ts
│   │   └── ...
│   │
│   ├── middleware/     # Express middlewares
│   │   ├── auth.middleware.ts
│   │   └── rateLimiter.middleware.ts
│   │
│   ├── socket/         # Socket.io server
│   │   └── socket.server.ts
│   │
│   ├── jobs/           # Cron jobs
│   │   └── keepAlive.ts
│   │
│   └── server.ts       # Express app entry
```

**Chức năng chính:**
- RESTful API endpoints
- Authentication & Authorization (JWT, Firebase, OAuth)
- Image upload và watermarking
- AI service integration
- IoT data management
- Real-time chat với Socket.io
- Email notifications
- API documentation (Swagger)

**Middleware Pipeline:**
```
Request
  ↓
Helmet (Security headers)
  ↓
Compression (Gzip)
  ↓
CORS (Cross-origin)
  ↓
Rate Limiter (100 req/15min)
  ↓
Body Parser (JSON, Form-data)
  ↓
Authentication (JWT verification)
  ↓
Controller
  ↓
Response
```

#### **B. Backend AI (Python Flask)**

**Công nghệ:**
- Runtime: Python 3.11+
- Framework: Flask
- AI Model: TensorFlow Lite
- Server: Gunicorn

**Cấu trúc:**
```
backend-ai/
├── app.py              # Flask application
├── model.tflite        # TensorFlow Lite model
├── requirements.txt
├── Dockerfile
└── render.yaml
```

**AI Model Details:**
- Type: TensorFlow Lite (Quantized)
- Input: 224x224 RGB image
- Output: 4 classes với confidence scores
- Processing: Preprocess → Model → Postprocess

**Classes:**
1. `bacterial_leaf_blight` → "Bệnh bạc lá vi khuẩn"
2. `blast` → "Bệnh đạo ôn"
3. `brown_spot` → "Bệnh đốm nâu"
4. `healthy` → "Lá khỏe mạnh"

---

### 3.3 DATA LAYER

#### **A. MongoDB Atlas**

**Collections:**
1. **users** - User accounts và profiles
2. **photos** - Photos với AI predictions
3. **fields** - Field management
4. **iotConnections** - IoT device connections
5. **iotConnectionCodes** - IoT connection codes
6. **conversations** - Chat conversations
7. **messages** - Chat messages
8. **experts** - Expert profiles
9. **reviews** - Expert reviews
10. **treatments** - Treatment logs

**Indexes:**
- `users`: email, phone, socialIds.google (unique, sparse)
- `photos`: userId + createdAt (compound), status
- `fields`: userId, location (geospatial)
- `iotConnections`: fieldId, deviceId
- `conversations`: farmerId, expertId
- `messages`: conversationId, createdAt

#### **B. Firebase Realtime Database**

**Structure:**
```
fields/
  {fieldId}/
    devices/
      {deviceId}/
        captures/
          {captureId}/
            imageUrl: string
            timestamp: number
            gps: {lat, lng}
            sensors: {
              temp: number
              humidity: number
              ph: number
              soil: number
              lux: number
              wind: number
            }
```

**Features:**
- Real-time synchronization
- Offline support
- Event listeners
- Query capabilities

#### **C. Cloudinary**

**Storage:**
- Folder: `doctorrice/photos/`
- File naming: `photo_{userId}_{timestamp}.jpg`

**Features:**
- Image upload và storage
- GPS watermark generation
- Thumbnail generation
- Image transformations
- CDN delivery

---

## 4. LUỒNG DỮ LIỆU CHÍNH

### 4.1 Photo Upload Flow

```
Client (App)
  ↓
[1] Capture/Pick Image + GPS
  ↓
[2] Resize Image (max 1280px)
  ↓
[3] POST /api/photos/upload (multipart/form-data)
  ↓
Backend Node.js
  ↓
[4] Auth Middleware (JWT verification)
  ↓
[5] Multer Middleware (Parse form-data)
  ↓
[6] Parallel Processing:
    ├─→ Upload to Cloudinary
    │   ├─ Upload original
    │   ├─ Generate watermark URL
    │   └─ Generate thumbnail URL
    │
    └─→ Call AI Service
        ├─ POST /predict (image buffer)
        ├─ Preprocess (224x224, normalize)
        ├─ Run TensorFlow Lite model
        └─ Return prediction
  ↓
[7] Save to MongoDB (Photo document)
  ↓
[8] Return Response (photo object + prediction)
  ↓
Client (App)
  ↓
[9] Display Result Screen
```

### 4.2 IoT Image Flow

```
IoT Device
  ↓
[1] Capture Image + Sensors
  ↓
[2] Upload to Firebase Storage
  ↓
[3] Save metadata to Firebase Realtime DB
  ↓
Client (App)
  ↓
[4] Listen to Firebase Realtime DB
  ↓
[5] Display images in gallery
  ↓
[6] User clicks "Analyze"
  ↓
[7] POST /api/iot/analyze
  ↓
Backend Node.js
  ↓
[8] Download image from Firebase
  ↓
[9] Call AI Service (same as photo upload)
  ↓
[10] Generate treatment recommendations
  ↓
[11] Save to MongoDB (Photo document with source='iot')
  ↓
[12] Return analysis result
  ↓
Client (App)
  ↓
[13] Display AI result + treatment recommendations
```

### 4.3 Expert Chat Flow

```
Client (App)
  ↓
[1] Connect to Socket.io server
  ↓
[2] Join room: conversation:${conversationId}
  ↓
[3] Send message:
    Socket.emit('message', {
      conversationId,
      senderId,
      content,
      attachments
    })
  ↓
Backend Node.js (Socket.io)
  ↓
[4] Receive message
  ↓
[5] Save to MongoDB (Message document)
  ↓
[6] Update Conversation (lastMessageAt, unreadCount)
  ↓
[7] Emit to room (broadcast to all clients in room)
    Socket.to(room).emit('message', message)
  ↓
Clients (App) - Real-time update
  ↓
[8] Display message in chat UI
```

---

## 5. KIẾN TRÚC DEPLOYMENT

### 5.1 Hosting Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    RENDER.COM                           │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Backend Node.js                                │    │
│  │ https://doctorrice.onrender.com                │    │
│  │                                                 │    │
│  │ - Web Service (Node 20)                        │    │
│  │ - Auto-deploy from GitHub                      │    │
│  │ - Free tier (sleeps after 15min inactivity)    │    │
│  │ - Environment variables configured             │    │
│  │ - Health check: /api/health                    │    │
│  │ - Keep-alive cron: ping /api/health every 2min │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Backend AI (Python)                            │    │
│  │ https://doctorrice-ai-service.onrender.com     │    │
│  │                                                 │    │
│  │ - Docker container                             │    │
│  │ - Gunicorn + Flask                             │    │
│  │ - 1 worker, 2 threads                          │    │
│  │ - 120s timeout                                 │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Free Tier)                  │
│  - M0 Cluster (512MB storage)                           │
│  - Auto-backups                                         │
│  - IP whitelist: 0.0.0.0/0 (allow all for Render)      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              CLOUDINARY (Free Tier)                     │
│  - 25GB storage                                         │
│  - 25GB bandwidth/month                                 │
│  - Image transformations (watermark, resize)            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              FIREBASE (Spark Plan - Free)               │
│  - Phone Authentication                                 │
│  - Realtime Database (IoT)                              │
│  - Storage (IoT images)                                 │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Network Architecture

```
Internet
  ↓
HTTPS (SSL/TLS)
  ↓
┌─────────────────────────────────────┐
│     Render.com (Load Balancer)      │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│   Backend Node.js (Port 3000)       │
│   - Express.js server               │
│   - Socket.io server                │
└─────────────────────────────────────┘
  ↓
External Services:
  ├─ MongoDB Atlas (Port 27017)
  ├─ Cloudinary API
  ├─ Firebase Admin SDK
  ├─ Backend AI (Port 5000)
  ├─ SendGrid API
  ├─ Gemini API
  └─ OpenWeatherMap API
```

---

## 6. BẢO MẬT

### 6.1 Authentication & Authorization

- **JWT Tokens**: Access token (7 days), Refresh token
- **Firebase Auth**: Phone OTP, Google, Facebook
- **Password Hashing**: bcrypt (cost factor: 10)
- **Token Storage**: Expo SecureStore (encrypted)

### 6.2 API Security

- **Rate Limiting**: 100 requests/15min per IP
- **CORS**: Configured for specific origins
- **Helmet**: HTTP security headers
- **Input Validation**: Joi/Zod schemas
- **File Upload Limits**: 10MB max

### 6.3 Data Security

- **HTTPS**: Enforced by Render
- **MongoDB TLS**: Encrypted connection
- **Sensitive Data**: Not logged
- **Passwords**: Excluded from queries (`select: false`)
- **Cloudinary**: Signed URLs (time-limited)

---

## 7. HIỆU NĂNG VÀ TỐI ƯU

### 7.1 Client Side

- **Image Compression**: Max 1280px width
- **Lazy Loading**: Images loaded on demand
- **Caching**: AsyncStorage for offline data
- **Code Splitting**: Dynamic imports
- **Skeleton Loading**: Smooth UX

### 7.2 Server Side

- **Database Indexing**: Optimized queries
- **Connection Pooling**: MongoDB connection pool
- **Response Compression**: Gzip compression
- **Caching**: Weather data caching (1 hour)
- **Parallel Processing**: Cloudinary + AI service

### 7.3 Cold Start Optimization

- **Keep-alive Cron**: Ping `/api/health` every 2min
- **Timeout Configuration**: 60s for AI requests
- **Worker Configuration**: Optimized Gunicorn workers

---

## 8. TỔNG KẾT

### 8.1 Kiến trúc tổng thể

Hệ thống **Bác sĩ Lúa** được xây dựng theo kiến trúc **3-Tier** với:
- **Presentation Layer**: React Native Mobile App
- **Application Layer**: Node.js Backend + Python AI Service
- **Data Layer**: MongoDB + Firebase + Cloudinary

### 8.2 Điểm mạnh

✅ **Modular**: Tách biệt rõ ràng giữa các layer  
✅ **Scalable**: Có thể scale từng component độc lập  
✅ **Maintainable**: Code structure rõ ràng, dễ bảo trì  
✅ **Secure**: Nhiều lớp bảo mật  
✅ **Performance**: Tối ưu với caching, compression, parallel processing

### 8.3 Công nghệ sử dụng

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **AI**: Python, Flask, TensorFlow Lite
- **Database**: MongoDB, Firebase Realtime DB
- **Storage**: Cloudinary, Firebase Storage
- **Real-time**: Socket.io
- **Hosting**: Render.com

---

**Tài liệu này phục vụ cho khóa luận và tài liệu kỹ thuật hệ thống**


