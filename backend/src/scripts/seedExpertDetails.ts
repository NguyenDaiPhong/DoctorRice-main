/**
 * Seed expert details: education và detailed work history
 * Usage: npm run seed:expert-details
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User';

dotenv.config();

const expertDetailsData = [
  {
    displayName: 'Nguyễn Văn A',
    education: 'Tiến sĩ Khoa học Cây trồng - Đại học Nông Lâm TP.HCM (2015)',
    detailedWorkHistory: [
      {
        position: 'Giảng viên cao cấp',
        organization: 'Khoa Nông học - Đại học Nông Lâm TP.HCM',
        period: '2015 - Hiện tại',
        description: 'Giảng dạy và nghiên cứu về cây lúa, phát triển các giống lúa bền vững với sâu bệnh và biến đổi khí hậu.',
      },
      {
        position: 'Chuyên gia tư vấn',
        organization: 'Viện Nghiên cứu Lúa Quốc tế (IRRI)',
        period: '2012 - 2015',
        description: 'Tham gia các dự án nghiên cứu phát triển giống lúa chất lượng cao cho khu vực Đồng bằng Sông Cửu Long.',
      },
      {
        position: 'Nghiên cứu viên',
        organization: 'Viện Lúa Đồng bằng Sông Cửu Long',
        period: '2008 - 2012',
        description: 'Nghiên cứu và phát triển các kỹ thuật canh tác lúa bền vững, giảm phát thải khí nhà kính.',
      },
    ],
  },
  {
    displayName: 'Nguyễn Văn B',
    education: 'Tiến sĩ Bảo vệ Thực vật - Đại học Cần Thơ (2018)',
    detailedWorkHistory: [
      {
        position: 'Trưởng phòng Bảo vệ thực vật',
        organization: 'Chi cục Trồng trọt và Bảo vệ thực vật TP.HCM',
        period: '2018 - Hiện tại',
        description: 'Quản lý và triển khai các chương trình phòng trừ sâu bệnh hại cho cây trồng trên địa bàn thành phố.',
      },
      {
        position: 'Chuyên viên Bảo vệ thực vật',
        organization: 'Sở Nông nghiệp và Phát triển nông thôn TP.HCM',
        period: '2014 - 2018',
        description: 'Tư vấn cho nông dân về phương pháp phòng trừ dịch bệnh an toàn và hiệu quả.',
      },
    ],
  },
  {
    displayName: 'Nguyễn Văn C',
    education: 'Tiến sĩ Nông nghiệp Công nghệ cao - ĐH Tokyo (Nhật Bản) (2017)',
    detailedWorkHistory: [
      {
        position: 'Phó Giám đốc Nghiên cứu & Phát triển',
        organization: 'Công ty Công nghệ Nông nghiệp TTC',
        period: '2020 - Hiện tại',
        description: 'Phát triển và ứng dụng công nghệ AI, IoT vào sản xuất nông nghiệp thông minh.',
      },
      {
        position: 'Giảng viên kiêm nhiệm',
        organization: 'Đại học Bách Khoa TP.HCM',
        period: '2017 - Hiện tại',
        description: 'Giảng dạy các môn về Nông nghiệp thông minh, IoT trong nông nghiệp.',
      },
      {
        position: 'Nghiên cứu viên',
        organization: 'Đại học Tokyo - Lab công nghệ canh tác thông minh',
        period: '2014 - 2017',
        description: 'Nghiên cứu ứng dụng cảm biến và AI trong giám sát sức khỏe cây trồng.',
      },
    ],
  },
  {
    displayName: 'Nguyễn Văn D',
    education: 'Tiến sĩ Nông học - Đại học Nông nghiệp Hà Nội (2014)',
    detailedWorkHistory: [
      {
        position: 'Chuyên gia Dinh dưỡng cây trồng',
        organization: 'Viện Nghiên cứu Phân bón & Dinh dưỡng cây trồng',
        period: '2016 - Hiện tại',
        description: 'Tư vấn và hướng dẫn nông dân sử dụng phân bón hợp lý, tăng năng suất cây trồng bền vững.',
      },
      {
        position: 'Cán bộ khuyến nông',
        organization: 'Trung tâm Khuyến nông Quốc gia',
        period: '2010 - 2016',
        description: 'Triển khai các mô hình canh tác tiên tiến cho nông dân các tỉnh miền Bắc và miền Trung.',
      },
    ],
  },
  {
    displayName: 'Nguyễn Công Tâm',
    education: 'Tiến sĩ Khoa học Đất - Đại học Nông Lâm TP.HCM (2016)',
    detailedWorkHistory: [
      {
        position: 'Chuyên gia Quản lý Đất nông nghiệp',
        organization: 'Viện Nghiên cứu Nông nghiệp Miền Nam',
        period: '2016 - Hiện tại',
        description: 'Nghiên cứu cải tạo đất phèn, đất mặn cho canh tác nông nghiệp bền vững ở ĐBSCL.',
      },
      {
        position: 'Trợ lý nghiên cứu',
        organization: 'Dự án JICA - Quản lý đất bền vững Việt Nam',
        period: '2013 - 2016',
        description: 'Tham gia các khảo sát đánh giá chất lượng đất và đề xuất giải pháp cải thiện.',
      },
    ],
  },
  {
    displayName: 'Nguyễn Công Tạo',
    education: 'Tiến sĩ Công nghệ Sinh học - Đại học Quốc gia Hà Nội (2019)',
    detailedWorkHistory: [
      {
        position: 'Chuyên gia Sinh học Phân tử',
        organization: 'Viện Công nghệ Sinh học - Viện Hàn lâm KH&CN VN',
        period: '2019 - Hiện tại',
        description: 'Nghiên cứu và phát triển các giống cây trồng biến đổi gen kháng sâu bệnh và hạn hán.',
      },
      {
        position: 'Nghiên cứu viên',
        organization: 'Phòng thí nghiệm Sinh học Phân tử Thực vật',
        period: '2015 - 2019',
        description: 'Nghiên cứu cơ chế kháng bệnh ở cây lúa, phát triển marker sinh học cho chọn giống.',
      },
    ],
  },
  {
    displayName: 'Nguyễn Hữu Tâm',
    education: 'Tiến sĩ Kinh tế Nông nghiệp - Đại học Kinh tế TP.HCM (2017)',
    detailedWorkHistory: [
      {
        position: 'Chuyên gia Phát triển Nông thôn',
        organization: 'Ngân hàng Thế giới - Văn phòng Việt Nam',
        period: '2018 - Hiện tại',
        description: 'Tư vấn các dự án phát triển nông nghiệp bền vững, nâng cao thu nhập cho nông dân.',
      },
      {
        position: 'Giảng viên',
        organization: 'Khoa Kinh tế - Đại học Kinh tế TP.HCM',
        period: '2014 - 2018',
        description: 'Giảng dạy các môn Kinh tế nông nghiệp, Quản lý chuỗi giá trị nông sản.',
      },
    ],
  },
  {
    displayName: 'Nguyễn Quốc Việt',
    education: 'Tiến sĩ Khí tượng Nông nghiệp - Đại học Cornell (Hoa Kỳ) (2016)',
    detailedWorkHistory: [
      {
        position: 'Chuyên gia Biến đổi Khí hậu',
        organization: 'Trung tâm Nghiên cứu Biến đổi Khí hậu - Viện KH Khí tượng Thủy văn',
        period: '2016 - Hiện tại',
        description: 'Nghiên cứu tác động của biến đổi khí hậu đến nông nghiệp, xây dựng mô hình dự báo và cảnh báo.',
      },
      {
        position: 'Nghiên cứu viên sau tiến sĩ',
        organization: 'Đại học Cornell - Department of Earth and Atmospheric Sciences',
        period: '2014 - 2016',
        description: 'Nghiên cứu mô hình dự báo thời tiết cực đoan ảnh hưởng đến sản xuất nông nghiệp.',
      },
    ],
  },
  {
    displayName: 'Lê Minh Trung Hiếu',
    education: 'Tiến sĩ Khí tượng Nông nghiệp - Đại học Cornell (Hoa Kỳ) (2016)',
    detailedWorkHistory: [
      {
        position: 'Chuyên gia Biến đổi Khí hậu',
        organization: 'Trung tâm Nghiên cứu Biến đổi Khí hậu - Viện KH Khí tượng Thủy văn',
        period: '2016 - Hiện tại',
        description: 'Nghiên cứu tác động của biến đổi khí hậu đến nông nghiệp, xây dựng mô hình dự báo và cảnh báo.',
      },
      {
        position: 'Nghiên cứu viên sau tiến sĩ',
        organization: 'Đại học Cornell - Department of Earth and Atmospheric Sciences',
        period: '2014 - 2016',
        description: 'Nghiên cứu mô hình dự báo thời tiết cực đoan ảnh hưởng đến sản xuất nông nghiệp.',
      },
    ],
  },
    {
    displayName: 'Nguyễn Đại Phong',
    education: 'Tiến sĩ Khí tượng Nông nghiệp - Đại học Cornell (Hoa Kỳ) (2016)',
    detailedWorkHistory: [
      {
        position: 'Chuyên gia Biến đổi Khí hậu',
        organization: 'Trung tâm Nghiên cứu Biến đổi Khí hậu - Viện KH Khí tượng Thủy văn',
        period: '2016 - Hiện tại',
        description: 'Nghiên cứu tác động của biến đổi khí hậu đến nông nghiệp, xây dựng mô hình dự báo và cảnh báo.',
      },
      {
        position: 'Nghiên cứu viên sau tiến sĩ',
        organization: 'Đại học Cornell - Department of Earth and Atmospheric Sciences',
        period: '2014 - 2016',
        description: 'Nghiên cứu mô hình dự báo thời tiết cực đoan ảnh hưởng đến sản xuất nông nghiệp.',
      },
    ],
  },
];

async function seedExpertDetails() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/doctorrice';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all experts
    const experts = await User.find({ roles: 'expert' });
    console.log(`📋 Found ${experts.length} experts`);

    // Update each expert with matching data
    for (const expert of experts) {
      // Match by removing "Tiến sĩ" prefix if present
      const expertNameWithoutTitle = expert.displayName.replace(/^Tiến sĩ\s+/, '');
      
      const detailData = expertDetailsData.find(
        (data) => data.displayName === expertNameWithoutTitle || data.displayName === expert.displayName
      );

      if (detailData) {
        // Update displayName to remove "Tiến sĩ" prefix
        expert.displayName = detailData.displayName;
        expert.education = detailData.education;
        expert.detailedWorkHistory = detailData.detailedWorkHistory;
        await expert.save();
        console.log(`✅ Updated expert: ${expert.displayName}`);
      } else {
        console.log(`⚠️  No detail data found for expert: ${expert.displayName}`);
      }
    }

    console.log('🎉 Expert details seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding expert details:', error);
    process.exit(1);
  }
}

seedExpertDetails();
