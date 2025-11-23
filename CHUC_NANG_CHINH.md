# 🌾 Bác sĩ Lúa - Các Chức Năng Chính

> **Danh sách các chức năng chính của ứng dụng Bác sĩ Lúa**

---

## 📋 Tổng quan

Ứng dụng **Bác sĩ Lúa** có **8 nhóm chức năng chính**, tập trung vào hỗ trợ nông dân trong việc phát hiện và quản lý bệnh lúa thông qua công nghệ AI, IoT và tư vấn chuyên gia.

---

## 🎯 1. PHÁT HIỆN BỆNH TỰ ĐỘNG BẰNG AI

### Mô tả
Chụp ảnh lá lúa và tự động phát hiện bệnh bằng công nghệ AI (TensorFlow Lite).

### Các chức năng:
- ✅ **Chụp ảnh lúa** bằng camera hoặc chọn từ thư viện
- ✅ **Tự động gán watermark GPS** + timestamp vào ảnh
- ✅ **Phát hiện 4 loại bệnh**:
  - Bệnh bạc lá vi khuẩn (Bacterial Leaf Blight)
  - Bệnh đạo ôn (Blast)
  - Bệnh đốm nâu (Brown Spot)
  - Lá khỏe mạnh (Healthy)
- ✅ **Hiển thị kết quả** với độ tin cậy (confidence score)
- ✅ **Lưu lịch sử** tất cả ảnh đã chụp

### Công nghệ:
- AI Model: TensorFlow Lite (Python Flask)
- Image Processing: Cloudinary
- GPS: expo-location

---

## 🗺️ 2. BẢN ĐỒ TRỰC QUAN HÓA DỊCH BỆNH

### Mô tả
Hiển thị tất cả điểm chụp ảnh trên bản đồ với trực quan hóa vùng bệnh.

### Các chức năng:
- ✅ **Hiển thị markers** tất cả ảnh đã chụp trên bản đồ
- ✅ **Màu sắc marker**:
  - 🟢 Xanh = Lá khỏe mạnh
  - 🔴 Đỏ = Có bệnh
- ✅ **Clustering** markers gần nhau
- ✅ **Visualization vùng bệnh**:
  - Vòng tròn vàng (30m radius) quanh marker bệnh
  - Đường đỏ nối các marker bệnh gần nhau
  - Polygon đỏ nếu ≥3 markers bệnh trong vùng
- ✅ **Click marker** để xem chi tiết ảnh

### Công nghệ:
- Map Engine: Leaflet.js (OpenStreetMap)
- WebView: react-native-webview

---

## 🔌 3. QUẢN LÝ RUỘNG VÀ KẾT NỐI IoT

### Mô tả
Quản lý ruộng và kết nối thiết bị IoT để tự động giám sát.

### Các chức năng:
- ✅ **Quản lý ruộng**:
  - Tạo ruộng mới (tên, vị trí, bán kính)
  - Xem danh sách ruộng
  - Chỉnh sửa và xóa ruộng
- ✅ **Kết nối IoT**:
  - Tự động tạo mã kết nối (FIELD-XXXXXXXX)
  - Kết nối thiết bị IoT với ruộng
  - Xem ảnh tự động từ IoT device
- ✅ **Dữ liệu cảm biến**:
  - Nhiệt độ (Temperature)
  - Độ ẩm không khí (Humidity)
  - Độ pH đất
  - Độ ẩm đất (Soil Moisture)
  - Ánh sáng (Lux)
  - Tốc độ gió (Wind Speed)
- ✅ **Phân tích ảnh IoT** với AI
- ✅ **Gallery ảnh IoT** (tổng hợp và theo ngày)

### Công nghệ:
- IoT Platform: Firebase Realtime Database
- Storage: Firebase Storage

---

## 💬 4. CHAT VỚI CHUYÊN GIA (REAL-TIME)

### Mô tả
Chat trực tiếp với chuyên gia nông nghiệp để được tư vấn.

### Các chức năng:
- ✅ **Danh sách chuyên gia** với rating và đánh giá
- ✅ **Xem profile chuyên gia** (chuyên môn, kinh nghiệm)
- ✅ **Chat real-time** với Socket.io
- ✅ **Gửi tin nhắn text** và ảnh trong chat
- ✅ **Lịch sử cuộc trò chuyện**
- ✅ **Đánh giá chuyên gia** sau khi chat
- ✅ **Thông báo** tin nhắn mới

### Công nghệ:
- Real-time: Socket.io
- Database: MongoDB (Conversations, Messages)

---

## 🤖 5. CHAT AI VỚI GEMINI

### Mô tả
Tư vấn nông nghiệp thông qua AI chatbot (Google Gemini).

### Các chức năng:
- ✅ **Chat với AI** để hỏi đáp về nông nghiệp
- ✅ **Gửi ảnh** để AI phân tích và tư vấn
- ✅ **Lịch sử chat** với AI
- ✅ **Context awareness** - AI hiểu ngữ cảnh cuộc trò chuyện

### Công nghệ:
- AI: Google Gemini API (Gemini 2.5 Flash Lite)

---

## 🌤️ 6. THỜI TIẾT VÀ CẢNH BÁO

