# 🔑 AUTO IOT CODE GENERATION & AUTO-FILL

## **Tổng quan**

Khi user tạo ruộng thành công:
1. ✅ Backend tự động generate mã kết nối IoT (format: `FIELD-XXXXXXXX`)
2. ✅ Mã được lưu vào `IoTConnectionCode` collection với `fieldId`
3. ✅ Khi user chọn "Kết nối" → Modal tự động fetch và fill mã vào input

---

## **CÂU HỎI 1: DIỆN TÍCH LẤY TỪ ĐÂU?**

### **💡 Trả lời:**

**Diện tích được TÍNH TỰ ĐỘNG từ bán kính** theo công thức:

```
Area = π × radius²
```

### **📍 Nơi tính toán:**

**1. Frontend: `src/hooks/useFieldManagement.tsx` (Line 70)**
```tsx
const fieldData = {
  ...data,
  metadata: {
    ...data.metadata,
    area: data.metadata?.area || fieldService.calculateFieldArea(data.radius),
  },
};
```

**2. Frontend: `src/services/field.service.ts` (Line 51-53)**
```tsx
export const calculateFieldArea = (radius: number): number => {
  return Math.PI * Math.pow(radius, 2);
};
```

**3. Display: `src/components/IoT/FieldCard.tsx` (Line 31-33)**
```tsx
const areaDisplay = field.metadata?.area
  ? formatFieldArea(field.metadata.area)
  : formatFieldArea(Math.PI * Math.pow(field.radius, 2));
```

### **Ví dụ:**
- Bán kính: **500 m**
- Diện tích: **π × 500² = 785,398 m² ≈ 7.85 ha**
- Hiển thị: **"0.08 ha"** (nếu ≥ 10,000 m²) hoặc **"785398 m²"**

---

## **CÂU HỎI 2: AUTO-GENERATE MÃ KẾT NỐI IOT**

### **Backend Implementation**

#### **1. Auto-generate code khi tạo field**

**File: `backend/src/controllers/field.controller.ts`**

```ts
import crypto from 'crypto';
import { IoTConnectionCode } from '../models/IoTConnectionCode';

// Line 50-60: After creating field
const generatedCode = `FIELD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const iotCode = await IoTConnectionCode.create({
  code: generatedCode,
  deviceId: 'ANY', // Allow any device to use this code
  fieldId: field._id,
  userId,
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  isUsed: false,
});

logger.info(`✅ Field created: ${field.name} with code: ${generatedCode}`);

// Return field with IoT code
return successResponse(res, {
  ...field,
  iotConnectionCode: generatedCode, // Include in response
}, 201);
```

#### **2. Endpoint để get IoT code**

**File: `backend/src/controllers/field.controller.ts` (Line 283-318)**

```ts
/**
 * Get IoT connection code for a field
 * GET /api/fields/:id/iot-code
 */
