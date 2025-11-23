/**
 * PhotoDetailScreen - Detailed view of photo with disease information tabs
 * Tabs: Thông tin bệnh | Cách trị bệnh
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatbotModal from '../src/components/ChatbotModal';
import FormattedAIText from '../src/components/FormattedAIText';
import { apiPost, getAccessToken } from '../src/services/api';
import { generateMonitoringPlan, type ProcessedWeatherData } from '../src/services/gemini.service';
import { Photo, getPhotoById } from '../src/services/photo.service';
import { getWeatherForecast } from '../src/services/weather.service';

const { width } = Dimensions.get('window');

type TabKey = 'info' | 'treatment';

export default function PhotoDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  
  // ✨ NEW: For IoT images - auto-generate monitoring plan
  const [monitoringPlan, setMonitoringPlan] = useState<string>('');
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  
  // ✨ NEW: For sending treatment to IoT
  const [isSendingToIoT, setIsSendingToIoT] = useState(false);
  const [treatmentSent, setTreatmentSent] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadPhoto();
    }
  }, [id]);

  const loadPhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const photoData = await getPhotoById(id);
      
      console.log('📸 Photo loaded in photo-detail:', {
        _id: photoData._id,
        source: (photoData as any).source,
        fieldId: (photoData as any).fieldId,
        hasIotMetadata: !!(photoData as any).iotMetadata,
        iotMetadataFieldId: (photoData as any).iotMetadata?.fieldId,
        diseaseClass: photoData.prediction?.class,
        photoKeys: Object.keys(photoData),
      });
      
      setPhoto(photoData);
      
      // ✅ If IoT image with disease, auto-generate monitoring plan
      const isIoT = (photoData as any).source === 'iot';
      const hasDisease = photoData.prediction?.class !== 'healthy';
      
      if (isIoT && hasDisease) {
        console.log('📊 Auto-loading monitoring plan for IoT image...');
        loadMonitoringPlan(photoData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load photo');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Convert weather response to ProcessedWeatherData format
   */
  const convertWeatherData = (weatherResponse: any): ProcessedWeatherData => {
    // Group forecast by day
    const forecastByDay: { [key: string]: any[] } = {};
    
    weatherResponse.forecast.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toLocaleDateString('vi-VN');
      if (!forecastByDay[date]) {
        forecastByDay[date] = [];
      }
      forecastByDay[date].push(item);
    });

    // Calculate daily summaries
    const forecast = Object.entries(forecastByDay)
      .slice(0, 3)
      .map(([date, items]: [string, any[]]) => {
        const avgTemp = items.reduce((sum, item) => sum + item.main.temp, 0) / items.length;
        const avgHumidity = items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length;
        const totalRain = items.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
        
        return {
          date,
          temp: Math.round(avgTemp),
          humidity: Math.round(avgHumidity),
          rain: Math.round(totalRain * 10) / 10,
          description: items[0].weather[0].description,
        };
      });

    return {
      current: {
        temp: weatherResponse.current.main.temp,
        humidity: weatherResponse.current.main.humidity,
        description: weatherResponse.current.weather[0].description,
      },
      forecast,
    };
  };
  
  /**
   * Load monitoring plan for IoT images
   */
  const loadMonitoringPlan = async (photoData: Photo) => {
    try {
      setIsLoadingPlan(true);
      
      // Get sensors from iotMetadata
      const iotMetadata = (photoData as any).iotMetadata;
      const rawSensors = iotMetadata?.sensors;
      
      // Transform sensor field names
      const sensors = rawSensors ? {
        temperature: rawSensors.temp,
        humidity: rawSensors.humidity,
        ph: rawSensors.ph,
        soilMoisture: rawSensors.soil,
        lux: rawSensors.lux,
        windSpeed: rawSensors.wind,
      } : undefined;
      
      // Get weather data and convert to ProcessedWeatherData format
      const weatherResponse = await getWeatherForecast(
        photoData.metadata.lat || 0,
        photoData.metadata.lng || 0
      );
      const weatherData = convertWeatherData(weatherResponse);
      
      // Generate monitoring plan
      const plan = await generateMonitoringPlan(
        {
          diseaseClass: photoData.prediction!.class,
          diseaseVi: photoData.prediction!.classVi,
          diseaseEn: photoData.prediction!.class,
          confidence: photoData.prediction!.confidence,
          location: {
            lat: photoData.metadata.lat || 0,
            lng: photoData.metadata.lng || 0,
          },
          timestamp: new Date(photoData.createdAt).getTime(),
          sensors,
        },
        weatherData
      );
      
      setMonitoringPlan(plan);
      console.log('✅ Monitoring plan loaded');
    } catch (err: any) {
      console.error('❌ Failed to load monitoring plan:', err);
      setMonitoringPlan('Không thể tải kế hoạch giám sát. Vui lòng thử lại.');
    } finally {
      setIsLoadingPlan(false);
    }
  };
  
  /**
   * Generate monitoring plan from chatbot AI (background call)
   */
  const generateMonitoringPlanBackground = async (): Promise<boolean> => {
    if (!photo || !photo.prediction) {
      return false;
    }

    try {
      console.log('🤖 Generating monitoring plan in background (photo-detail)...');
      
      // Import required services
      const { generateMonitoringPlan } = await import('@/services/gemini.service');
      const { getWeatherForecast } = await import('@/services/weather.service');
      const { parseMonitoringPlanResponse } = await import('@/utils/treatment-parser.utils');
      const { updatePhotoTreatment } = await import('@/services/photo.service');

      // Get disease context
      const diseaseContext = {
        diseaseClass: photo.prediction.class,
        diseaseVi: photo.prediction.classVi || photo.prediction.class,
        diseaseEn: photo.prediction.class,
        confidence: photo.prediction.confidence || 0,
        location: {
          lat: photo.metadata.lat,
          lng: photo.metadata.lng,
        },
        timestamp: photo.metadata.timestamp || Date.now(),
        sensors: (photo as any).iotMetadata?.sensors ? {
          temperature: (photo as any).iotMetadata.sensors.temp,
          humidity: (photo as any).iotMetadata.sensors.humidity,
          ph: (photo as any).iotMetadata.sensors.ph,
          soilMoisture: (photo as any).iotMetadata.sensors.soil,
          lux: (photo as any).iotMetadata.sensors.lux,
          windSpeed: (photo as any).iotMetadata.sensors.wind,
        } : undefined,
      };

      // Get weather data and convert to ProcessedWeatherData format
      const gps = photo.metadata;
      const weatherResponse = await getWeatherForecast(gps.lat, gps.lng);
      const weatherData = convertWeatherData(weatherResponse);

      // Generate monitoring plan
      const aiResponse = await generateMonitoringPlan(diseaseContext, weatherData);
      console.log('✅ Monitoring plan generated (photo-detail):', aiResponse.substring(0, 100));

      // Parse treatment data
      const parsedTreatment = parseMonitoringPlanResponse(
        aiResponse,
        diseaseContext.diseaseVi,
        diseaseContext.diseaseEn,
        diseaseContext.confidence,
        diseaseContext.sensors
      );

      // Update photo treatment data
      const updateResult = await updatePhotoTreatment(photo._id, parsedTreatment);
      if (updateResult.success) {
        console.log('✅ Treatment data updated from background AI call (photo-detail)');
        return true;
      } else {
        console.warn('⚠️ Failed to update treatment data:', updateResult.error);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error generating monitoring plan in background (photo-detail):', error);
      return false;
    }
  };

  /**
   * Send treatment to IoT device
   */
  const handleSendToIoT = async () => {
    const fieldId = (photo as any)?.fieldId || (photo as any)?.iotMetadata?.fieldId;
    
    if (!photo || !photo._id || !fieldId) {
      console.error('❌ Missing photo ID or field ID', {
        hasPhoto: !!photo,
        photoId: photo?._id,
        fieldId,
      });
      return;
    }

    if (treatmentSent) {
      return; // Already sent
    }

    try {
      setIsSendingToIoT(true);
      
      // Step 1: Generate monitoring plan from chatbot AI in background
      console.log('🔄 Step 1: Generating monitoring plan from chatbot AI (photo-detail)...');
      await generateMonitoringPlanBackground();
      
      // Step 2: Send treatment to IoT
      console.log('🔄 Step 2: Sending treatment to IoT (photo-detail)...');
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }

      const response = await apiPost('/iot/treatment/send', {
        photoId: photo._id,
        fieldId,
      });

      if (response.success) {
        console.log('✅ Treatment sent successfully from photo-detail');
        setTreatmentSent(true);
        setShowSuccessModal(true);
      } else {
        throw new Error('Gửi thất bại');
      }
    } catch (error: any) {
      console.error('❌ Send treatment error:', error);
      alert(error.message || 'Không thể gửi thông tin điều trị. Vui lòng thử lại.');
    } finally {
      setIsSendingToIoT(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>
          {t('photoDetail.loading', { defaultValue: 'Đang tải...' })}
        </Text>
      </View>
    );
  }

  if (error || !photo || !photo.prediction) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error || 'Photo not found'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>
            {t('common.back', { defaultValue: 'Quay lại' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diseaseClass = photo.prediction.class;
  const isIoTImage = (photo as any).source === 'iot';
  
  // Get disease info and treatment from i18n
  const getDiseaseInfo = () => {
    return t(`photoDetail.diseases.${diseaseClass}.info`, {
      defaultValue: 'Disease information not available',
    });
  };

  const getDiseaseTreatment = () => {
    return t(`photoDetail.diseases.${diseaseClass}.treatment`, {
      defaultValue: 'Treatment information not available',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('photoDetail.title', { defaultValue: 'Chi tiết phân tích' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photo.watermarkedUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        </View>

        {/* Disease Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>
              {diseaseClass === 'healthy' ? '🎉' : '⚠️'}
            </Text>
            <View style={styles.statusInfo}>
              <Text
                style={[
                  styles.diseaseName,
                  { color: diseaseClass === 'healthy' ? '#4CAF50' : '#F44336' },
                ]}
              >
                {photo.prediction.classVi}
              </Text>
              <Text style={styles.confidenceText}>
                {t('photoDetail.confidence', { defaultValue: 'Độ tin cậy' })}:{' '}
                {photo.prediction.confidence.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs - IoT: 1 tab only, Regular: 2 tabs */}
        {diseaseClass !== 'healthy' && !isIoTImage && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'info' && styles.activeTab]}
              onPress={() => setActiveTab('info')}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={activeTab === 'info' ? '#4CAF50' : '#999'}
              />
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
                {t('photoDetail.diseaseInfo', { defaultValue: 'Thông tin bệnh' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'treatment' && styles.activeTab]}
              onPress={() => setActiveTab('treatment')}
            >
              <Ionicons
                name="medical"
                size={20}
                color={activeTab === 'treatment' ? '#4CAF50' : '#999'}
              />
              <Text style={[styles.tabText, activeTab === 'treatment' && styles.activeTabText]}>
                {t('photoDetail.treatment', { defaultValue: 'Cách trị bệnh' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* IoT: Single tab header */}
        {diseaseClass !== 'healthy' && isIoTImage && (
          <View style={styles.singleTabContainer}>
            <Ionicons name="analytics" size={24} color="#4CAF50" />
            <Text style={styles.singleTabTitle}>{t('photoDetail.diagnosisInfo')}</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.contentContainer}>
          {isIoTImage ? (
            // ✅ IoT: Show monitoring plan (auto-generated)
            isLoadingPlan ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingPlanText}>{t('photoDetail.loadingPlan')}</Text>
              </View>
            ) : (
              <>
                <FormattedAIText text={monitoringPlan} />
                
                {/* Send Treatment to IoT Button */}
                {(() => {
                  const fieldId = (photo as any).fieldId || (photo as any).iotMetadata?.fieldId;
                  const hasDisease = photo.prediction?.class !== 'healthy';
                  
                  console.log('🔘 Photo-detail - Send to IoT button check:', {
                    isIoTImage,
                    fieldId,
                    hasFieldId: !!fieldId,
                    diseaseClass: photo.prediction?.class,
                    hasDisease,
                    shouldShow: !!fieldId && hasDisease,
                    photoKeys: Object.keys(photo),
                    iotMetadata: (photo as any).iotMetadata,
                  });
                  
                  return (fieldId && hasDisease) && (
                    <TouchableOpacity
                      style={[
                        styles.sendToIoTButton,
                        (isSendingToIoT || treatmentSent) && styles.sendToIoTButtonDisabled,
                      ]}
                      onPress={handleSendToIoT}
                      disabled={isSendingToIoT || treatmentSent}
                    >
                      {isSendingToIoT ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="send" size={20} color="#fff" />
                          <Text style={styles.sendToIoTButtonText}>
                            {treatmentSent ? t('photoDetail.sentToIoT') : t('photoDetail.sendToIoT')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })()}
              </>
            )
          ) : (
            // ✅ Regular: Show i18n content
            <Text style={styles.contentText}>
              {activeTab === 'info' ? getDiseaseInfo() : getDiseaseTreatment()}
            </Text>
          )}
        </View>

        {/* Chat with Doctor Rice Button */}
        {diseaseClass !== 'healthy' && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => setIsChatbotVisible(true)}
          >
            <Image
              source={require('../src/assets/images/text-logo.png')}
              style={styles.chatButtonIcon}
              resizeMode="contain"
            />
            <Text style={styles.chatButtonText}>
              {t('photoDetail.chatWithDoctor', { defaultValue: 'Chat với Bác sĩ Lúa' })}
            </Text>
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={() => router.push('/(tabs)/mapFarm')}
          >
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {t('photoDetail.viewOnMap', { defaultValue: 'Xem bản đồ' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.recaptureButton]}
            onPress={() => router.push('/camera-modal')}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {t('photoDetail.newPhoto', { defaultValue: 'Chụp mới' })}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Chatbot Modal */}
      {(() => {
        // Get sensors from iotMetadata (similar to result.tsx)
        const iotMetadata = (photo as any).iotMetadata;
        const rawSensors = iotMetadata?.sensors;
        
        // Transform sensor field names from DB schema to frontend
        const sensors = rawSensors ? {
          temperature: rawSensors.temp,
          humidity: rawSensors.humidity,
          ph: rawSensors.ph,
          soilMoisture: rawSensors.soil,
          lux: rawSensors.lux,
          windSpeed: rawSensors.wind,
        } : undefined;
        
        const photoSource = (photo as any).source;
        const photoFieldId = (photo as any).fieldId || iotMetadata?.fieldId;
        
        console.log('📊 photo-detail.tsx - Passing to ChatbotModal:', {
          photoId: photo._id,
          fieldId: photoFieldId,
          source: photoSource,
          hasSensors: !!sensors,
          sensors,
        });
        
        return (
          <ChatbotModal
            visible={isChatbotVisible}
            onClose={() => setIsChatbotVisible(false)}
            diseaseContext={{
              diseaseClass: photo.prediction.class,
              diseaseVi: photo.prediction.classVi,
              diseaseEn: photo.prediction.class,
              confidence: photo.prediction.confidence,
              location: {
                lat: photo.metadata.lat,
                lng: photo.metadata.lng,
              },
              timestamp: new Date(photo.createdAt).getTime(),
              sensors: sensors, // ✅ Include sensor data for IoT images
            }}
            initialImage={photo.watermarkedUrl}
            photoId={photo._id} // ✅ Pass photoId for sending treatment
            fieldId={photoFieldId} // ✅ Pass fieldId for sending treatment
            source={photoSource} // ✅ Pass source to identify IoT images
          />
        );
      })()}
      
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.successModalTitle}>Thành công!</Text>
            <Text style={styles.successModalMessage}>
              {t('photoDetail.treatmentSentSuccess')}
            </Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successModalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageContainer: {
    width: width,
    height: width * 0.75,
    backgroundColor: '#E0E0E0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    fontSize: 48,
  },
  statusInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  contentContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  mapButton: {
    backgroundColor: '#4CAF50',
  },
  recaptureButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonIcon: {
    width: 28,
    height: 28,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // ✨ NEW: IoT single tab styles
  singleTabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  singleTabTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingPlanText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // ✨ NEW: Send to IoT button styles
  sendToIoTButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendToIoTButtonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.7,
  },
  sendToIoTButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Success Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  successModalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  successModalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 120,
  },
  successModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});

