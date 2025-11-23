# 📋 YÊU CẦU CHỨC NĂNG HỆ THỐNG

## Ứng dụng Bác sĩ Lúa - Hệ thống phát hiện bệnh lúa bằng AI và quản lý IoT

---

## 1. GIỚI THIỆU

### 1.1 Mục đích
Tài liệu này mô tả chi tiết các yêu cầu chức năng của hệ thống **Bác sĩ Lúa** - một ứng dụng di động hỗ trợ nông dân trong việc phát hiện và quản lý bệnh lúa thông qua công nghệ AI, IoT và tư vấn chuyên gia.

### 1.2 Phạm vi
Tài liệu bao gồm tất cả các chức năng chính của hệ thống, được phân loại theo từng module và mô tả chi tiết về đầu vào, đầu ra, xử lý và điều kiện.

### 1.3 Đối tượng sử dụng
- Nông dân: Người sử dụng chính của ứng dụng
- Chuyên gia nông nghiệp: Tư vấn và hỗ trợ nông dân
- Admin: Quản trị hệ thống

---

## 2. PHÂN LOẠI CHỨC NĂNG

Hệ thống được chia thành **8 nhóm chức năng chính**:

1. **Quản lý xác thực và tài khoản** (Authentication & Account Management)
2. **Phát hiện bệnh tự động bằng AI** (AI Disease Detection)
3. **Quản lý ảnh và lịch sử** (Photo Management)
4. **Bản đồ trực quan hóa dịch bệnh** (Map Visualization)
5. **Quản lý ruộng và IoT** (Field & IoT Management)
6. **Chat với chuyên gia** (Expert Chat System)
7. **Chat AI với Gemini** (AI Chat)
8. **Thời tiết và cảnh báo** (Weather & Storm Tracking)

---

## 3. MÔ TẢ CHI TIẾT CÁC CHỨC NĂNG

## 3.1 NHÓM CHỨC NĂNG: QUẢN LÝ XÁC THỰC VÀ TÀI KHOẢN

### 3.1.1 FR-001: Đăng ký tài khoản

**ID**: FR-001  
**Tên**: Đăng ký tài khoản  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Cho phép người dùng mới tạo tài khoản trong hệ thống.

**Đầu vào**:
- Email hoặc số điện thoại
- Mật khẩu (tối thiểu 6 ký tự)
- Xác nhận mật khẩu
- Tên hiển thị
- (Tùy chọn) Avatar

**Đầu ra**:
- Tài khoản được tạo thành công
- JWT token và refresh token
- Thông tin user mới tạo

**Xử lý**:
1. Validate dữ liệu đầu vào (email/phone format, password strength)
2. Kiểm tra email/phone đã tồn tại chưa
3. Hash mật khẩu bằng bcrypt
4. Tạo user mới trong MongoDB
5. Tạo JWT token (expires 7 days)
6. Tạo refresh token
7. Trả về token và thông tin user

**Điều kiện tiên quyết**:
- Chưa có tài khoản trong hệ thống
- Email/phone hợp lệ

**Điều kiện sau**:
- User đã được tạo trong database
- User có thể đăng nhập

**Ngoại lệ**:
- Email/phone đã tồn tại → Lỗi 409 (Conflict)
- Dữ liệu không hợp lệ → Lỗi 400 (Bad Request)
- Lỗi server → Lỗi 500 (Internal Server Error)

---

### 3.1.2 FR-002: Đăng nhập bằng Email/Password

**ID**: FR-002  
**Tên**: Đăng nhập bằng Email/Password  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Cho phép người dùng đăng nhập bằng email và mật khẩu.

**Đầu vào**:
- Email
- Mật khẩu

**Đầu ra**:
- JWT access token
- Refresh token
- Thông tin user

**Xử lý**:
1. Validate email và password
2. Tìm user theo email trong MongoDB
3. So sánh mật khẩu với bcrypt
4. Tạo JWT token và refresh token
5. Lưu refresh token vào database (nếu cần)
6. Trả về token và thông tin user

**Điều kiện tiên quyết**:
- User đã có tài khoản
- Email và password hợp lệ

**Điều kiện sau**:
- User đã đăng nhập
- Token được lưu trên client

**Ngoại lệ**:
- Email không tồn tại → Lỗi 401 (Unauthorized)
- Mật khẩu sai → Lỗi 401 (Unauthorized)
- Tài khoản bị khóa → Lỗi 403 (Forbidden)

---

### 3.1.3 FR-003: Đăng nhập bằng OTP (Số điện thoại)

**ID**: FR-003  
**Tên**: Đăng nhập bằng OTP  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Cho phép người dùng đăng nhập bằng số điện thoại và mã OTP qua Firebase Authentication.

**Đầu vào**:
- Số điện thoại (format: 0xxxxxxxxx)
- Mã OTP (6 chữ số)

**Đầu ra**:
- JWT access token
- Refresh token
- Thông tin user

**Xử lý**:
1. Validate số điện thoại format
2. Gửi OTP qua Firebase Authentication
3. User nhập mã OTP
4. Xác thực OTP với Firebase
5. Verify Firebase ID token với Firebase Admin SDK
6. Tìm hoặc tạo user trong MongoDB (theo phone)
7. Tạo JWT token và refresh token
8. Trả về token và thông tin user