export const getFieldIoTCode = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    // Verify field belongs to user
    const field = await Field.findOne({ _id: id, userId });
    
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Get the IoT connection code for this field (not used yet)
    const iotCode = await IoTConnectionCode.findOne({
      fieldId: field._id,
      isUsed: false,
    }).sort({ createdAt: -1 }); // Get latest unused code
    
    if (!iotCode) {
      return errorResponse(res, 'NOT_FOUND', 'No IoT code found for this field', 404);
    }
    
    return successResponse(res, {
      code: iotCode.code,
      createdAt: iotCode.createdAt,
      expiresAt: iotCode.expiresAt,
    });
  } catch (error: any) {
    logger.error('❌ Get field IoT code error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};
```

#### **3. Route**

**File: `backend/src/routes/field.routes.ts` (Line 123)**

```ts
router.get('/:id/iot-code', authMiddleware, fieldController.getFieldIoTCode);
```

---

### **Frontend Implementation**

#### **1. Service method**

**File: `src/services/field.service.ts` (Line 47-52)**

```ts
/**
 * Get IoT connection code for a field
 */
export const getFieldIoTCode = async (fieldId: string): Promise<ApiResponse<{ code: string; createdAt: string; expiresAt: string }>> => {
  return apiGet<{ code: string; createdAt: string; expiresAt: string }>(`/fields/${fieldId}/iot-code`);
};
```

#### **2. Auto-fetch trong IoTConnectionModal**

**File: `src/screens/IoT/IoTConnectionModal.tsx` (Line 45-68)**

```tsx
import fieldService from '@/services/field.service';
import { useEffect } from 'react';

const [connectionCode, setConnectionCode] = useState('');
const [loadingCode, setLoadingCode] = useState(false);

/**
 * Auto-fetch IoT code when field is preselected
 */
useEffect(() => {
  const fetchIoTCode = async () => {
    if (preselectedField) {
      try {
        setLoadingCode(true);
        const response = await fieldService.getFieldIoTCode(preselectedField._id);
        
        if (response.success && response.data) {
          setConnectionCode(response.data.code); // Auto-fill!
        }
      } catch (error) {
        console.error('Failed to fetch IoT code:', error);
        // Don't show error - user can still enter manually
      } finally {
        setLoadingCode(false);
      }
    }
  };

  fetchIoTCode();
}, [preselectedField]);
```

#### **3. UI với loading state**

**File: `src/screens/IoT/IoTConnectionModal.tsx` (Line 196-219)**

```tsx
{/* Connection Code Input */}
<View style={styles.section}>
  <Text style={styles.label}>
    Mã kết nối <Text style={styles.required}>*</Text>
  </Text>
  <View style={styles.inputContainer}>
    <TextInput
      style={[styles.input, loadingCode && styles.inputDisabled]}
      placeholder="Mã kết nối sẽ tự động điền..."
      value={connectionCode}
      onChangeText={setConnectionCode}
      autoCapitalize="characters"
      maxLength={20}
      placeholderTextColor={colors.textSecondary}
      editable={!loadingCode} // Disabled while loading
    />
    {loadingCode && (
      <View style={styles.inputLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )}
  </View>
  {preselectedField && !loadingCode && connectionCode && (
    <Text style={styles.successHint}>✓ Mã kết nối đã được tự động điền</Text>
  )}
</View>
```

#### **4. TypeScript type**

**File: `src/types/index.ts` (Line 200)**

```ts
export interface Field {
  _id: string;
  userId: string;
  name: string;
  gpsCenter: { lat: number; lng: number };
  radius: number;
  metadata?: { area?: number; cropType?: string; notes?: string };
  isDeleted?: boolean;
  iotConnectionCode?: string; // Auto-generated code
  createdAt: string;
  updatedAt: string;
}
```

---

## **📊 FLOW DIAGRAM**

```
┌──────────────────────────────────────────────────────┐
│ 1. User tạo ruộng mới                               │
│    - Nhập tên: "Ruộng Tân Định"                     │
│    - Nhập bán kính: 500m                            │
│    - GPS: Auto-detect hoặc manual                   │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 2. Backend: Create Field                            │
│    - Tính diện tích: π × 500² = 785,398 m²         │
│    - Tạo field trong MongoDB                        │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 3. Backend: Auto-generate IoT Code                  │
│    - Generate: FIELD-A3F7B2C1                       │
│    - Lưu vào IoTConnectionCode collection           │
│      {                                               │
│        code: "FIELD-A3F7B2C1",                      │
│        fieldId: field._id,                          │
│        deviceId: "ANY",                             │
│        isUsed: false,                               │
│        expiresAt: +1 year                           │
│      }                                               │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 4. Response trả về frontend                         │
│    {                                                 │
│      _id: "...",                                    │
│      name: "Ruộng Tân Định",                        │
│      radius: 500,                                   │
│      metadata: { area: 785398 },                   │
│      iotConnectionCode: "FIELD-A3F7B2C1"           │
│    }                                                 │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 5. User nhấn "Kết nối" trên FieldCard               │
│    → Mở IoTConnectionModal                          │
│    → preselectedField = field                       │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 6. IoTConnectionModal - useEffect                   │
│    - Detect preselectedField                        │
│    - Call API: GET /api/fields/{id}/iot-code        │
│    - setLoadingCode(true) → Show spinner            │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 7. Backend trả code                                 │
│    { code: "FIELD-A3F7B2C1", ... }                  │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 8. Frontend auto-fill                               │
│    - setConnectionCode("FIELD-A3F7B2C1")           │
│    - setLoadingCode(false)                          │
│    - Show "✓ Mã kết nối đã được tự động điền"      │
└──────────────────────────────────────────────────────┘
```

---

## **🗄️ NƠI LƯU MÃ KẾT NỐI**

### **MongoDB Collection: `iotconnectioncodes`**

```js
{
  _id: ObjectId("..."),
  code: "FIELD-A3F7B2C1",           // Auto-generated unique code
  deviceId: "ANY",                   // Allow any device initially
  fieldId: ObjectId("field_id"),     // Link to field
  userId: ObjectId("user_id"),       // Owner
  isUsed: false,                     // Becomes true after connection
  usedAt: null,                      // Timestamp when used
  expiresAt: ISODate("2026-11-07"),  // 1 year expiry
  createdAt: ISODate("2025-11-07"),
  updatedAt: ISODate("2025-11-07")
}
```

### **Indexes:**
```js
db.iotconnectioncodes.createIndex({ code: 1 }, { unique: true });
db.iotconnectioncodes.createIndex({ fieldId: 1 });
db.iotconnectioncodes.createIndex({ userId: 1 });
db.iotconnectioncodes.createIndex({ isUsed: 1, expiresAt: 1 });
```

---

## **🧪 TEST FLOW**

### **RESTART BACKEND TRƯỚC!**

```bash
cd backend
npm run dev
```

### **Test 1: Tạo ruộng & auto-generate code**

1. **App:** Tài khoản → Quản lý ruộng IoT → "+"
2. **Nhập:**
   - Tên: "Ruộng Test"
   - Bán kính: 300
   - GPS: 10.8525093, 106.6664848
3. **Submit**
4. **Expected:**
   - Alert "Thành công"
   - Field hiển thị với tên "Ruộng Test"
   - **Diện tích: "28274 m²"** (π × 300²)
   - **Backend logs:** `✅ Field created: Ruộng Test with code: FIELD-XXXXXXXX`

### **Test 2: Auto-fill mã kết nối**

1. **Nhấn "Kết nối"** trên field card
2. **IoTConnectionModal mở**
3. **Expected:**
   - Ruộng đã preselected: "Ruộng Test"
   - Input "Mã kết nối" show **spinner** (loading)
   - Sau 0.5-1s: **Mã tự động điền: "FIELD-XXXXXXXX"**
   - Show hint: **"✓ Mã kết nối đã được tự động điền"**

### **Test 3: Connect device**

1. **Nhập Device ID:** "jetson-001-00:00:00:00:00:01"
2. **Mã kết nối:** (đã auto-fill)
3. **Nhấn "Kết nối"**
4. **Expected:**
   - Success alert
   - Connection status update
   - `iotconnectioncodes.isUsed` → true
   - `iotconnectioncodes.usedAt` → current timestamp

### **Test 4: Check MongoDB**

```bash
mongosh "YOUR_MONGO_URI"
use your_database_name

# Check fields
db.fields.find({name: "Ruộng Test"}).pretty()
# Should have: iotConnectionCode field

# Check codes
db.iotconnectioncodes.find({code: /^FIELD-/}).pretty()
# Should see generated codes
```

---

## **📝 FILES CHANGED**

### **Backend: 3 files**

1. ✅ `backend/src/controllers/field.controller.ts`
   - Import `crypto` & `IoTConnectionCode`
   - Auto-generate code in `createField`
   - New function: `getFieldIoTCode`

2. ✅ `backend/src/routes/field.routes.ts`
   - New route: `GET /:id/iot-code`

3. ✅ `backend/src/models/IoTConnectionCode.ts` (already exists)

### **Frontend: 3 files**

1. ✅ `src/services/field.service.ts`
   - New method: `getFieldIoTCode`

2. ✅ `src/screens/IoT/IoTConnectionModal.tsx`
   - Import `useEffect` & `fieldService`
   - Add state: `loadingCode`
   - useEffect to auto-fetch code
   - Update UI with loading state & success hint

3. ✅ `src/types/index.ts`
   - Add `iotConnectionCode?: string` to `Field` interface

---

## **🎉 SUMMARY**

### **Diện tích:**
- ✅ Tính tự động từ **bán kính** (Area = π × r²)
- ✅ Không cần input manual
- ✅ Format tự động: **m²** hoặc **ha** nếu ≥ 10,000 m²

### **Mã IoT:**
- ✅ **Auto-generate** khi tạo ruộng (format: `FIELD-XXXXXXXX`)
- ✅ Lưu vào **`iotconnectioncodes`** collection
- ✅ **Auto-fill** khi user chọn "Kết nối"
- ✅ **Loading state** & **success hint**
- ✅ User có thể edit nếu cần

### **Security:**
- ✅ Code unique (8 ký tự hex)
- ✅ Expires sau 1 năm
- ✅ Verify fieldId + userId
- ✅ Mark `isUsed` sau khi connect

---

**🚀 HÃY RESTART BACKEND VÀ TEST!**

---

**END OF IMPLEMENTATION**