### Mô tả
Theo dõi thời tiết và cảnh báo để hỗ trợ quyết định nông nghiệp.

### Các chức năng:
- ✅ **Thời tiết hiện tại** tại vị trí người dùng
- ✅ **Dự báo thời tiết** 7 ngày tới
- ✅ **Cảnh báo thời tiết** bất thường
- ✅ **Theo dõi bão** và đường đi của bão
- ✅ **Khuyến nghị nông nghiệp** dựa trên thời tiết

### Công nghệ:
- Weather API: OpenWeatherMap

---

## 📊 7. QUẢN LÝ VÀ THỐNG KÊ

### Mô tả
Quản lý ảnh, theo dõi lịch sử và thống kê.

### Các chức năng:
- ✅ **Lịch sử ảnh** đã chụp
- ✅ **Thống kê ảnh**:
  - Tổng số ảnh
  - Tỷ lệ bệnh theo thời gian
  - Phân bố theo loại bệnh
- ✅ **Tìm kiếm ảnh** theo từ khóa, ngày tháng
- ✅ **Xóa ảnh**
- ✅ **Log điều trị** - Ghi chép quá trình điều trị

---

## 👤 8. QUẢN LÝ TÀI KHOẢN

### Mô tả
Quản lý thông tin cá nhân và cài đặt.

### Các chức năng:
- ✅ **Đăng nhập đa phương thức**:
  - Email/Password
  - Số điện thoại/OTP (Firebase)
  - Google Sign-In
  - Facebook Sign-In
- ✅ **Quản lý profile**:
  - Xem và chỉnh sửa thông tin
  - Đổi mật khẩu
  - Upload avatar
- ✅ **Cài đặt**:
  - Đổi ngôn ngữ (Tiếng Việt/English)
  - Cài đặt thông báo
- ✅ **Xem chính sách bảo mật**

---

## 📱 9. TIN TỨC VÀ THÔNG TIN (Bổ sung)

### Mô tả
Cung cấp tin tức và thông tin nông nghiệp.

### Các chức năng:
- ✅ **Tin tức nông nghiệp** (feed)
- ✅ **Chi tiết tin tức**
- ✅ **FAQ** - Câu hỏi thường gặp

---

## 📊 Tổng kết

### Số lượng chức năng chính: **9 nhóm**

| STT | Nhóm chức năng | Số lượng tính năng | Mức độ quan trọng |
|-----|----------------|-------------------|-------------------|
| 1 | Phát hiện bệnh bằng AI | 5 | ⭐⭐⭐⭐⭐ Core |
| 2 | Bản đồ trực quan hóa | 5 | ⭐⭐⭐⭐⭐ Core |
| 3 | Quản lý ruộng & IoT | 7 | ⭐⭐⭐⭐ Advanced |
| 4 | Chat với chuyên gia | 7 | ⭐⭐⭐⭐ Advanced |
| 5 | Chat AI (Gemini) | 4 | ⭐⭐⭐ Supporting |
| 6 | Thời tiết & cảnh báo | 5 | ⭐⭐⭐ Supporting |
| 7 | Quản lý & thống kê | 5 | ⭐⭐⭐ Supporting |
| 8 | Quản lý tài khoản | 6 | ⭐⭐⭐⭐ Essential |
| 9 | Tin tức & thông tin | 3 | ⭐⭐ Optional |

### Phân loại theo mức độ:

#### 🔴 **Core Features** (Bắt buộc - 10 tính năng)
- Phát hiện bệnh bằng AI
- Bản đồ trực quan hóa
- Quản lý tài khoản cơ bản

#### 🟡 **Advanced Features** (Nâng cao - 14 tính năng)
- Quản lý ruộng & IoT
- Chat với chuyên gia

#### 🟢 **Supporting Features** (Hỗ trợ - 12 tính năng)
- Chat AI (Gemini)
- Thời tiết & cảnh báo
- Quản lý & thống kê
- Tin tức & thông tin

---

## 🎯 Điểm nổi bật

### ✨ **Công nghệ AI tiên tiến**
- TensorFlow Lite model phát hiện 4 loại bệnh
- Độ chính xác cao với confidence score
- Xử lý ảnh tự động với watermark GPS

### ✨ **IoT Integration**
- Kết nối thiết bị IoT tự động
- Thu thập dữ liệu cảm biến real-time
- Phân tích ảnh tự động từ IoT

### ✨ **Real-time Communication**
- Chat trực tiếp với chuyên gia
- Socket.io cho tin nhắn instant
- Thông báo real-time

### ✨ **Visualization**
- Bản đồ trực quan với clustering
- Visualization vùng bệnh
- Thống kê và phân tích

---

## 📈 Lợi ích cho người dùng

1. **Phát hiện bệnh nhanh chóng** - Chỉ cần chụp ảnh, AI tự động phân tích
2. **Theo dõi dịch bệnh** - Xem bản đồ để biết vùng nào có bệnh
3. **Tư vấn chuyên nghiệp** - Chat với chuyên gia để được hướng dẫn
4. **Tự động hóa** - IoT device tự động chụp ảnh và gửi dữ liệu
5. **Dự báo thời tiết** - Biết trước thời tiết để quyết định canh tác

---

**Tài liệu này phục vụ cho báo cáo và giới thiệu hệ thống**