**Điều kiện tiên quyết**:
- Có số điện thoại hợp lệ
- Đã cấu hình Firebase Authentication

**Điều kiện sau**:
- User đã đăng nhập
- OTP được gửi thành công

**Ngoại lệ**:
- OTP sai → Lỗi 401 (Unauthorized)
- OTP hết hạn → Lỗi 401 (Unauthorized)
- Firebase service error → Lỗi 503 (Service Unavailable)

---

### 3.1.4 FR-004: Đăng nhập bằng Google

**ID**: FR-004  
**Tên**: Đăng nhập bằng Google  
**Mức độ ưu tiên**: Trung bình  
**Mô tả**: Cho phép người dùng đăng nhập bằng tài khoản Google.

**Đầu vào**:
- Google ID token

**Đầu ra**:
- JWT access token
- Refresh token
- Thông tin user

**Xử lý**:
1. Verify Google ID token với Google API
2. Lấy thông tin user từ Google (email, name, avatar)
3. Tìm user trong MongoDB theo email hoặc socialIds.google
4. Nếu chưa có: Tạo user mới
5. Nếu có: Cập nhật socialIds.google
6. Tạo JWT token và refresh token
7. Trả về token và thông tin user

**Điều kiện tiên quyết**:
- User có tài khoản Google
- Đã cấu hình Google Sign-In

**Điều kiện sau**:
- User đã đăng nhập
- Google account được liên kết

**Ngoại lệ**:
- Google token không hợp lệ → Lỗi 401 (Unauthorized)
- Google service error → Lỗi 503 (Service Unavailable)

---

### 3.1.5 FR-005: Quên mật khẩu

**ID**: FR-005  
**Tên**: Quên mật khẩu  
**Mức độ ưu tiên**: Trung bình  
**Mô tả**: Cho phép người dùng yêu cầu reset mật khẩu qua email.

**Đầu vào**:
- Email

**Đầu ra**:
- Email chứa link reset mật khẩu đã được gửi

**Xử lý**:
1. Validate email format
2. Tìm user theo email
3. Tạo reset token (expires 1 hour)
4. Lưu reset token vào database
5. Gửi email chứa link reset mật khẩu (SendGrid/Nodemailer)
6. Trả về message thành công

**Điều kiện tiên quyết**:
- Email hợp lệ
- Email đã tồn tại trong hệ thống

**Điều kiện sau**:
- Email reset đã được gửi
- Reset token được tạo

**Ngoại lệ**:
- Email không tồn tại → Vẫn trả về success (bảo mật)
- Email service error → Lỗi 503 (Service Unavailable)

---

### 3.1.6 FR-006: Đổi mật khẩu

**ID**: FR-006  
**Tên**: Đổi mật khẩu  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Cho phép người dùng đổi mật khẩu của tài khoản.

**Đầu vào**:
- Mật khẩu cũ
- Mật khẩu mới
- Xác nhận mật khẩu mới

**Đầu ra**:
- Mật khẩu đã được đổi thành công

**Xử lý**:
1. Validate mật khẩu mới (strength, match)
2. Verify mật khẩu cũ với bcrypt
3. Hash mật khẩu mới
4. Cập nhật passwordHash trong MongoDB
5. Invalidate tất cả refresh token cũ (nếu cần)
6. Trả về message thành công

**Điều kiện tiên quyết**:
- User đã đăng nhập (có JWT token)
- Mật khẩu cũ đúng

**Điều kiện sau**:
- Mật khẩu mới đã được lưu
- User phải đăng nhập lại với mật khẩu mới

**Ngoại lệ**:
- Mật khẩu cũ sai → Lỗi 401 (Unauthorized)
- Mật khẩu mới không hợp lệ → Lỗi 400 (Bad Request)

---

### 3.1.7 FR-007: Chỉnh sửa profile

**ID**: FR-007  
**Tên**: Chỉnh sửa profile  
**Mức độ ưu tiên**: Trung bình  
**Mô tả**: Cho phép người dùng cập nhật thông tin cá nhân.

**Đầu vào**:
- Display name
- Avatar (file image)
- Email (nếu muốn đổi)
- Phone (nếu muốn đổi)

**Đầu ra**:
- Profile đã được cập nhật
- Thông tin user mới

**Xử lý**:
1. Validate dữ liệu đầu vào
2. Nếu có avatar: Upload lên Cloudinary
3. Cập nhật thông tin trong MongoDB
4. Trả về thông tin user mới

**Điều kiện tiên quyết**:
- User đã đăng nhập

**Điều kiện sau**:
- Profile đã được cập nhật

**Ngoại lệ**:
- Dữ liệu không hợp lệ → Lỗi 400 (Bad Request)
- File avatar quá lớn → Lỗi 400 (Bad Request)

---

## 3.2 NHÓM CHỨC NĂNG: PHÁT HIỆN BỆNH TỰ ĐỘNG BẰNG AI

### 3.2.1 FR-008: Chụp ảnh lúa

**ID**: FR-008  
**Tên**: Chụp ảnh lúa  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Cho phép người dùng chụp ảnh lá lúa bằng camera hoặc chọn từ thư viện.

**Đầu vào**:
- Ảnh từ camera hoặc gallery
- Vị trí GPS hiện tại (tự động)

**Đầu ra**:
- Ảnh đã chụp
- GPS coordinates (lat, lng)
- Timestamp

