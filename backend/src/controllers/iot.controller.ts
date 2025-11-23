/**
 * IoT Controller
 * Manage IoT device connections and images
 */
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { Field } from '../models/Field';
import { IoTConnection } from '../models/IoTConnection';
import { IoTConnectionCode } from '../models/IoTConnectionCode';
import { Photo } from '../models/Photo';
import { generateCode } from '../scripts/generateIoTCodes';
import { AIService } from '../services/ai.service';
import { firebaseIoTService } from '../services/firebase-iot.service';
import { calculateDistance, isInsideGeofence } from '../utils/gps.utils';
import { logger } from '../utils/logger';
import { errorResponse, successResponse } from '../utils/responses';
import { generateTreatmentData } from '../utils/treatment-generator.utils';

/**
 * Connect IoT device to field
 * POST /api/iot/connect
 */
export const connectDevice = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { fieldId, connectionCode, deviceId: userProvidedDeviceId } = req.body;
    
    // Validate
    if (!fieldId || !connectionCode) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Field ID and connection code are required', 400);
    }
    
    // Check field exists and belongs to user
    const field = await Field.findOne({ _id: fieldId, userId });
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Check if field already has ACTIVE connection
    const existingConnection = await IoTConnection.findOne({ 
      fieldId,
      status: 'active'
    });
    if (existingConnection) {
      return errorResponse(res, 'CONFLICT', 'Field already has an active IoT connection', 409);
    }
    
    // Cleanup old inactive connections to prevent database pollution
    const inactiveCount = await IoTConnection.countDocuments({ 
      fieldId, 
      status: 'inactive' 
    });
    if (inactiveCount > 0) {
      logger.info(`🧹 Cleaning up ${inactiveCount} inactive connection(s) for field ${fieldId}`);
      // Note: We keep the most recent inactive connection for reference
      // Delete older ones if there are more than 1
      if (inactiveCount > 1) {
        const inactiveConnections = await IoTConnection.find({ 
          fieldId, 
          status: 'inactive' 
        })
        .sort({ connectedAt: -1 })
        .skip(1); // Keep the most recent one
        
        const idsToDelete = inactiveConnections.map(c => c._id);
        await IoTConnection.deleteMany({ _id: { $in: idsToDelete } });
        logger.info(`🗑️ Deleted ${idsToDelete.length} old inactive connection(s)`);
      }
    }
    
    // Find connection code
    const codeRecord = await IoTConnectionCode.findOne({
      code: connectionCode.trim().toUpperCase(),
    })
      .select('+code +codeHash')
      .lean();
    
    if (!codeRecord) {
      return errorResponse(res, 'INVALID_CODE', 'Invalid connection code', 400);
    }
    
    // Check if code is already used
    if (codeRecord.isUsed) {
      return errorResponse(res, 'CODE_USED', 'This code has already been used', 400);
    }
    
    // Check if code is expired
    if (codeRecord.expiresAt && new Date() > codeRecord.expiresAt) {
      return errorResponse(res, 'CODE_EXPIRED', 'Connection code has expired', 400);
    }
    
    // Verify code hash
    const isValidCode = await bcrypt.compare(connectionCode.trim().toUpperCase(), codeRecord.codeHash);
    if (!isValidCode) {
      return errorResponse(res, 'INVALID_CODE', 'Invalid connection code', 400);
    }
    
    // Determine deviceId: use user-provided if available, otherwise use codeRecord.deviceId
    // Normalize to lowercase for case-insensitive matching
    const initialDeviceId = (userProvidedDeviceId?.trim() || codeRecord.deviceId).toLowerCase();
    
    logger.info(`📝 Creating connection with deviceId:`, {
      userProvided: userProvidedDeviceId,
      normalized: initialDeviceId,
      codeRecordDeviceId: codeRecord.deviceId,
      finalDeviceId: initialDeviceId,
    });
    
    // Create connection
    const connection = await IoTConnection.create({
      userId,
      fieldId,
      deviceId: initialDeviceId, // Use user-provided or codeRecord deviceId
      connectionCode: codeRecord.codeHash,
      firebaseDbUrl: 'https://rice-813b5-default-rtdb.firebaseio.com',
      status: 'active',
      connectedAt: new Date(),
    });
    
    // Mark code as used
    await IoTConnectionCode.findByIdAndUpdate(codeRecord._id, {
      isUsed: true,
      usedBy: userId,
      usedAt: new Date(),
    });
    
    // 🚀 Auto-detect real device_id from Firebase (only if deviceId is 'ANY')
    let realDeviceId = connection.deviceId;
    
    if (connection.deviceId === 'ANY') {
      logger.info(`🔍 DeviceId is 'ANY', detecting real device_id from Firebase...`);
      
      try {
        const detectedDeviceId = await firebaseIoTService.detectActiveDevice();
        
        if (detectedDeviceId) {
          // Update connection with real device_id
          await IoTConnection.findByIdAndUpdate(connection._id, {
            deviceId: detectedDeviceId,
          });
          
          realDeviceId = detectedDeviceId;
          logger.info(`✅ Updated connection with real device_id: ${detectedDeviceId}`);
        } else {
          logger.warn(`⚠️ No active device found in Firebase, keeping deviceId as 'ANY'`);
        }
      } catch (error: any) {
        logger.error(`❌ Failed to detect device_id:`, error.message);
        // Continue with 'ANY' if detection fails
      }
    } else {
      logger.info(`✅ Using user-provided or code deviceId: ${realDeviceId}`);
    }
    
    logger.info(`✅ IoT connected: ${realDeviceId} to field ${field.name}`);
    
    return successResponse(
      res,
      {
        connection: {
          _id: connection._id,
          deviceId: realDeviceId, // Return real device_id
          fieldId: connection.fieldId,
          fieldName: field.name,
          connectedAt: connection.connectedAt,
        },
        deviceInfo: {
          deviceId: realDeviceId, // Return real device_id
          firebaseUrl: connection.firebaseDbUrl,
        },
        message: 'IoT device connected successfully',
      },
      201
    );
  } catch (error: any) {
    logger.error('❌ Connect device error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Get IoT connection status
 * GET /api/iot/connection/status
 */
export const getConnectionStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { fieldId } = req.query;
    
    if (!fieldId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Field ID is required', 400);
    }
    
    // Check field belongs to user
    const field = await Field.findOne({ _id: fieldId as string, userId });
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Get connection
    const connection = await IoTConnection.findOne({
      fieldId: fieldId as string,
      status: 'active',
    });
    
    if (!connection) {
      return successResponse(res, {
        isConnected: false,
        fieldName: field.name,
      });
    }
    
    // 🔄 Auto-update device_id if still 'ANY'
    let deviceId = connection.deviceId;
    
    if (deviceId === 'ANY') {
      logger.info(`🔍 Connection has deviceId='ANY', attempting to detect real device...`);
      
      try {
        const detectedDeviceId = await firebaseIoTService.detectActiveDevice();
        
        if (detectedDeviceId) {
          await IoTConnection.findByIdAndUpdate(connection._id, {
            deviceId: detectedDeviceId,
          });
          
          deviceId = detectedDeviceId;
          logger.info(`✅ Updated connection ${connection._id} with real device_id: ${detectedDeviceId}`);
        }
      } catch (error: any) {
        logger.error(`❌ Failed to detect device_id:`, error.message);
      }
    }
    
    return successResponse(res, {
      isConnected: true,
      deviceId: deviceId, // Return real device_id
      fieldName: field.name,
      connectedAt: connection.connectedAt,
      lastSync: connection.lastSyncAt,
      firebaseUrl: connection.firebaseDbUrl,
    });
  } catch (error: any) {
    logger.error('❌ Get connection status error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Disconnect IoT device from field
 * DELETE /api/iot/disconnect
 */
export const disconnectDevice = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { fieldId } = req.body;
    
    if (!fieldId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Field ID is required', 400);
    }
    
    // Check field belongs to user
    const field = await Field.findOne({ _id: fieldId, userId });
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Find ALL active connections for this field
    // (There might be multiple if user reconnected without proper cleanup)
    const activeConnections = await IoTConnection.find({ 
      fieldId,
      status: 'active'
    });
    
    if (activeConnections.length === 0) {
      return errorResponse(res, 'NOT_FOUND', 'No active IoT connection found for this field', 404);
    }
    
    // Deactivate ALL active connections
    await IoTConnection.updateMany(
      { fieldId, status: 'active' },
      { $set: { status: 'inactive' } }
    );
    
    logger.info(`✅ IoT disconnected: ${activeConnections.length} connection(s) for field ${field.name}`, {
      connections: activeConnections.map(c => ({
        id: c._id,
        deviceId: c.deviceId,
        connectedAt: c.connectedAt,
      })),
    });
    
    // Mark the used code as unused so it can be reused for reconnection
    // This is simpler and more reliable than generating a new code
    try {
      const usedCode = await IoTConnectionCode.findOne({
        fieldId: field._id,
        isUsed: true,
      });
      
      if (usedCode) {
        usedCode.isUsed = false;
        usedCode.usedBy = undefined;
        usedCode.usedAt = undefined;
        await usedCode.save();
    
        logger.info(`♻️ Marked code as reusable for field ${field.name}`, {
          codeId: usedCode._id,
          fieldId: field._id,
        });
      } else {
        // No used code found, generate a new one
        logger.info(`🔄 No used code found, generating new code for field ${field._id}...`);
        const generatedCode = generateCode('ANY');
        const codeHash = await bcrypt.hash(generatedCode, 10);
        
        const newCode = await IoTConnectionCode.create({
          code: generatedCode,
          codeHash: codeHash,
          deviceId: 'ANY',
          fieldId: field._id,
          isUsed: false,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        });
        
        logger.info(`🔑 Generated new IoT code for field ${field.name}`, {
          codeId: newCode._id,
          code: generatedCode,
        });
      }
    } catch (codeError: any) {
      logger.error('❌ Failed to handle IoT code:', {
        error: codeError.message,
        stack: codeError.stack,
        fieldId: field._id,
      });
      // Don't fail disconnect if code handling fails
    }
    
    return successResponse(res, { message: 'IoT device disconnected successfully' });
  } catch (error: any) {
    logger.error('❌ Disconnect device error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Get list of user's IoT connections
 * GET /api/iot/connections
 */
export const listConnections = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const connections = await IoTConnection.find({ userId })
      .populate('fieldId', 'name gpsCenter radius isDeleted')
      .sort({ createdAt: -1 });
    
    logger.info(`📋 Listing connections for user ${userId}:`, {
      total: connections.length,
      connections: connections.map(c => ({
        _id: c._id,
        deviceId: c.deviceId,
        fieldId: (c.fieldId as any)?._id,
        fieldName: (c.fieldId as any)?.name,
        fieldDeleted: (c.fieldId as any)?.isDeleted,
        status: c.status,
      })),
    });
    
    return successResponse(res, {
      connections: connections.map(c => ({
        _id: c._id,
        deviceId: c.deviceId,
        field: c.fieldId,
        status: c.status,
        connectedAt: c.connectedAt,
        lastSyncAt: c.lastSyncAt,
      })),
      total: connections.length,
    });
  } catch (error: any) {
    logger.error('❌ List connections error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Get IoT images for a field
 * GET /api/iot/images
 */
export const getIoTImages = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { fieldId, limit = 50, days = 7 } = req.query;
    
    if (!fieldId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Field ID is required', 400);
    }
    
    // Get field
    const field = await Field.findOne({ _id: fieldId as string, userId });
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Get IoT connection
    const connection = await IoTConnection.findOne({
      fieldId: fieldId as string,
      status: 'active',
    });
    
    if (!connection) {
      return errorResponse(res, 'NOT_FOUND', 'No IoT connection found for this field', 404);
    }
    
    // 🔄 Auto-update device_id if still 'ANY'
    let deviceId = connection.deviceId;
    
    if (deviceId === 'ANY') {
      logger.info(`🔍 Connection has deviceId='ANY', detecting real device before fetching images...`);
      
      try {
        const detectedDeviceId = await firebaseIoTService.detectActiveDevice();
        
        if (detectedDeviceId) {
          await IoTConnection.findByIdAndUpdate(connection._id, {
            deviceId: detectedDeviceId,
          });
          
          deviceId = detectedDeviceId;
          logger.info(`✅ Updated connection ${connection._id} with real device_id: ${detectedDeviceId}`);
        } else {
          logger.warn(`⚠️ No active device found, using 'ANY' for image fetch`);
        }
      } catch (error: any) {
        logger.error(`❌ Failed to detect device_id:`, error.message);
      }
    }
    
    logger.info(`📡 Fetching IoT images with:`, {
      connectionId: connection._id,
      fieldId: field._id,
      fieldName: field.name,
      deviceId: deviceId,
      fieldGPS: field.gpsCenter,
      fieldRadius: field.radius,
      days: Number(days),
      limit: Number(limit),
    });
    
    // Fetch images from Firebase (use detected deviceId or 'ANY')
    const allImages = await firebaseIoTService.getRecentImages(
      deviceId, // Use updated deviceId
      Number(days),
      Number(limit) * 2 // Fetch more for GPS filtering
    );
    
    logger.info(`📊 Firebase returned ${allImages.length} images for device: ${deviceId}`);
    
    // Debug: Log full first image structure
    if (allImages.length > 0) {
      logger.info(`🔍 First image structure:`, {
        fullImage: JSON.stringify(allImages[0]),
        imageKeys: Object.keys(allImages[0]),
        gpsObject: allImages[0].gps,
        hasGps: !!allImages[0].gps,
        gpsLat: allImages[0].gps?.lat,
        gpsLng: allImages[0].gps?.lng,
      });
    }
    
    logger.info(`📍 GPS Filtering Debug:`, {
      fieldGPS: { lat: field.gpsCenter.lat, lng: field.gpsCenter.lng },
      fieldRadius: field.radius,
      totalImages: allImages.length,
      sampleImageGPS: allImages[0] ? { lat: allImages[0].gps?.lat, lng: allImages[0].gps?.lng } : null,
    });
    
    // Filter by GPS geofence
    let firstFilteredOutLogged = false;
    const filteredImages = allImages.filter(img => {
      const isInside = isInsideGeofence(
        img.gps.lat,
        img.gps.lng,
        field.gpsCenter.lat,
        field.gpsCenter.lng,
        field.radius
      );
      
      // Log first filtered out image for debugging
      if (!isInside && !firstFilteredOutLogged) {
        firstFilteredOutLogged = true;
        const distance = calculateDistance(
          img.gps.lat,
          img.gps.lng,
          field.gpsCenter.lat,
          field.gpsCenter.lng
        );
        logger.warn(`⚠️ Image filtered out:`, {
          imageGPS: { lat: img.gps.lat, lng: img.gps.lng },
          fieldGPS: { lat: field.gpsCenter.lat, lng: field.gpsCenter.lng },
          distance: `${distance.toFixed(2)}m`,
          radius: `${field.radius}m`,
          exceedBy: `${(distance - field.radius).toFixed(2)}m`,
        });
      }
      
      return isInside;
    }).slice(0, Number(limit));
    
    logger.info(`✅ GPS Filtering Result: ${allImages.length} → ${filteredImages.length} images`);
    
    // Update last sync
    connection.lastSyncAt = new Date();
    await connection.save();
    
    // Map images to frontend format (gps -> location)
    const mappedImages = filteredImages.map(img => ({
      id: img.captureId,
      deviceId: img.deviceId,
      imageUrl: img.imageUrl,
      captureId: img.captureId,
      sensors: img.sensors,
      location: {  // Map gps to location for frontend
        lat: img.gps.lat,
        lng: img.gps.lng,
      },
      timestamp: new Date(img.timestamp).getTime(),
      isInsideGeofence: true,
    }));
    
    logger.info(`📤 Sending response to frontend:`, {
      imagesCount: mappedImages.length,
      firstImage: mappedImages[0] ? {
        id: mappedImages[0].id,
        hasLocation: !!mappedImages[0].location,
        locationLat: mappedImages[0].location?.lat,
        timestamp: mappedImages[0].timestamp,
      } : null,
    });
    
    // Return array directly (frontend expects ApiResponse<IoTImage[]>)
    return successResponse(res, mappedImages);
  } catch (error: any) {
    logger.error('❌ Get IoT images error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Upload photo from mobile app to Firebase IoT
 * POST /api/iot/upload
 */
export const uploadMobilePhoto = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { fieldId } = req.body;
    
    // Parse GPS (sent as JSON string in FormData)
    let gps: { lat: number; lng: number };
    try {
      gps = JSON.parse(req.body.gps);
    } catch {
      return errorResponse(res, 'VALIDATION_ERROR', 'Invalid GPS format', 400);
    }
    
    if (!fieldId || !gps || !gps.lat || !gps.lng) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Field ID and GPS are required', 400);
    }
    
    if (!req.file) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Image file is required', 400);
    }
    
    logger.info(`📤 Mobile photo upload request:`, {
      userId,
      fieldId,
      gps,
      fileName: req.file.originalname,
    });
    
    // Verify field belongs to user
    const field = await Field.findOne({ _id: fieldId, userId });
    if (!field) {
      return errorResponse(res, 'NOT_FOUND', 'Field not found', 404);
    }
    
    // Get IoT connection
    const connection = await IoTConnection.findOne({
      fieldId,
      status: 'active',
    });
    
    if (!connection) {
      return errorResponse(res, 'NOT_FOUND', 'No IoT connection found for this field', 404);
    }
    
    // Generate capture ID
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').replace('T', 'T').split('.')[0];
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const captureId = `${timestamp}_${random}`;
    
    // Get date key (YYYYMMDD)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateKey = `${year}${month}${day}`;
    
    logger.info(`📝 Generated captureId: ${captureId}, dateKey: ${dateKey}`);
    
    // Upload to Firebase IoT
    const result = await firebaseIoTService.uploadMobileImage({
      imageBuffer: req.file.buffer,
      captureId,
      dateKey,
      fieldId: String(field._id),
      fieldName: field.name,
      gps,
      userId,
      deviceId: `MOBILE_${userId.substring(0, 8)}`,
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Upload to Firebase failed');
    }
    
    logger.info(`✅ Mobile photo uploaded successfully: ${captureId}`);
    
    return successResponse(res, {
      captureId,
      imageUrl: result.imageUrl,
      message: 'Photo uploaded to Firebase IoT successfully',
    }, 201);
    
  } catch (error: any) {
    logger.error('❌ Upload mobile photo error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

/**
 * Analyze IoT image with AI
 * POST /api/iot/analyze
 * Body: { imageUrl, imageBase64?, captureId, gps?, sensors? }
 * Note: imageBase64 is preferred to avoid Firebase CORS issues
 */
export const analyzeIoTImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { imageUrl, imageBase64, captureId, gps, sensors } = req.body;
    
    if (!imageUrl && !imageBase64) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Image URL or base64 is required', 400);
    }
    
    logger.info(`🔬 Analyzing IoT image:`, {
      userId,
      captureId,
      hasImageUrl: !!imageUrl,
      hasImageBase64: !!imageBase64,
      imageBase64Length: imageBase64?.length,
      hasGps: !!gps,
      hasSensors: !!sensors,
      sensors: sensors, // ✨ Log actual sensor data
    });
    
    // Call AI service for real prediction
    let aiPrediction = null;
    try {
      logger.info(`🤖 Calling AI service for IoT image...`);
      const aiStart = Date.now();
      
      // Use base64 if provided (preferred), otherwise try URL
      if (imageBase64) {
        logger.info(`📦 Processing image from base64 (${(imageBase64.length / 1024).toFixed(1)} KB)`);
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        aiPrediction = await AIService.predictFromBuffer(imageBuffer, 'iot-image.jpg');
      } else {
        logger.info(`🔗 Processing image from URL`);
        aiPrediction = await AIService.predictFromUrl(imageUrl);
      }
      
      const aiDuration = Date.now() - aiStart;
      logger.info(`✅ AI Prediction completed in ${(aiDuration / 1000).toFixed(1)}s:`, {
        class: aiPrediction.class,
        classVi: aiPrediction.classVi,
        confidence: aiPrediction.confidence.toFixed(2) + '%',
      });
    } catch (error: any) {
      logger.error(`❌ AI prediction failed for IoT image:`, {
        captureId,
        error: error.message,
      });
      // Return error - don't use mock data
      return errorResponse(res, 'AI_ERROR', `AI prediction failed: ${error.message}`, 500);
    }
    
    // Generate treatment recommendation based on disease
    const getTreatment = (diseaseClass: string): string => {
      const treatments: Record<string, string> = {
        blast: 'Sử dụng thuốc diệt nấm Tricyclazole 75% WP (20g/16 lít nước), phun 2-3 lần cách nhau 7-10 ngày. Tăng cường phân kali để tăng sức đề kháng.',
        bacterial_leaf_blight: 'Sử dụng thuốc kháng sinh Streptomycin sulfate (1-2g/16 lít nước), phun 2-3 lần cách nhau 5-7 ngày. Cải thiện thoát nước ruộng.',
        brown_spot: 'Sử dụng thuốc diệt nấm Mancozeb 80% WP (40g/16 lít nước), phun 2-3 lần cách nhau 7 ngày. Bón phân cân đối NPK.',
        healthy: 'Cây lúa khỏe mạnh! Tiếp tục chăm sóc theo quy trình thường xuyên và theo dõi định kỳ.',
      };
      return treatments[diseaseClass] || 'Vui lòng tham khảo chuyên gia để có phương án điều trị phù hợp.';
    };
    
    // Determine severity
    const getSeverity = (confidence: number): 'low' | 'medium' | 'high' => {
      if (confidence >= 90) return 'high';
      if (confidence >= 70) return 'medium';
      return 'low';
    };
    
    // Get user's active IoT connection to link photo to field
    const iotConnection = await IoTConnection.findOne({ 
      userId, 
      status: 'active' 
    }).populate('fieldId');
    
    // Extract fieldId string (populated object has _id)
    const fieldIdString = iotConnection?.fieldId 
      ? (typeof iotConnection.fieldId === 'object' 
          ? String((iotConnection.fieldId as any)._id) 
          : String(iotConnection.fieldId))
      : null;
    
    logger.info(`🔗 IoT Connection found:`, {
      hasConnection: !!iotConnection,
      deviceId: iotConnection?.deviceId,
      fieldIdRaw: iotConnection?.fieldId,
      fieldIdString,
      fieldIdType: typeof iotConnection?.fieldId,
    });
    
    // Generate treatment data
    logger.info(`🏥 Generating treatment data...`);
    const treatmentData = generateTreatmentData(
      {
        class: aiPrediction.class,
        classVi: aiPrediction.classVi,
        confidence: aiPrediction.confidence,
      },
      sensors
    );
    
    // Save to MongoDB Photos collection
    logger.info(`💾 Saving IoT analysis to MongoDB...`);
    
    const photo = new Photo({
      userId,
      fieldId: fieldIdString, // Link to field (as string)
      source: 'iot', // ✅ Top-level field, not in metadata
      originalUrl: imageUrl,
      watermarkedUrl: imageUrl, // No watermark for IoT images
      thumbnailUrl: imageUrl, // Use same URL for thumbnail
      status: 'completed',
      fileSize: 0, // Not applicable for IoT images
      prediction: {
        class: aiPrediction.class,
        classVi: aiPrediction.classVi,
        confidence: aiPrediction.confidence,
        allPredictions: aiPrediction.allPredictions,
      },
      metadata: {
        lat: gps?.lat || 0,
        lng: gps?.lng || 0,
        timestamp: Date.now(),
        device: captureId || 'IoT Device',
        orientation: 'landscape',
        address: 'IoT Field',
      },
      // ✅ IoT-specific metadata with sensors
      iotMetadata: {
        deviceId: 'JETSON001', // TODO: Get from connection
        fieldId: fieldIdString,
        captureId: captureId || '',
        firebaseUrl: imageUrl,
        sensors: {
          temp: sensors?.temperature || 0,
          humidity: sensors?.humidity || 0,
          ph: sensors?.ph || 0,
          soil: sensors?.soilMoisture || 0,
          lux: sensors?.lux || 0,
          wind: sensors?.windSpeed || 0,
        },
        sensorTimestamp: new Date().toISOString(),
      },
      treatmentData, // Add structured treatment data
    });
    
    await photo.save();
    
    logger.info(`✅ IoT image analyzed and saved to MongoDB:`, {
      photoId: photo._id,
      captureId,
      disease: aiPrediction.classVi,
      confidence: aiPrediction.confidence.toFixed(2) + '%',
      severity: getSeverity(aiPrediction.confidence),
      fieldId: fieldIdString,
      hasFieldId: !!fieldIdString,
      source: photo.source,
      hasIotMetadata: !!photo.iotMetadata,
      iotMetadataSensors: photo.iotMetadata?.sensors, // ✅ Log sensors from iotMetadata
    });
    
    // Return full photo data + analysis
    return successResponse(res, {
      photoId: photo._id,
      fieldId: fieldIdString, // Include fieldId for sending treatment to IoT (converted to string)
      captureId,
      imageUrl,
      disease: aiPrediction.classVi,
      diseaseEn: aiPrediction.class,
      confidence: aiPrediction.confidence,
      allPredictions: aiPrediction.allPredictions,
      severity: getSeverity(aiPrediction.confidence),
      treatment: getTreatment(aiPrediction.class),
      detectedAt: photo.createdAt,
      gps: gps || null,
      sensors: sensors || null,
    });
    
  } catch (error: any) {
    logger.error('❌ Analyze IoT image error:', error);
    return errorResponse(res, 'SERVER_ERROR', error.message, 500);
  }
};

