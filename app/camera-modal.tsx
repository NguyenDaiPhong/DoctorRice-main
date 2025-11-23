/**
 * Camera Modal - Full screen camera interface
 * Accessed via tab bar camera button
 */
import { colors } from '@/constants/colors';
import { useFieldManagement } from '@/hooks/useFieldManagement';
import FieldSelectionModal from '@/screens/IoT/FieldSelectionModal';
import IoTGalleryScreen from '@/screens/IoT/IoTGalleryScreen';
import { updateCaptureWithAnalysis, uploadPhotoToIoT } from '@/services/firebase-iot-upload.service';
import type { Field } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CameraModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showGalleryOptions, setShowGalleryOptions] = useState(false);
  const [showFieldSelection, setShowFieldSelection] = useState(false);
  const [showIoTGallery, setShowIoTGallery] = useState(false);
  const [selectedIoTField, setSelectedIoTField] = useState<Field | null>(null);

  // IoT field management
  const { hasAnyIoTField, getNearestIoTField } = useFieldManagement();

  // Get location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  // Request camera permission if needed
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleClose = () => {
    router.back();
  };

  // Upload image to Firebase IoT (for users with IoT fields)
  const uploadImageToIoT = async (imageUri: string) => {
    try {
      if (!location) {
        Alert.alert('Lỗi', 'Không lấy được vị trí GPS');
        return;
      }

      setUploadProgress(5);
      setLoadingMessage('Đang tìm ruộng gần nhất...');

      // Find nearest IoT field
      const nearestField = getNearestIoTField(
        location.coords.latitude,
        location.coords.longitude
      );

      if (!nearestField) {
        Alert.alert(
          'Không tìm thấy ruộng IoT',
          'Không tìm thấy ruộng IoT nào gần vị trí của bạn. Vui lòng thử lại hoặc tạo ruộng mới.'
        );
        setCapturedImageUri(null);
        setIsLoading(false);
        return;
      }

      console.log(`✅ Found nearest field: ${nearestField.name}`);
      console.log(`📍 Field GPS: ${nearestField.gpsCenter.lat}, ${nearestField.gpsCenter.lng}`);
      console.log(`📍 Current GPS: ${location.coords.latitude}, ${location.coords.longitude}`);
      console.log(`⚠️ Will use FIELD GPS for upload (ensures geofence match)`);

      setUploadProgress(15);
      setLoadingMessage(`Đang upload vào ruộng ${nearestField.name}...`);

      // Get user ID
      const { getAccessToken } = await import('../src/services/api');
      const token = await getAccessToken();
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        router.replace('/auth/login' as any);
        return;
      }

      // Decode token to get userId (simple JWT decode)
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.userId || payload.sub || 'unknown';

      setUploadProgress(25);
      setLoadingMessage('Đang upload ảnh lên Firebase...');

      // Upload to Firebase IoT
      // ⚠️ IMPORTANT: Use FIELD GPS (not current location GPS)
      // This ensures images are within geofence radius when fetching
      const result = await uploadPhotoToIoT({
        imageUri,
        field: nearestField,
        gps: {
          lat: nearestField.gpsCenter.lat,  // Use field GPS
          lng: nearestField.gpsCenter.lng,
        },
        userId,
      });

      if (!result.success || !result.imageUrl || !result.captureId) {
        throw new Error(result.error || 'Upload to Firebase failed');
      }

      console.log(`✅ Uploaded to Firebase: ${result.captureId}`);

      setUploadProgress(50);
      setLoadingMessage('Đang gọi AI phân tích...');

      // Call AI service for analysis
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://doctorrice.onrender.com/api';
      
      const aiResponse = await fetch(`${API_URL}/photos/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoUrl: result.imageUrl,
        }),
      });

      setUploadProgress(80);
      setLoadingMessage('Đang xử lý kết quả...');

      const aiData = await aiResponse.json();
      console.log('AI Analysis result:', aiData);

      if (!aiResponse.ok || !aiData.success) {
        throw new Error(aiData.error?.message || 'AI analysis failed');
      }

      // Update Firebase with analysis result
      const dateKey = new Date().toISOString().split('T')[0].replace(/-/g, '');
      await updateCaptureWithAnalysis(result.captureId, dateKey, {
        disease: aiData.data.disease || 'Unknown',
        confidence: aiData.data.confidence || 0,
        treatment: aiData.data.treatment,
        detectedClasses: aiData.data.detectedClasses,
      });

      console.log('✅ Analysis saved to Firebase');

      setUploadProgress(100);
      setLoadingMessage('Hoàn tất!');

      // Navigate to result - pass IoT metadata
      setTimeout(() => {
        router.push({
          pathname: '/result',
          params: {
            source: 'iot',
            captureId: result.captureId,
            imageUrl: result.imageUrl,
            disease: aiData.data.disease,
            confidence: aiData.data.confidence,
            fieldId: nearestField._id,
            fieldName: nearestField.name,
          },
        } as any);
      }, 300);

    } catch (error: any) {
      console.error('❌ IoT upload error:', error);
      
      let errorMessage = 'Không thể upload ảnh IoT. Vui lòng thử lại.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi upload IoT', errorMessage);
      setCapturedImageUri(null);
      setUploadProgress(0);
      setLoadingMessage('');
      setIsLoading(false);
    }
  };

  // Upload image to backend (MongoDB - for users without IoT)
  const uploadImage = async (imageUri: string) => {
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    
    try {
      if (!location) {
        Alert.alert('Lỗi', 'Không lấy được vị trí GPS');
        return;
      }

      setUploadProgress(5);
      setLoadingMessage('Đang tối ưu ảnh...');
      
      // Resize image to max width 1024px + WebP format for faster upload
      const resizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP }
      );

      setUploadProgress(15);
      setLoadingMessage('Đang upload...');

      // Get auth token
      const { getAccessToken } = await import('../src/services/api');
      const token = await getAccessToken();

      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        router.replace('/auth/login' as any);
        return;
      }

      // Create form data
      const formData = new FormData();
      const filename = (resizedImage.uri.split('/').pop() || 'photo.webp').replace(/\.(jpg|jpeg|png)$/i, '.webp');
      
      formData.append('photo', {
        uri: resizedImage.uri,
        type: 'image/webp',
        name: filename,
      } as any);
      
      formData.append('latitude', location.coords.latitude.toString());
      formData.append('longitude', location.coords.longitude.toString());
      formData.append('device', 'Android'); // or detect device

      // Upload to backend
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://doctorrice.onrender.com/api';
      console.log('📤 Uploading to:', `${API_URL}/photos/upload`);
      console.log('📍 GPS:', location.coords.latitude, location.coords.longitude);
      console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      // Wake up backend if sleeping (Render free tier cold start fix)
      setUploadProgress(25);
      setLoadingMessage('Đang kết nối server...');
      const wakeStartTime = Date.now();
      
      try {
        // Parallel wake-up calls to both backend and AI service
        const baseUrl = API_URL.replace('/api', '');
        await Promise.all([
          fetch(`${API_URL}/health`, { 
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }).catch(e => console.warn('Backend health check failed:', e)),
          
          fetch('https://doctorrice-ai-service.onrender.com/health', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }).catch(e => console.warn('AI service health check failed:', e)),
        ]);
        
        const wakeTime = Date.now() - wakeStartTime;
        console.log(`⏱️ Services warmed up in ${wakeTime}ms`);
      } catch (wakeError) {
        console.warn('⚠️ Wake-up failed (continuing anyway):', wakeError);
      }
      
      setUploadProgress(35);
      setLoadingMessage('Đang upload...');
      
      // Create abort controller for timeout (3 minutes for cold start + AI processing)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180s = 3 minutes
      
      try {
        const uploadStartTime = Date.now();
        
        // Simulate progress during upload (since fetch doesn't support progress events on upload)
        progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev < 60) return prev + 5;
            if (prev < 80) return prev + 2;
            return prev; // Stop at 80% until we get response
          });
        }, 500);
        
        setLoadingMessage('Đang upload & phân tích...');
        
        const response = await fetch(`${API_URL}/photos/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
          signal: controller.signal,
        });
        
        clearInterval(progressInterval);
        progressInterval = null;
        clearTimeout(timeoutId);
        
        setUploadProgress(90);
        setLoadingMessage('Đang xử lý kết quả...');
        
        const uploadDuration = Date.now() - uploadStartTime;
        console.log(`⏱️ Upload completed in ${(uploadDuration / 1000).toFixed(1)}s`);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
          const errorMsg = data.error?.message || data.message || 'Upload failed';
          console.error('❌ Upload failed:', response.status, errorMsg);
          throw new Error(`${response.status}: ${errorMsg}`);
        }

        console.log('✅ Upload success! Photo ID:', data.data?.photo?._id);

        setUploadProgress(100);
        
        // Navigate to result screen
        if (data.data?.photo?._id) {
          // Small delay to show 100% progress
          setTimeout(() => {
            router.push({
              pathname: '/result',
              params: { photoId: data.data.photo._id },
            } as any);
          }, 300);
        } else {
          throw new Error('No photo ID in response');
        }
      } catch (fetchError: any) {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      
      // More specific error messages
      let errorMessage = 'Không thể upload ảnh. Vui lòng thử lại.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Upload timeout. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi upload', errorMessage);
      // Reset preview on error
      setCapturedImageUri(null);
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Capture photo
  const handleCapture = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert('Lỗi', 'Camera chưa sẵn sàng');
        return;
      }

      if (!location) {
        Alert.alert('Lỗi', 'Đang lấy vị trí GPS, vui lòng đợi...');
        return;
      }

      // Capture photo first
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      console.log('📸 Photo captured:', photo.uri);
      
      // Show preview IMMEDIATELY
      setCapturedImageUri(photo.uri);
      setIsLoading(true);
      setUploadProgress(0);
      
      // Route based on whether user has IoT fields
      if (hasAnyIoTField) {
        console.log('🌾 User has IoT fields - uploading to Firebase IoT');
        await uploadImageToIoT(photo.uri);
      } else {
        console.log('📦 User has no IoT fields - uploading to MongoDB');
        await uploadImage(photo.uri);
      }

    } catch (error: any) {
      console.error('❌ Capture error:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
      setCapturedImageUri(null);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Show gallery options
  const handleGalleryButtonPress = () => {
    setShowGalleryOptions(true);
  };

  // Pick image from device gallery
  const handlePickFromDeviceGallery = async () => {
    setShowGalleryOptions(false);
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập',
          'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Updated from deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [6, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Show preview IMMEDIATELY
        setCapturedImageUri(result.assets[0].uri);
        setIsLoading(true);
        setUploadProgress(0);
        
        // Then start upload in background
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('❌ Pick image error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
      setCapturedImageUri(null);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Open IoT Gallery - Show field selection first
  const handleOpenIoTGallery = () => {
    setShowGalleryOptions(false);
    setShowFieldSelection(true);
  };

  // Handle field selected - Show gallery with selected field
  const handleFieldSelected = (field: Field) => {
    setSelectedIoTField(field);
    setShowFieldSelection(false);
    setShowIoTGallery(true);
  };

  // Close IoT Gallery and reset
  const handleCloseIoTGallery = () => {
    setShowIoTGallery(false);
    setSelectedIoTField(null);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          {t('camera.permissionRequired', { defaultValue: 'Cần quyền truy cập camera' })}
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>
            {t('camera.grantPermission', { defaultValue: 'Cấp quyền' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashMode ? 'on' : 'off'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.flashButton}
            onPress={() => setFlashMode(!flashMode)}
          >
            <Ionicons
              name={flashMode ? 'flash' : 'flash-off'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Camera frame with corners */}
        <View style={styles.frameContainer}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
          <Text style={styles.instructionText}>
            {t('camera.instruction', {
              defaultValue: 'Đặt cây của bạn vào giữa khung hình',
            })}
          </Text>
        </View>

        {/* Location display */}
        {location ? (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#4CAF50" />
            <Text style={styles.locationText}>
              {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </Text>
          </View>
        ) : (
          <View style={styles.locationLoadingContainer}>
            <ActivityIndicator size="small" color="#FF9800" />
            <Text style={styles.locationLoadingText}>
              Đang lấy vị trí GPS...
            </Text>
          </View>
        )}

        {/* GPS Warning Overlay */}
        {!location && (
          <View style={styles.gpsWarningOverlay}>
            <Ionicons name="location-outline" size={48} color="#FF9800" />
            <Text style={styles.gpsWarningTitle}>Đang lấy thông tin vị trí</Text>
            <Text style={styles.gpsWarningText}>
              Vui lòng đợi để có tọa độ GPS chính xác
            </Text>
            <ActivityIndicator size="large" color="#FF9800" style={{ marginTop: 16 }} />
          </View>
        )}

        {/* Bottom controls */}
        <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity 
            style={[
              styles.galleryButton,
              (isLoading || !location) && styles.buttonDisabled,
            ]}
            onPress={handleGalleryButtonPress}
            disabled={isLoading || !location}
          >
            <Ionicons
              name="images"
              size={32}
              color={isLoading || !location ? '#999' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.captureButton,
              (isLoading || !location) && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isLoading || !location}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : !location ? (
              <ActivityIndicator size="large" color="#999" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tipsButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={() => Alert.alert('Mẹo chụp', 'Đặt lá lúa vào giữa khung hình\nĐảm bảo ánh sáng đủ\nGiữ máy thật vững')}
            disabled={isLoading}
          >
            <Ionicons name="bulb" size={32} color={isLoading ? '#999' : '#fff'} />
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Gallery Options Modal */}
      <Modal
        visible={showGalleryOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGalleryOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowGalleryOptions(false)}
        >
          <View style={styles.galleryOptionsContainer}>
            <Text style={styles.galleryOptionsTitle}>Chọn nguồn ảnh</Text>
            
            <TouchableOpacity 
              style={[
                styles.galleryOption,
                hasAnyIoTField && styles.galleryOptionDisabled
              ]}
              onPress={hasAnyIoTField ? undefined : handlePickFromDeviceGallery}
              disabled={hasAnyIoTField}
            >
              <Ionicons 
                name="images" 
                size={24} 
                color={hasAnyIoTField ? "#ccc" : "#4CAF50"} 
              />
              <View style={styles.galleryOptionTextContainer}>
                <Text style={[
                  styles.galleryOptionTitle,
                  hasAnyIoTField && { color: '#ccc' }
                ]}>
                  Thư viện thiết bị
                </Text>
                <Text style={[
                  styles.galleryOptionSubtitle,
                  hasAnyIoTField && { color: '#ccc' }
                ]}>
                  {hasAnyIoTField 
                    ? '🌾 Chế độ IoT: Chỉ chụp ảnh mới hoặc chọn từ IoT'
                    : 'Chọn ảnh từ thiết bị của bạn'
                  }
                </Text>
              </View>
              {hasAnyIoTField ? (
                <Ionicons name="lock-closed" size={20} color="#ccc" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#999" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.galleryOption}
              onPress={handleOpenIoTGallery}
            >
              <Ionicons name="hardware-chip" size={24} color="#2196F3" />
              <View style={styles.galleryOptionTextContainer}>
                <Text style={styles.galleryOptionTitle}>Bộ sưu tập IoT</Text>
                <Text style={styles.galleryOptionSubtitle}>Xem ảnh từ thiết bị IoT</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.galleryCancelButton}
              onPress={() => setShowGalleryOptions(false)}
            >
              <Text style={styles.galleryCancelButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Field Selection Modal */}
      <Modal
        visible={showFieldSelection}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFieldSelection(false)}
      >
        <FieldSelectionModal
          onFieldSelected={handleFieldSelected}
          onCancel={() => setShowFieldSelection(false)}
        />
      </Modal>

      {/* IoT Gallery Modal */}
      <Modal
        visible={showIoTGallery}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseIoTGallery}
      >
        <View style={styles.iotGalleryContainer}>
          <View style={styles.iotGalleryHeader}>
            <TouchableOpacity onPress={handleCloseIoTGallery}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            {selectedIoTField && (
              <View style={styles.selectedFieldBadge}>
                <Ionicons name="leaf" size={16} color={colors.primary} />
                <Text style={styles.selectedFieldName}>{selectedIoTField.name}</Text>
              </View>
            )}
          </View>
          <IoTGalleryScreen preselectedField={selectedIoTField || undefined} />
        </View>
      </Modal>

      {/* Preview overlay with progress */}
      {capturedImageUri && (
        <View style={styles.previewOverlay}>
          <Image
            source={{ uri: capturedImageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          
          {/* Progress bar container */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${uploadProgress}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {loadingMessage} {uploadProgress}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
  },
  flashButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 100,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#fff',
    borderTopLeftRadius: 20,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 100,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#fff',
    borderTopRightRadius: 20,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#fff',
    borderBottomLeftRadius: 20,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 100,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#fff',
    borderBottomRightRadius: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 200,
  },
  locationContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  locationLoadingContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  locationLoadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gpsWarningOverlay: {
    position: 'absolute',
    top: '40%',
    left: 40,
    right: 40,
    backgroundColor: 'rgba(255, 152, 0, 0.95)',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF9800',
  },
  gpsWarningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  gpsWarningText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    // paddingBottom is set dynamically using useSafeAreaInsets
  },
  galleryButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#E0E0E0',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  tipsButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  galleryOptionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  galleryOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  galleryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  galleryOptionDisabled: {
    backgroundColor: '#f9f9f9',
    opacity: 0.6,
  },
  galleryOptionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  galleryOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  galleryOptionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  galleryCancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  galleryCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  iotGalleryContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  iotGalleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  selectedFieldBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  selectedFieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});