**Xử lý (Client)**:
1. Request permission Camera và Location
2. Hiển thị camera preview với GPS overlay
3. User chụp ảnh hoặc chọn từ gallery
4. Lấy GPS coordinates hiện tại
5. Resize ảnh (max width 1280px)
6. Tạo FormData với metadata
7. Gọi API upload

**Điều kiện tiên quyết**:
- User đã đăng nhập
- Camera permission granted
- Location permission granted

**Điều kiện sau**:
- Ảnh đã sẵn sàng để upload

**Ngoại lệ**:
- Permission denied → Hiển thị hướng dẫn enable permission
- GPS không khả dụng → Dùng location cũ hoặc thông báo

---

### 3.2.2 FR-009: Upload ảnh và phân tích AI

**ID**: FR-009  
**Tên**: Upload ảnh và phân tích AI  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Upload ảnh lên server, tạo watermark GPS, và phân tích bệnh bằng AI.

**Đầu vào**:
- File ảnh (multipart/form-data)
- Latitude (number)
- Longitude (number)
- Timestamp (unix ms)
- Device (string)
- Orientation (portrait/landscape)

**Đầu ra**:
- Original URL (Cloudinary)
- Watermarked URL (Cloudinary)
- Thumbnail URL (Cloudinary)
- AI Prediction:
  - Class (bacterial_leaf_blight/blast/brown_spot/healthy)
  - ClassVi (Vietnamese label)
  - Confidence (0-100)
  - AllPredictions (object)

**Xử lý (Backend)**:
1. Auth middleware: Verify JWT token
2. Multer middleware: Parse multipart/form-data
3. Validate file (type, size)
4. Create Photo document (status: 'processing')
5. **Parallel processing**:
   - Upload to Cloudinary:
     - Upload original image
     - Generate watermark URL (GPS + timestamp)
     - Generate thumbnail URL
   - Call AI Service:
     - POST image to Python AI service
     - Receive prediction result
6. Update Photo document:
   - originalUrl, watermarkedUrl, thumbnailUrl
   - prediction (class, classVi, confidence)
   - status: 'completed'
7. Return response to client

**Xử lý (AI Service - Python)**:
1. Receive image file
2. Preprocess:
   - Convert to RGB
   - Resize to 224x224
   - Normalize (0-1)
3. Run TensorFlow Lite model
4. Process results:
   - Get top class
   - Calculate confidence
   - Get all class probabilities
5. Return JSON response

**Điều kiện tiên quyết**:
- User đã đăng nhập
- File ảnh hợp lệ (JPEG, PNG, max 10MB)
- GPS coordinates hợp lệ

**Điều kiện sau**:
- Ảnh đã được lưu trên Cloudinary
- AI prediction đã hoàn thành
- Photo document đã được lưu trong MongoDB

**Ngoại lệ**:
- File không hợp lệ → Lỗi 400 (Bad Request)
- Upload Cloudinary fail → Lỗi 500 (Internal Server Error)
- AI service timeout → Lỗi 504 (Gateway Timeout)
- AI service fail → Photo saved với prediction: null

---

### 3.2.3 FR-010: Xem kết quả AI

**ID**: FR-010  
**Tên**: Xem kết quả AI  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Hiển thị kết quả phát hiện bệnh sau khi upload ảnh.

**Đầu vào**:
- Photo ID (từ upload response)

**Đầu ra**:
- Watermarked image
- Disease class (English)
- Disease class (Vietnamese)
- Confidence score (%)
- All class probabilities
- Action buttons (Chụp lại, Xem bản đồ, Chi tiết)

**Xử lý (Client)**:
1. Navigate to result screen với photoId
2. Fetch photo details từ API
3. Display watermarked image
4. Display prediction results:
   - Class name với icon/color
   - Confidence với progress bar
   - All predictions với chart
5. Show action buttons

**Điều kiện tiên quyết**:
- Photo đã được upload thành công
- AI prediction đã hoàn thành

**Điều kiện sau**:
- User đã xem kết quả

**Ngoại lệ**:
- Photo not found → Lỗi 404 (Not Found)
- Prediction chưa có → Hiển thị loading

---

## 3.3 NHÓM CHỨC NĂNG: QUẢN LÝ ẢNH VÀ LỊCH SỬ

### 3.3.1 FR-011: Xem lịch sử ảnh

**ID**: FR-011  
**Tên**: Xem lịch sử ảnh  
**Mức độ ưu tiên**: Trung bình  
**Mô tả**: Hiển thị danh sách tất cả ảnh đã chụp của user.

**Đầu vào**:
- Page (default: 1)
- Limit (default: 20)
- Filter options (optional):
  - Date range
  - Disease class
  - Source (upload/iot)

**Đầu ra**:
- Danh sách photos (array)
- Pagination info:
  - Total
  - Page
  - Limit
  - Pages

**Xử lý (Backend)**:
1. Auth middleware: Verify JWT token
2. Get userId từ token
3. Build query với filters
4. Query MongoDB với pagination
5. Populate fields (nếu cần)
6. Return photos array và pagination

**Xử lý (Client)**:
1. Fetch photos từ API
2. Display photos trong FlatList/Grid
3. Show loading skeleton
4. Implement pagination (infinite scroll)
5. Filter/Sort options

