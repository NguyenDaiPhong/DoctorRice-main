# 🌾 Bác sĩ Lúa - Phân Loại Chức Năng

> **Phân chia chức năng theo người dùng và hệ thống**

---

## 📋 Mục lục

1. [Chức năng của Người dùng](#1-chức-năng-của-người-dùng)
2. [Chức năng của Hệ thống](#2-chức-năng-của-hệ-thống)
3. [Tổng kết](#3-tổng-kết)

---

## 1. Chức năng của Người dùng

### 👤 **1.1 Authentication & Account Management** (7 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 1 | Đăng ký tài khoản | Tạo tài khoản mới với email/phone | `auth/register` |
| 2 | Đăng nhập Email/Password | Đăng nhập bằng email và mật khẩu | `auth/login` |
| 3 | Đăng nhập OTP | Đăng nhập bằng số điện thoại và mã OTP (Firebase) | `auth/otp-login` |
| 4 | Đăng nhập Google | Đăng nhập bằng tài khoản Google | `auth/login` |
| 5 | Đăng nhập Facebook | Đăng nhập bằng tài khoản Facebook | `auth/login` |
| 6 | Quên mật khẩu | Yêu cầu reset mật khẩu qua email | `auth/forgot-password` |
| 7 | Đăng xuất | Thoát khỏi tài khoản hiện tại | `account` |

### 👤 **1.2 Profile Management** (4 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 8 | Xem thông tin cá nhân | Xem profile, avatar, thông tin tài khoản | `account` |
| 9 | Chỉnh sửa profile | Cập nhật tên, avatar, email, phone | `edit-profile` |
| 10 | Đổi mật khẩu | Thay đổi mật khẩu tài khoản | `change-password` |
| 11 | Xem chính sách bảo mật | Đọc Privacy Policy | `auth/privacy-policy` |

### 👤 **1.3 Camera & Photo Taking** (5 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 12 | Mở camera | Mở camera để chụp ảnh lúa | `camera-modal` |
| 13 | Chụp ảnh | Chụp ảnh bằng camera thiết bị | `camera-modal` |
| 14 | Chọn ảnh từ thư viện | Chọn ảnh có sẵn trong thiết bị | `camera-modal` |
| 15 | Xem preview ảnh | Xem lại ảnh trước khi upload | `camera-modal` |
| 16 | Xác nhận upload | Xác nhận upload ảnh lên hệ thống | `camera-modal` |

### 👤 **1.4 Photo Management** (7 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 17 | Xem kết quả AI | Xem kết quả phát hiện bệnh sau khi upload | `result` |
| 18 | Xem chi tiết ảnh | Xem thông tin chi tiết của ảnh (metadata, prediction) | `photo-detail` |
| 19 | Xem lịch sử ảnh | Xem danh sách tất cả ảnh đã chụp | `photo-history` |
| 20 | Xóa ảnh | Xóa ảnh khỏi hệ thống | `photo-detail`, `photo-history` |
| 21 | Chia sẻ ảnh | Chia sẻ ảnh với người khác | `photo-detail` |
| 22 | Xem thống kê ảnh | Xem số lượng, tỷ lệ bệnh theo thời gian | `account` |
| 23 | Tìm kiếm ảnh | Tìm kiếm ảnh theo từ khóa, ngày tháng | `photo-history` |

### 👤 **1.5 Map & Visualization** (5 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 24 | Xem bản đồ | Xem bản đồ với tất cả điểm chụp ảnh | `mapFarm` |
| 25 | Click marker | Click vào marker để xem chi tiết | `mapFarm` |
| 26 | Zoom/Pan map | Phóng to, thu nhỏ, di chuyển bản đồ | `mapFarm` |
| 27 | Tìm vị trí hiện tại | Điều hướng đến vị trí GPS hiện tại | `mapFarm` |
| 28 | Lọc marker | Lọc marker theo loại bệnh, ngày tháng | `mapFarm` |

### 👤 **1.6 Field Management** (5 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 29 | Tạo ruộng mới | Tạo ruộng với tên, vị trí, bán kính | `field-management` |
| 30 | Xem danh sách ruộng | Xem tất cả ruộng đã tạo | `field-management` |
| 31 | Xem chi tiết ruộng | Xem thông tin chi tiết của ruộng | `field-management` |
| 32 | Chỉnh sửa ruộng | Cập nhật thông tin ruộng | `field-management` |
| 33 | Xóa ruộng | Xóa ruộng khỏi hệ thống | `field-management` |

### 👤 **1.7 IoT Integration** (6 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 34 | Kết nối thiết bị IoT | Kết nối thiết bị IoT với ruộng qua mã kết nối | `field-management` (Connect IoT Modal) |
| 35 | Xem danh sách thiết bị | Xem tất cả thiết bị IoT đã kết nối | `field-management` |
| 36 | Ngắt kết nối IoT | Ngắt kết nối thiết bị IoT | `field-management` |
| 37 | Xem ảnh từ IoT | Xem ảnh được chụp tự động bởi IoT device | `iot-gallery` |
| 38 | Xem ảnh IoT theo ngày | Xem ảnh IoT được nhóm theo ngày | `iot-daily-gallery` |
| 39 | Xem dữ liệu cảm biến | Xem dữ liệu cảm biến (nhiệt độ, độ ẩm, pH, v.v.) | `iot-gallery`, `iot-daily-gallery` |

### 👤 **1.8 Expert Chat** (7 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 40 | Xem danh sách chuyên gia | Xem danh sách chuyên gia với rating | `expert-list` |
| 41 | Xem chi tiết chuyên gia | Xem profile, chuyên môn, đánh giá | `expert-detail` |
| 42 | Bắt đầu chat | Bắt đầu cuộc trò chuyện với chuyên gia | `expert-chat` |
| 43 | Gửi tin nhắn | Gửi tin nhắn text trong chat | `expert-chat` |
| 44 | Gửi ảnh trong chat | Gửi ảnh trong cuộc trò chuyện | `expert-chat` |
| 45 | Xem lịch sử chat | Xem tất cả cuộc trò chuyện với chuyên gia | `expert-conversations` |
| 46 | Đánh giá chuyên gia | Đánh giá và review chuyên gia sau khi chat | `expert-reviews` |

### 👤 **1.9 AI Chat (Gemini)** (4 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 47 | Mở AI Chat | Mở cửa sổ chat với AI | `Home` (FloatingChatButton) |
| 48 | Gửi câu hỏi | Gửi câu hỏi để AI tư vấn nông nghiệp | `AI Chat Modal` |
| 49 | Gửi ảnh cho AI | Gửi ảnh để AI phân tích và tư vấn | `AI Chat Modal` |
| 50 | Xem lịch sử chat AI | Xem lịch sử tất cả cuộc trò chuyện với AI | `ai-chat-history` |

### 👤 **1.10 Weather & Storm** (5 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 51 | Xem thời tiết hiện tại | Xem thời tiết tại vị trí hiện tại | `weather` |
| 52 | Xem dự báo thời tiết | Xem dự báo thời tiết 7 ngày tới | `weather`, `weather-detail` |
| 53 | Xem cảnh báo thời tiết | Xem cảnh báo thời tiết bất thường | `weather`, `weather-detail` |
| 54 | Theo dõi bão | Xem thông tin và đường đi của bão | `storm-tracking` |
| 55 | Xem khuyến nghị nông nghiệp | Xem lời khuyên dựa trên thời tiết | `weather-detail` |

### 👤 **1.11 News & Information** (3 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 56 | Xem tin tức | Xem danh sách tin tức nông nghiệp | `news` |
| 57 | Xem chi tiết tin tức | Đọc nội dung chi tiết của tin tức | `news-detail` |
| 58 | Xem FAQ | Xem câu hỏi thường gặp | `faq` |

### 👤 **1.12 Settings & Preferences** (2 chức năng)

| STT | Chức năng | Mô tả | Màn hình |
|-----|-----------|-------|----------|
| 59 | Đổi ngôn ngữ | Chuyển đổi giữa Tiếng Việt và Tiếng Anh | `account` (Settings) |
| 60 | Cài đặt thông báo | Bật/tắt thông báo từ app | `account` (Settings) |

---

## 2. Chức năng của Hệ thống

### 🔧 **2.1 Authentication & Security** (8 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 1 | Xác thực JWT Token | Kiểm tra và xác thực JWT token trong mọi request | `auth.middleware.ts` |
| 2 | Hash mật khẩu | Mã hóa mật khẩu bằng bcrypt trước khi lưu | `auth.controller.ts` |
| 3 | Tạo JWT Token | Tạo access token và refresh token | `auth.controller.ts` |
| 4 | Refresh Token | Tự động làm mới token khi hết hạn | `auth.controller.ts` |
| 5 | Xác thực Firebase Token | Xác thực Firebase ID token từ OTP login | `firebase-admin.service.ts` |
| 6 | Xác thực Google Token | Xác thực Google ID token từ Google Sign-In | `auth.controller.ts` |
| 7 | Rate Limiting | Giới hạn số lượng request để tránh spam/attack | `rateLimiter.middleware.ts` |
| 8 | Input Validation | Kiểm tra và validate dữ liệu đầu vào | `validators.ts`, Joi/Zod schemas |

### 🔧 **2.2 Image Processing** (6 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 9 | Resize ảnh | Tự động resize ảnh về kích thước tối ưu (max 1280px) | `expo-image-manipulator` (Client) |
| 10 | Upload lên Cloudinary | Upload ảnh original lên Cloudinary storage | `cloudinary.service.ts` |
| 11 | Tạo watermark GPS | Tự động tạo watermark chứa GPS + timestamp | `cloudinary.service.ts` |
| 12 | Tạo thumbnail | Tự động tạo thumbnail (300x300) cho ảnh | `cloudinary.service.ts` |
| 13 | Optimize ảnh | Tối ưu hóa chất lượng và dung lượng ảnh | `cloudinary.service.ts` |
| 14 | Validate file type | Kiểm tra định dạng file (chỉ JPEG, PNG) | `upload.middleware.ts` |

### 🔧 **2.3 AI Disease Detection** (5 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 15 | Preprocess ảnh | Chuẩn hóa ảnh về 224x224 RGB cho AI model | `backend-ai/app.py` |
| 16 | Chạy AI Model | Chạy TensorFlow Lite model để phát hiện bệnh | `backend-ai/app.py` |
| 17 | Phân tích kết quả | Tính toán confidence score và class prediction | `backend-ai/app.py` |
| 18 | Gửi kết quả | Trả về kết quả AI cho backend Node.js | `ai.service.ts` |
| 19 | Xử lý lỗi AI | Retry logic khi AI service fail hoặc timeout | `ai.service.ts` |

### 🔧 **2.4 GPS & Location** (4 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 20 | Lấy GPS coordinates | Lấy vị trí GPS hiện tại từ thiết bị | `expo-location` (Client) |
| 21 | Reverse Geocoding | Chuyển đổi GPS sang địa chỉ (address) | Backend API hoặc client |
| 22 | Tính khoảng cách | Tính khoảng cách giữa 2 điểm GPS (Haversine) | `gps.utils.ts` |
| 23 | Clustering markers | Tự động nhóm markers gần nhau trên map | `MapFarmScreenWebView.tsx` |

### 🔧 **2.5 IoT Integration** (6 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 24 | Tạo mã kết nối IoT | Tự động tạo mã kết nối (FIELD-XXXXXXXX) khi tạo ruộng | `field.controller.ts` |
| 25 | Hash mã kết nối | Mã hóa mã kết nối IoT trước khi lưu | `iot.controller.ts` |
| 26 | Xác thực mã kết nối | Kiểm tra mã kết nối khi device kết nối | `iot.controller.ts` |
| 27 | Tạo Firebase path | Tự động tạo Firebase Realtime DB path cho device | `firebase-iot.service.ts` |
| 28 | Đồng bộ ảnh IoT | Lấy ảnh từ Firebase Realtime DB | `firebase-iot.service.ts` |
| 29 | Xử lý dữ liệu cảm biến | Parse và lưu dữ liệu cảm biến từ IoT device | `iot.controller.ts` |

### 🔧 **2.6 Real-time Communication** (4 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 30 | Kết nối Socket.io | Thiết lập WebSocket connection cho real-time chat | `socket.server.ts` |
| 31 | Gửi tin nhắn real-time | Gửi tin nhắn instant giữa user và expert | `socket.server.ts` |
| 32 | Cập nhật unread count | Tự động cập nhật số tin nhắn chưa đọc | `conversation.controller.ts` |
| 33 | Push notification | Gửi thông báo khi có tin nhắn mới | `notification.service.ts` (nếu có) |

### 🔧 **2.7 Data Management** (7 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 34 | Lưu Photo vào MongoDB | Lưu metadata và kết quả AI vào database | `photo.controller.ts` |
| 35 | Lưu Field vào MongoDB | Lưu thông tin ruộng vào database | `field.controller.ts` |
| 36 | Lưu Conversation | Lưu cuộc trò chuyện và tin nhắn vào database | `conversation.controller.ts` |
| 37 | Lưu Treatment Log | Lưu log điều trị vào database | `treatment.controller.ts` |
| 38 | Indexing database | Tự động tạo index để tối ưu query | Mongoose schemas |
| 39 | Pagination | Tự động phân trang khi lấy danh sách | Controllers |
| 40 | Filtering & Sorting | Lọc và sắp xếp dữ liệu theo điều kiện | Controllers |

### 🔧 **2.8 AI Chat (Gemini)** (3 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 41 | Gọi Gemini API | Gửi request đến Google Gemini API | `gemini.service.ts` |
| 42 | Xử lý context | Duy trì context cuộc trò chuyện với AI | `gemini.service.ts` |
| 43 | Lưu chat history | Lưu lịch sử chat với AI vào database | `chat-history.service.ts` |

### 🔧 **2.9 Weather Data** (3 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 44 | Fetch weather data | Lấy dữ liệu thời tiết từ OpenWeatherMap API | `weather.service.ts` |
| 45 | Cache weather data | Cache dữ liệu thời tiết để giảm API calls | `weather.service.ts` |
| 46 | Generate weather warnings | Tạo cảnh báo thời tiết dựa trên dữ liệu | `weather.service.ts` |

### 🔧 **2.10 Email & Notification** (4 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 47 | Gửi email OTP | Gửi mã OTP qua email | `email.service.ts` |
| 48 | Gửi email reset password | Gửi link reset mật khẩu qua email | `email.service.ts` |
| 49 | Gửi email notification | Gửi email thông báo các sự kiện quan trọng | `email.service.ts` |
| 50 | Template email | Tạo email template với HTML/CSS | `email.service.ts` |

### 🔧 **2.11 System Maintenance** (4 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 51 | Health check | Kiểm tra trạng thái hoạt động của hệ thống | `/api/health` |
| 52 | Keep-alive cron job | Tự động ping `/health` để giữ server không sleep (Render) | `keepAlive.ts` |
| 53 | Logging | Ghi log tất cả hoạt động và lỗi | `logger.ts` (Winston) |
| 54 | Error handling | Xử lý và trả về lỗi một cách thống nhất | Error middleware |

### 🔧 **2.12 API Documentation** (2 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 55 | Swagger UI | Tự động generate API documentation | `swagger.js` |
| 56 | API schema validation | Validate request/response theo OpenAPI schema | Swagger middleware |

### 🔧 **2.13 Security & Performance** (5 chức năng)

| STT | Chức năng | Mô tả | Module/Service |
|-----|-----------|-------|----------------|
| 57 | CORS configuration | Kiểm soát CORS headers | `cors` middleware |
| 58 | Helmet security | Bảo mật HTTP headers | `helmet` middleware |
| 59 | Compression | Nén response để tăng tốc độ | `compression` middleware |
| 60 | Request timeout | Timeout cho các request dài | Express timeout |
| 61 | Session management | Quản lý session và token refresh | `auth.controller.ts` |

---

## 3. Tổng kết

### 📊 **Thống kê chức năng**

| Nhóm | Số lượng | Mô tả |
|------|----------|-------|
| **Chức năng của Người dùng** | **60** | Các thao tác mà người dùng có thể thực hiện trực tiếp |
| **Chức năng của Hệ thống** | **61** | Các xử lý tự động của hệ thống |
| **TỔNG CỘNG** | **121** | Tổng số chức năng |

### 🎯 **Phân loại theo mức độ quan trọng**

#### **Chức năng Core (Bắt buộc)**
- Authentication & Security (8 chức năng hệ thống)
- AI Disease Detection (5 chức năng hệ thống)
- Image Processing (6 chức năng hệ thống)
- Camera & Photo Taking (5 chức năng người dùng)
- Photo Management (7 chức năng người dùng)

#### **Chức năng Advanced (Nâng cao)**
- IoT Integration (6 chức năng người dùng + 6 chức năng hệ thống)
- Expert Chat (7 chức năng người dùng + 4 chức năng hệ thống)
- AI Chat Gemini (4 chức năng người dùng + 3 chức năng hệ thống)

#### **Chức năng Supporting (Hỗ trợ)**
- Weather & Storm (5 chức năng người dùng + 3 chức năng hệ thống)
- News & Information (3 chức năng người dùng)
- System Maintenance (4 chức năng hệ thống)

### 📱 **Phân loại theo nơi xử lý**

| Nơi xử lý | Số lượng | Mô tả |
|-----------|----------|-------|
| **Client (App)** | ~30 | Xử lý trên thiết bị người dùng |
| **Backend Node.js** | ~50 | Xử lý trên server Node.js |
| **Backend AI (Python)** | 5 | Xử lý AI trên server Python |
| **Firebase** | 6 | Xử lý IoT và Authentication |
| **External APIs** | 4 | OpenWeatherMap, Gemini, SendGrid |

---

## 📝 Ghi chú

- **Chức năng của Người dùng**: Những gì người dùng có thể **nhìn thấy** và **tương tác** trực tiếp
- **Chức năng của Hệ thống**: Những gì hệ thống **tự động xử lý** ở phía sau để hỗ trợ chức năng người dùng

---

**Tài liệu này được tạo để phục vụ báo cáo và phân tích hệ thống**

