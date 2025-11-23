/**
 * Seed Script: Create 8 Expert Users
 * Run with: npx ts-node src/scripts/seedExperts.ts
 */
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { normalizePhone } from '../utils/phoneNormalizer';

dotenv.config();

const EXPERT_AVATAR_URL = 'https://res.cloudinary.com/doivrdij4/image/upload/v1762399947/image-removebg-preview_l9jhrc.png';

const experts = [
  {
    displayName: 'Tiến sĩ Nguyễn Văn A',
    phone: '+84123456789', // Changed format to match system (+84 format)
    password: 'Chuyengia1@123',
    expertise: 'Cây Nông nghiệp',
    avatar: EXPERT_AVATAR_URL,
  },
  {
    displayName: 'Tiến sĩ Nguyễn Văn B',
    phone: '+84123456788',
    password: 'Chuyengia1@123',
    expertise: 'Cây Nông nghiệp',
    avatar: EXPERT_AVATAR_URL,
  },
  {
    displayName: 'Tiến sĩ Nguyễn Văn C',
    phone: '+84123456787',
    password: 'Chuyengia1@123',
    expertise: 'Cây Nông nghiệp',
    avatar: EXPERT_AVATAR_URL,
  },
  {
    displayName: 'Tiến sĩ Nguyễn Văn D',
    phone: '+84123456786',
    password: 'Chuyengia1@123',
    expertise: 'Cây Nông nghiệp',
    avatar: EXPERT_AVATAR_URL,
  },
  {
    displayName: 'Tiến sĩ Nguyễn Công Tâm',
    phone: '+84123456785',
    password: 'Chuyengia1@123',
    expertise: 'Cây Nông nghiệp',
    avatar: EXPERT_AVATAR_URL,
  },
  {
    displayName: 'Tiến sĩ Nguyễn Công Tạo',
    phone: '+84123456784',
    password: 'Chuyengia1@123',
    expertise: 'Cây Nông nghiệp',
    avatar: EXPERT_AVATAR_URL,
  },
  {
    displayName: 'Tiến sĩ Nguyễn Hữu Tâm',
    phone: '+84123456783',
    password: 'Chuyengia1@123',
    expertise: 'Cây Nông nghiệp',
    avatar: EXPERT_AVATAR_URL,
  },
  {
    displayName: 'Tiến sĩ Nguyễn Quốc Việt',
    phone: '+84123456782',
    password: 'Chuyengia1@123',
    expertise: 'Cây Nông nghiệp',
    avatar: EXPERT_AVATAR_URL,
  },
   {
    displayName: 'Tiến sĩ Lê Minh Trung Hiếu',
    phone: '+84123456781',
    password: 'Chuyengia1@123',
    expertise: 'Cây Nông nghiệp',
    avatar: EXPERT_AVATAR_URL,
  },
  {
    displayName: 'Tiến sĩ Nguyễn Đại Phong',
    phone: '+84123456780', // Use a unique phone number
    password: 'Chuyengia1@123',
    expertise: 'Cây Nông nghiệp',
    avatar: EXPERT_AVATAR_URL,
  },
];

async function seedExperts() {
  try {
    console.log('🌱 Starting expert users seeding...\n');

    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doctorrice';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create each expert
    for (const expertData of experts) {
      // Normalize phone number (same as login flow)
      const normalizedPhone = normalizePhone(expertData.phone);
      
      // Check if user already exists
      const existingUser = await User.findOne({ phone: normalizedPhone });
      
      if (existingUser) {
        console.log(`⚠️  User already exists: ${expertData.displayName} (${normalizedPhone})`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(expertData.password, 12);

      // Create expert user with normalized phone
      const expert = await User.create({
        displayName: expertData.displayName,
        phone: normalizedPhone, // Use normalized phone
        passwordHash,
        expertise: expertData.expertise,
        avatar: expertData.avatar,
        roles: ['expert'],
        isPhoneVerified: true,
        isEmailVerified: false,
      });

      console.log(`✅ Created expert: ${expert.displayName} (${expertData.phone} → ${normalizedPhone})`);
    }

    console.log('\n✨ Expert seeding completed!\n');
    console.log('📋 Expert Users Summary:');
    console.log('========================');
    experts.forEach((exp, idx) => {
      console.log(`${idx + 1}. ${exp.displayName}`);
      console.log(`   📞 Phone: ${exp.phone}`);
      console.log(`   🔑 Password: ${exp.password}`);
      console.log(`   🎓 Expertise: ${exp.expertise}\n`);
    });

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run seeding
seedExperts();