**Điều kiện tiên quyết**:
- User đã đăng nhập

**Điều kiện sau**:
- User đã xem danh sách ảnh

**Ngoại lệ**:
- No photos → Hiển thị empty state

---

### 3.3.2 FR-012: Xem chi tiết ảnh

**ID**: FR-012  
**Tên**: Xem chi tiết ảnh  
**Mức độ ưu tiên**: Trung bình  
**Mô tả**: Hiển thị thông tin chi tiết của một ảnh.

**Đầu vào**:
- Photo ID

**Đầu ra**:
- Photo object:
  - Original image
  - Watermarked image
  - Metadata (GPS, timestamp, device)
  - Prediction (class, confidence, allPredictions)
  - Treatment recommendations (nếu có)

**Xử lý (Backend)**:
1. Auth middleware: Verify JWT token
2. Get photoId từ params
3. Query MongoDB: Photo.findById(photoId)
4. Verify userId matches (hoặc admin)
5. Return photo object

**Xử lý (Client)**:
1. Navigate to photo-detail screen
2. Fetch photo details từ API
3. Display:
   - Full-size image
   - GPS coordinates với map preview
   - Prediction details
   - Treatment recommendations
   - Action buttons (Xóa, Chia sẻ)

**Điều kiện tiên quyết**:
- User đã đăng nhập
- Photo ID hợp lệ

**Điều kiện sau**:
- User đã xem chi tiết ảnh

**Ngoại lệ**:
- Photo not found → Lỗi 404 (Not Found)
- Unauthorized → Lỗi 403 (Forbidden)

---

### 3.3.3 FR-013: Xóa ảnh

**ID**: FR-013  
**Tên**: Xóa ảnh  
**Mức độ ưu tiên**: Thấp  
**Mô tả**: Cho phép người dùng xóa ảnh khỏi hệ thống.

**Đầu vào**:
- Photo ID

**Đầu ra**:
- Message xác nhận xóa thành công

**Xử lý (Backend)**:
1. Auth middleware: Verify JWT token
2. Get photoId từ params
3. Query Photo.findById(photoId)
4. Verify userId matches
5. Delete image từ Cloudinary (nếu có publicId)
6. Delete photo document từ MongoDB
7. Return success message

**Xử lý (Client)**:
1. User click "Xóa"
2. Show confirmation dialog
3. Call DELETE API
4. Show success message
5. Navigate back hoặc refresh list

**Điều kiện tiên quyết**:
- User đã đăng nhập
- Photo thuộc về user

**Điều kiện sau**:
- Photo đã được xóa khỏi database
- Image đã được xóa khỏi Cloudinary

**Ngoại lệ**:
- Photo not found → Lỗi 404 (Not Found)
- Unauthorized → Lỗi 403 (Forbidden)
- Cloudinary delete fail → Log error, vẫn delete DB record

---

### 3.3.4 FR-014: Xem thống kê ảnh

**ID**: FR-014  
**Tên**: Xem thống kê ảnh  
**Mức độ ưu tiên**: Thấp  
**Mô tả**: Hiển thị thống kê về ảnh đã chụp (tổng số, tỷ lệ bệnh, xu hướng).

**Đầu vào**:
- Date range (optional)

**Đầu ra**:
- Total photos
- By disease class:
  - Bacterial Leaf Blight: count, percentage
  - Blast: count, percentage
  - Brown Spot: count, percentage
  - Healthy: count, percentage
- By time period (monthly/weekly)
- Chart data (cho visualization)

**Xử lý (Backend)**:
1. Auth middleware: Verify JWT token
2. Get userId từ token
3. Aggregate MongoDB:
   - Total count
   - Count by disease class
   - Count by time period
4. Calculate percentages
5. Format chart data
6. Return statistics object

**Xử lý (Client)**:
1. Fetch statistics từ API
2. Display:
   - Total photos card
   - Disease distribution chart
   - Timeline chart
3. Allow filter by date range

**Điều kiện tiên quyết**:
- User đã đăng nhập

**Điều kiện sau**:
- User đã xem thống kê

**Ngoại lệ**:
- No photos → Hiển thị empty state với 0 stats

---

## 3.4 NHÓM CHỨC NĂNG: BẢN ĐỒ TRỰC QUAN HÓA DỊCH BỆNH

### 3.4.1 FR-015: Hiển thị bản đồ với markers

**ID**: FR-015  
**Tên**: Hiển thị bản đồ với markers  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Hiển thị bản đồ với tất cả điểm chụp ảnh, markers màu theo trạng thái bệnh.

**Đầu vào**:
- User location (optional, để center map)
- Photos array (fetch từ API)

**Đầu ra**:
- Leaflet map với markers
- Marker colors:
  - 🟢 Green = Healthy
  - 🔴 Red = Diseased
- Cluster groups (markers gần nhau)
- Disease visualization:
  - Yellow circles (30m radius) quanh marker bệnh
  - Red lines nối markers bệnh gần nhau
  - Red polygons nếu ≥3 markers bệnh trong vùng

**Xử lý (Client)**:
1. Fetch all photos từ `/api/photos/map` (limit 1000)
2. Initialize Leaflet map trong WebView
3. Create markers cho mỗi photo:
   - Icon màu theo prediction.class
   - Popup với preview và info
