import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Fabric from '../models/fabric.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tailor-fit';

// All 12 fabrics with proper PBR texture maps
const fabrics = [
    // ============ FROM AMBIENTCG ============
    {
        name: 'Charcoal Tweed',
        category: 'wool',
        colorMapUrl: '/uploads/textures/Fabric083_2K-JPG_Color.jpg',
        normalMapUrl: '/uploads/textures/Fabric083_2K-JPG_NormalGL.jpg',
        roughnessMapUrl: '/uploads/textures/Fabric083_2K-JPG_Roughness.jpg',
        baseColor: '#4A4A4A',
        roughness: 0.85,
        metalness: 0.0,
        normalScale: 1.2,
        price: 8500
    },
    {
        name: 'Ivory Satin',
        category: 'silk',
        colorMapUrl: '/uploads/textures/Fabric081C_2K-JPG_Color.jpg',
        normalMapUrl: '/uploads/textures/Fabric081C_2K-JPG_NormalGL.jpg',
        roughnessMapUrl: '/uploads/textures/Fabric081C_2K-JPG_Roughness.jpg',
        baseColor: '#FFFFF0',
        roughness: 0.25,
        metalness: 0.15,
        normalScale: 0.8,
        price: 12000
    },
    {
        name: 'Natural Hemp',
        category: 'linen',
        colorMapUrl: '/uploads/textures/Fabric002_2K-JPG_Color.jpg',
        normalMapUrl: '/uploads/textures/Fabric002_2K-JPG_NormalGL.jpg',
        roughnessMapUrl: '/uploads/textures/Fabric002_2K-JPG_Roughness.jpg',
        baseColor: '#D2B48C',
        roughness: 0.95,
        metalness: 0.0,
        normalScale: 1.5,
        price: 5500
    },
    {
        name: 'White Cotton Oxford',
        category: 'cotton',
        colorMapUrl: '/uploads/textures/Fabric039_2K-JPG_Color.jpg',
        normalMapUrl: '/uploads/textures/Fabric039_2K-JPG_NormalGL.jpg',
        roughnessMapUrl: '/uploads/textures/Fabric039_2K-JPG_Roughness.jpg',
        baseColor: '#FFFFFF',
        roughness: 0.9,
        metalness: 0.0,
        normalScale: 1.0,
        price: 4500
    },

    // ============ FROM POLY HAVEN ============
    {
        name: 'Caban Wool',
        category: 'wool',
        colorMapUrl: '/uploads/textures/caban_diff_2k.jpg',
        normalMapUrl: '/uploads/textures/caban_nor_gl_2k.jpg',
        roughnessMapUrl: '/uploads/textures/caban_arm_2k.jpg',
        baseColor: '#2C3E50',
        roughness: 0.8,
        metalness: 0.0,
        normalScale: 1.3,
        price: 9000
    },
    {
        name: 'Soft Cotton Jersey',
        category: 'cotton',
        colorMapUrl: '/uploads/textures/cotton_jersey_diff_2k.jpg',
        normalMapUrl: '/uploads/textures/cotton_jersey_nor_gl_2k.jpg',
        roughnessMapUrl: '/uploads/textures/cotton_jersey_arm_2k.jpg',
        baseColor: '#E8E8E8',
        roughness: 0.85,
        metalness: 0.0,
        normalScale: 0.9,
        price: 4000
    },
    {
        name: 'Crepe Satin',
        category: 'silk',
        colorMapUrl: '/uploads/textures/crepe_satin_diff_2k.jpg',
        normalMapUrl: '/uploads/textures/crepe_satin_nor_gl_2k.jpg',
        roughnessMapUrl: '/uploads/textures/crepe_satin_arm_2k.jpg',
        baseColor: '#F5E6D3',
        roughness: 0.3,
        metalness: 0.2,
        normalScale: 0.7,
        price: 11000
    },
    {
        name: 'Classic Blue Denim',
        category: 'denim',
        colorMapUrl: '/uploads/textures/denim_fabric_06_diff_2k.jpg',
        normalMapUrl: '/uploads/textures/denim_fabric_06_nor_gl_2k.jpg',
        roughnessMapUrl: '/uploads/textures/denim_fabric_06_arm_2k.jpg',
        baseColor: '#3B5998',
        roughness: 0.85,
        metalness: 0.0,
        normalScale: 1.4,
        price: 3500
    },
    {
        name: 'Houndstooth Check',
        category: 'wool',
        colorMapUrl: '/uploads/textures/fabric_pattern_05_col_01_2k.jpg',
        normalMapUrl: '/uploads/textures/fabric_pattern_05_nor_gl_2k.jpg',
        roughnessMapUrl: '/uploads/textures/fabric_pattern_05_arm_2k.jpg',
        baseColor: '#1A1A1A',
        roughness: 0.75,
        metalness: 0.0,
        normalScale: 1.1,
        price: 9500
    },
    {
        name: 'Floral Jacquard',
        category: 'silk',
        colorMapUrl: '/uploads/textures/floral_jacquard_diff_2k.jpg',
        normalMapUrl: '/uploads/textures/floral_jacquard_nor_gl_2k.jpg',
        roughnessMapUrl: '/uploads/textures/floral_jacquard_arm_2k.jpg',
        baseColor: '#8B4513',
        roughness: 0.4,
        metalness: 0.1,
        normalScale: 1.0,
        price: 15000
    },
    {
        name: 'Gingham Check',
        category: 'cotton',
        colorMapUrl: '/uploads/textures/gingham_check_diff_2k.jpg',
        normalMapUrl: '/uploads/textures/gingham_check_nor_gl_2k.jpg',
        roughnessMapUrl: '/uploads/textures/gingham_check_arm_2k.jpg',
        baseColor: '#E74C3C',
        roughness: 0.88,
        metalness: 0.0,
        normalScale: 0.8,
        price: 4200
    },
    {
        name: 'Rough Linen',
        category: 'linen',
        colorMapUrl: '/uploads/textures/rough_linen_diff_2k.jpg',
        normalMapUrl: '/uploads/textures/rough_linen_nor_gl_2k.jpg',
        roughnessMapUrl: '/uploads/textures/rough_linen_arm_2k.jpg',
        baseColor: '#C4A484',
        roughness: 0.95,
        metalness: 0.0,
        normalScale: 1.6,
        price: 5800
    }
];

async function seedFabrics() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing fabrics
        console.log('🗑️  Clearing existing fabrics...');
        await Fabric.deleteMany({});

        // Insert all fabrics
        console.log('📦 Inserting 12 PBR fabrics...');
        const result = await Fabric.insertMany(fabrics);

        // Summary
        console.log('\n✅ Successfully seeded fabrics!');
        console.log('━'.repeat(40));

        const categories = {};
        result.forEach(fabric => {
            categories[fabric.category] = (categories[fabric.category] || 0) + 1;
        });

        console.log('📊 Fabrics by category:');
        Object.entries(categories).forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count}`);
        });

        console.log('━'.repeat(40));
        console.log(`📁 Total: ${result.length} fabrics`);
        console.log('\n🎨 Each fabric includes:');
        console.log('   • Color/Diffuse map');
        console.log('   • Normal map');
        console.log('   • Roughness/ARM map');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);
    }
}

seedFabrics();