4. Implement clustering (markers trong 50m)
5. Draw disease visualization:
   - Calculate distances (Haversine formula)
   - Draw circles, lines, polygons
6. Center map to user location (nếu có)

**Xử lý (Backend - /api/photos/map)**:
1. Auth middleware: Verify JWT token
2. Get all photos (hoặc của user nếu cần)
3. Return simplified photos array:
   - _id
   - metadata.lat, metadata.lng
   - prediction.class, prediction.classVi
   - thumbnailUrl

**Điều kiện tiên quyết**:
- User đã đăng nhập
- Có ít nhất 1 photo

**Điều kiện sau**:
- Bản đồ đã được hiển thị với markers

**Ngoại lệ**:
- No photos → Hiển thị empty map
- GPS permission denied → Dùng default location

---

### 3.4.2 FR-016: Click marker và xem chi tiết

**ID**: FR-016  
**Tên**: Click marker và xem chi tiết  
**Mức độ ưu tiên**: Trung bình  
**Mô tả**: Khi click marker, hiển thị chi tiết ảnh hoặc danh sách nếu có nhiều markers gần nhau.

**Đầu vào**:
- Clicked marker (photo _id)
- Nearby markers (trong bán kính 50m)

**Đầu ra**:
- Nếu 1 marker: Navigate to photo-detail
- Nếu nhiều markers: Show ClusterModal với danh sách

**Xử lý (Client)**:
1. User click marker
2. Calculate nearby markers (distance ≤ 50m)
3. If nearbyMarkers.length === 1:
   - Navigate to `/photo-detail?photoId={_id}`
4. Else:
   - Show ClusterModal
   - Display list of nearby photos
   - User click photo → Navigate to detail

**Điều kiện tiên quyết**:
- Marker đã được hiển thị trên map

**Điều kiện sau**:
- User đã xem chi tiết hoặc cluster modal

**Ngoại lệ**:
- Photo not found → Lỗi 404

---

## 3.5 NHÓM CHỨC NĂNG: QUẢN LÝ RUỘNG VÀ IoT

### 3.5.1 FR-017: Tạo ruộng mới

**ID**: FR-017  
**Tên**: Tạo ruộng mới  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Cho phép người dùng tạo ruộng mới với tên, vị trí và bán kính.

**Đầu vào**:
- Tên ruộng (required)
- Vị trí (lat, lng) - từ map picker hoặc GPS
- Bán kính (mét)
- Mô tả (optional)
- Crop type (optional)

**Đầu ra**:
- Field object đã được tạo
- IoT connection code (FIELD-XXXXXXXX) - tự động tạo

**Xử lý (Backend)**:
1. Auth middleware: Verify JWT token
2. Validate dữ liệu đầu vào
3. Calculate diện tích từ bán kính: area = π × radius²
4. Create Field document trong MongoDB
5. **Auto-generate IoT code**:
   - Generate random code: `FIELD-${randomHex(8).toUpperCase()}`
   - Create IoTConnectionCode document
   - Link to fieldId
   - Expires in 1 year
6. Return field object với IoT code

**Xử lý (Client)**:
1. User mở Field Management screen
2. Click "Tạo ruộng mới"
3. Fill form (tên, chọn vị trí trên map, bán kính)
4. Submit form
5. Show success với IoT code
6. Navigate back hoặc show field detail

**Điều kiện tiên quyết**:
- User đã đăng nhập
- Location permission granted (nếu chọn từ GPS)

**Điều kiện sau**:
- Field đã được tạo trong MongoDB
- IoT code đã được tạo và sẵn sàng sử dụng

**Ngoại lệ**:
- Dữ liệu không hợp lệ → Lỗi 400 (Bad Request)
- Location không hợp lệ → Lỗi 400 (Bad Request)

---

### 3.5.2 FR-018: Kết nối thiết bị IoT

**ID**: FR-018  
**Tên**: Kết nối thiết bị IoT  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Kết nối thiết bị IoT với ruộng thông qua mã kết nối.

**Đầu vào**:
- IoT connection code (FIELD-XXXXXXXX)
- Device ID (e.g., JETSON001)
- Field ID

**Đầu ra**:
- IoTConnection object đã được tạo
- Firebase Realtime Database path

**Xử lý (Backend)**:
1. Auth middleware: Verify JWT token
2. Get userId và fieldId từ request
3. Verify code exists và chưa được sử dụng:
   - Query IoTConnectionCode by code
   - Check expiresAt > now
   - Check isUsed = false
   - Check fieldId matches
4. Hash connection code
5. Create Firebase Realtime DB path: `fields/${fieldId}/devices/${deviceId}`
6. Create IoTConnection document:
   - userId, fieldId, deviceId
   - hashed connectionCode
   - firebaseDbUrl
   - status: 'active'
7. Mark IoTConnectionCode as used: isUsed = true
8. Return connection object với Firebase path

**Xử lý (Client)**:
1. User mở Field Management
2. Click "Kết nối IoT" trên field
3. Modal tự động fill IoT code (fetch từ API)
4. User nhập Device ID
5. Submit
6. Show success với Firebase path
7. IoT device có thể connect với Firebase path này

**Xử lý (IoT Device)**:
1. Device nhận connection code và field info
2. Connect to Firebase Realtime DB tại path đã được tạo
3. Start capturing images và sensor data
4. Upload images và data lên Firebase

**Điều kiện tiên quyết**:
- Field đã được tạo
- IoT code hợp lệ và chưa sử dụng
- Device ID hợp lệ

**Điều kiện sau**:
- IoTConnection đã được tạo
- Device có thể upload dữ liệu lên Firebase

**Ngoại lệ**:
- Code không tồn tại → Lỗi 404 (Not Found)
- Code đã sử dụng → Lỗi 409 (Conflict)
- Code hết hạn → Lỗi 410 (Gone)
- Firebase error → Lỗi 503 (Service Unavailable)

---

### 3.5.3 FR-019: Xem ảnh từ IoT device

**ID**: FR-019  
**Tên**: Xem ảnh từ IoT device  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Hiển thị ảnh được chụp tự động bởi IoT device từ Firebase.

**Đầu vào**:
- Field ID
- Device ID (optional)

**Đầu ra**:
- Danh sách ảnh từ IoT device
- Metadata (timestamp, sensors data)

**Xử lý (Client)**:
1. User mở IoT Gallery screen
2. Select field (và device nếu có nhiều)
3. Connect to Firebase Realtime DB:
   - Path: `fields/${fieldId}/devices/${deviceId}/captures`
4. Listen for real-time updates
5. Display images trong Grid/List:
   - Image preview
   - Timestamp
   - Sensor data (temp, humidity, pH, v.v.)
6. Click image → Navigate to analyze screen

**Xử lý (IoT Device)**:
1. Device capture image (camera)
2. Read sensor data (temp, humidity, pH, soil, lux, wind)
3. Get GPS coordinates
4. Upload image lên Firebase Storage
5. Save metadata vào Firebase Realtime DB:
   ```json
   {
     "captureId": "unique-id",
     "timestamp": 1234567890,
     "imageUrl": "firebase-storage-url",
     "gps": { "lat": 10.123, "lng": 106.456 },
     "sensors": {
       "temp": 28.5,
       "humidity": 75.2,
       "ph": 6.5,
       "soil": 60.1,
       "lux": 8000,
       "wind": 5.2
     }
   }
   ```

**Điều kiện tiên quyết**:
- Field đã có IoT device connected
- Device đã upload ít nhất 1 ảnh

**Điều kiện sau**:
- User đã xem danh sách ảnh IoT

**Ngoại lệ**:
- No IoT connection → Hiển thị empty state
- Firebase connection error → Hiển thị error message

---

### 3.5.4 FR-020: Phân tích ảnh IoT với AI

**ID**: FR-020  
**Tên**: Phân tích ảnh IoT với AI  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Phân tích ảnh từ IoT device bằng AI và lưu kết quả vào MongoDB.

**Đầu vào**:
- Image URL (từ Firebase Storage)
- Image Base64 (optional, để tránh CORS)
- Capture ID
- GPS coordinates
- Sensor data

**Đầu ra**:
- AI Prediction:
  - Class
  - ClassVi
  - Confidence
  - AllPredictions
- Treatment recommendations (dựa trên sensor data)
- Photo document đã được lưu trong MongoDB

**Xử lý (Backend - /api/iot/analyze)**:
1. Auth middleware: Verify JWT token
2. Get imageUrl hoặc imageBase64
3. Download image từ Firebase (nếu là URL)
4. Call AI Service (giống FR-009)
5. Generate treatment recommendations:
   - Dựa trên disease class
   - Kết hợp với sensor data
6. Save Photo document vào MongoDB:
   - source: 'iot'
   - fieldId
   - iotMetadata (deviceId, sensors, captureId)
   - prediction
   - treatmentData
7. Return analysis result

**Xử lý (Client)**:
1. User click ảnh IoT
2. Show analyze button
3. Click "Phân tích AI"
4. Call API `/api/iot/analyze`
5. Display results:
   - Disease detection
   - Treatment recommendations
   - Sensor data insights

**Điều kiện tiên quyết**:
- Ảnh đã có sẵn từ IoT device
- AI service available

**Điều kiện sau**:
- AI analysis đã hoàn thành
- Photo đã được lưu trong MongoDB

**Ngoại lệ**:
- Image not found → Lỗi 404 (Not Found)
- AI service timeout → Lỗi 504 (Gateway Timeout)

---

## 3.6 NHÓM CHỨC NĂNG: CHAT VỚI CHUYÊN GIA

### 3.6.1 FR-021: Xem danh sách chuyên gia

**ID**: FR-021  
**Tên**: Xem danh sách chuyên gia  
**Mức độ ưu tiên**: Trung bình  
**Mô tả**: Hiển thị danh sách chuyên gia nông nghiệp với rating và thông tin.

**Đầu vào**:
- Page (default: 1)
- Limit (default: 20)
- Filter (specialization, rating) - optional

**Đầu ra**:
- Danh sách experts (array)
- Thông tin:
  - Name, avatar, bio
  - Specialization
  - Experience (years)
  - Rating (0-5)
  - Review count
  - Is online

**Xử lý (Backend)**:
1. Auth middleware: Verify JWT token
2. Build query với filters
3. Query Expert collection trong MongoDB
4. Populate userId để lấy user info
5. Return experts array

**Xử lý (Client)**:
1. Fetch experts từ API
2. Display trong FlatList:
   - Avatar, name
   - Specialization tags
   - Rating stars
   - "Chat" button
3. Click expert → Navigate to expert-detail

**Điều kiện tiên quyết**:
- User đã đăng nhập

**Điều kiện sau**:
- User đã xem danh sách chuyên gia

**Ngoại lệ**:
- No experts → Hiển thị empty state

---

### 3.6.2 FR-022: Chat real-time với chuyên gia

**ID**: FR-022  
**Tên**: Chat real-time với chuyên gia  
**Mức độ ưu tiên**: Cao  
**Mô tả**: Chat trực tiếp với chuyên gia thông qua Socket.io.

**Đầu vào**:
- Message text
- Attachments (images) - optional
- Expert ID

**Đầu ra**:
- Message đã được gửi
- Real-time update cho cả 2 bên
- Unread count update

**Xử lý (Backend - Socket.io)**:
1. User connect to Socket.io server
2. Join room: `conversation:${conversationId}`
3. When message sent:
   - Save message vào MongoDB
   - Emit to room (cả farmer và expert)
   - Update conversation.lastMessageAt
   - Update unreadCount
4. When message read:
   - Update message.readAt
   - Update unreadCount

**Xử lý (Backend - REST API)**:
1. POST `/api/conversations` - Tạo conversation nếu chưa có
2. GET `/api/conversations/:id/messages` - Lấy lịch sử tin nhắn
3. POST `/api/conversations/:id/messages` - Gửi tin nhắn (nếu Socket.io fail)

**Xử lý (Client)**:
1. Connect to Socket.io server
2. Join conversation room
3. Send message:
   - Type text
   - (Optional) Attach image
   - Send button
4. Receive messages real-time
5. Display messages trong chat UI
6. Update unread count badge

**Điều kiện tiên quyết**:
- User đã đăng nhập
- Expert ID hợp lệ
- Socket.io server available

**Điều kiện sau**:
- Message đã được gửi và lưu
- Cả 2 bên nhận được message real-time

**Ngoại lệ**:
- Socket.io disconnect → Fallback to REST API
- Expert offline → Message vẫn được lưu, expert sẽ nhận sau

---

### 3.6.3 FR-023: Đánh giá chuyên gia

**ID**: FR-023  
**Tên**: Đánh giá chuyên gia  
**Mức độ ưu tiên**: Thấp  
**Mô tả**: Cho phép người dùng đánh giá chuyên gia sau khi chat.

**Đầu vào**:
- Expert ID
- Rating (1-5 stars)
- Review text (optional)

**Đầu ra**:
- Review đã được lưu
- Expert rating được cập nhật

**Xử lý (Backend)**:
1. Auth middleware: Verify JWT token
2. Validate rating (1-5)
3. Check if user đã review expert này chưa
4. Create/Update Review document
5. Recalculate expert rating:
   - Average of all reviews
   - Update reviewCount
6. Return success

**Xử lý (Client)**:
1. User mở expert-detail hoặc expert-reviews
2. Click "Đánh giá"
3. Fill form:
   - Star rating (1-5)
   - Review text
4. Submit
5. Show success message

**Điều kiện tiên quyết**:
- User đã chat với expert
- Expert ID hợp lệ

**Điều kiện sau**:
- Review đã được lưu
- Expert rating đã được cập nhật

**Ngoại lệ**:
- Already reviewed → Allow update review
- Invalid rating → Lỗi 400 (Bad Request)

---

## 3.7 NHÓM CHỨC NĂNG: CHAT AI VỚI GEMINI

### 3.7.1 FR-024: Chat với AI Gemini

**ID**: FR-024  
**Tên**: Chat với AI Gemini  
**Mức độ ưu tiên**: Trung bình  
**Mô tả**: Chat với AI (Google Gemini) để tư vấn nông nghiệp.

**Đầu vào**:
- Message text
- Image (optional) - để AI phân tích
- Chat history (context)

**Đầu ra**:
- AI response text
- Analysis result (nếu có ảnh)

**Xử lý (Client)**:
1. User mở AI Chat modal (FloatingChatButton)
2. Load chat history từ local storage hoặc API
3. User type message hoặc attach image
4. Send request đến Gemini API:
   - POST to Gemini API với message và image
5. Receive response
6. Display AI response
7. Save to chat history

**Xử lý (Backend - nếu cần)**:
1. Auth middleware: Verify JWT token
2. Forward request to Gemini API
3. Save chat history vào MongoDB (optional)
4. Return response

**Điều kiện tiên quyết**:
- User đã đăng nhập
- Gemini API key configured

**Điều kiện sau**:
- User đã nhận được AI response
- Chat history đã được lưu

**Ngoại lệ**:
- Gemini API error → Hiển thị error message
- Image too large → Lỗi 400 (Bad Request)

---

## 3.8 NHÓM CHỨC NĂNG: THỜI TIẾT VÀ CẢNH BÁO

### 3.8.1 FR-025: Xem thời tiết hiện tại và dự báo

**ID**: FR-025  
**Tên**: Xem thời tiết hiện tại và dự báo  
**Mức độ ưu tiên**: Trung bình  
**Mô tả**: Hiển thị thời tiết hiện tại và dự báo 7 ngày từ OpenWeatherMap API.

**Đầu vào**:
- Location (lat, lng) - từ GPS hoặc user input

**Đầu ra**:
- Current weather:
  - Temperature
  - Humidity
  - Description
  - Icon
- Forecast (7 days):
  - Date
  - Temp min/max
  - Rain probability
  - Description

**Xử lý (Client)**:
1. Get user location (GPS)
2. Call OpenWeatherMap API (hoặc qua backend)
3. Display:
   - Current weather widget
   - Forecast list
   - Weather warnings (nếu có)

**Xử lý (Backend - nếu cache)**:
1. Get location từ request
2. Check cache (Redis/Memory cache)
3. If cache miss:
   - Call OpenWeatherMap API
   - Cache result (1 hour)
4. Return weather data

**Điều kiện tiên quyết**:
- Location available
- OpenWeatherMap API key configured

**Điều kiện sau**:
- User đã xem thời tiết

**Ngoại lệ**:
- Location not available → Dùng default location (Hanoi)
- API error → Hiển thị cached data hoặc error message

---

### 3.8.2 FR-026: Theo dõi bão

**ID**: FR-026  
**Tên**: Theo dõi bão  
**Mức độ ưu tiên**: Thấp  
**Mô tả**: Hiển thị thông tin và đường đi của bão (nếu có).

**Đầu vào**:
- Region/Country (default: Vietnam)

**Đầu ra**:
- Storm information:
  - Name
  - Category
  - Current position
  - Path forecast
  - Speed
  - Warnings

**Xử lý (Client/Backend)**:
1. Fetch storm data từ weather API
2. Display trên map:
   - Current position
   - Predicted path
   - Affected areas
3. Show warnings và recommendations

**Điều kiện tiên quyết**:
- Weather API có hỗ trợ storm tracking

**Điều kiện sau**:
- User đã xem thông tin bão

**Ngoại lệ**:
- No active storm → Hiển thị "Không có bão"

---

## 4. BẢNG TỔNG KẾT YÊU CẦU CHỨC NĂNG

| ID | Tên chức năng | Nhóm | Mức độ ưu tiên | Status |
|----|---------------|------|----------------|--------|
| FR-001 | Đăng ký tài khoản | Auth | Cao | ✅ |
| FR-002 | Đăng nhập Email/Password | Auth | Cao | ✅ |
| FR-003 | Đăng nhập OTP | Auth | Cao | ✅ |
| FR-004 | Đăng nhập Google | Auth | Trung bình | ✅ |
| FR-005 | Quên mật khẩu | Auth | Trung bình | ✅ |
| FR-006 | Đổi mật khẩu | Auth | Cao | ✅ |
| FR-007 | Chỉnh sửa profile | Auth | Trung bình | ✅ |
| FR-008 | Chụp ảnh lúa | AI Detection | Cao | ✅ |
| FR-009 | Upload ảnh và phân tích AI | AI Detection | Cao | ✅ |
| FR-010 | Xem kết quả AI | AI Detection | Cao | ✅ |
| FR-011 | Xem lịch sử ảnh | Photo Management | Trung bình | ✅ |
| FR-012 | Xem chi tiết ảnh | Photo Management | Trung bình | ✅ |
| FR-013 | Xóa ảnh | Photo Management | Thấp | ✅ |
| FR-014 | Xem thống kê ảnh | Photo Management | Thấp | ✅ |
| FR-015 | Hiển thị bản đồ với markers | Map | Cao | ✅ |
| FR-016 | Click marker và xem chi tiết | Map | Trung bình | ✅ |
| FR-017 | Tạo ruộng mới | Field & IoT | Cao | ✅ |
| FR-018 | Kết nối thiết bị IoT | Field & IoT | Cao | ✅ |
| FR-019 | Xem ảnh từ IoT device | Field & IoT | Cao | ✅ |
| FR-020 | Phân tích ảnh IoT với AI | Field & IoT | Cao | ✅ |
| FR-021 | Xem danh sách chuyên gia | Expert Chat | Trung bình | ✅ |
| FR-022 | Chat real-time với chuyên gia | Expert Chat | Cao | ✅ |
| FR-023 | Đánh giá chuyên gia | Expert Chat | Thấp | ✅ |
| FR-024 | Chat với AI Gemini | AI Chat | Trung bình | ✅ |
| FR-025 | Xem thời tiết hiện tại và dự báo | Weather | Trung bình | ✅ |
| FR-026 | Theo dõi bão | Weather | Thấp | ✅ |

**Tổng số yêu cầu chức năng: 26**

---

## 5. PHÂN LOẠI THEO MỨC ĐỘ ƯU TIÊN

### 🔴 **Cao (11 chức năng)**
- Authentication (Đăng ký, Đăng nhập, Đổi mật khẩu)
- AI Detection (Chụp ảnh, Upload, Xem kết quả)
- Map (Hiển thị bản đồ)
- Field & IoT (Tạo ruộng, Kết nối IoT, Xem ảnh, Phân tích)
- Expert Chat (Chat real-time)

### 🟡 **Trung bình (10 chức năng)**
- Profile Management
- Photo Management (Lịch sử, Chi tiết)
- Map (Click marker)
- Expert Chat (Danh sách)
- AI Chat
- Weather

### 🟢 **Thấp (5 chức năng)**
- Photo Management (Xóa, Thống kê)
- Expert Chat (Đánh giá)
- Weather (Theo dõi bão)

---

**Tài liệu này phục vụ cho khóa luận và tài liệu kỹ thuật hệ thống**

