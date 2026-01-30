import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Fabric from '../models/fabric.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure textures directory exists
const texturesDir = path.join(__dirname, '..', 'public', 'uploads', 'textures');
if (!fs.existsSync(texturesDir)) {
    fs.mkdirSync(texturesDir, { recursive: true });
}

// Configure multer for texture uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, texturesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `fabric-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET all fabrics
router.get('/', async (req, res) => {
    try {
        const fabrics = await Fabric.find({ isActive: true }).sort({ category: 1, name: 1 });
        res.json({ success: true, data: fabrics });
    } catch (error) {
        console.error('Error fetching fabrics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch fabrics' });
    }
});

// GET fabrics by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const validCategories = ['cotton', 'wool', 'linen', 'silk', 'polyester', 'denim'];

        if (!validCategories.includes(category)) {
            return res.status(400).json({ success: false, error: 'Invalid category' });
        }

        const fabrics = await Fabric.find({ category, isActive: true }).sort({ name: 1 });
        res.json({ success: true, data: fabrics });
    } catch (error) {
        console.error('Error fetching fabrics by category:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch fabrics' });
    }
});

// GET single fabric by ID
router.get('/:id', async (req, res) => {
    try {
        const fabric = await Fabric.findById(req.params.id);
        if (!fabric) {
            return res.status(404).json({ success: false, error: 'Fabric not found' });
        }
        res.json({ success: true, data: fabric });
    } catch (error) {
        console.error('Error fetching fabric:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch fabric' });
    }
});

// POST new fabric - accepts JSON with pre-uploaded texture paths
router.post('/', async (req, res) => {
    try {
        const {
            name,
            category,
            colorMapUrl,
            normalMapUrl,
            roughnessMapUrl,
            baseColor,
            price,
            roughness,
            metalness,
            normalScale
        } = req.body;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Fabric name is required' });
        }
        if (!colorMapUrl) {
            return res.status(400).json({ success: false, error: 'Color map texture is required' });
        }
        if (!category) {
            return res.status(400).json({ success: false, error: 'Category is required' });
        }

        const fabricData = {
            name: name.trim(),
            category,
            colorMapUrl,
            normalMapUrl: normalMapUrl || null,
            roughnessMapUrl: roughnessMapUrl || null,
            baseColor: baseColor || '#FFFFFF',
            price: Number(price) || 0,
            roughness: roughness !== undefined ? Number(roughness) : 0.8,
            metalness: metalness !== undefined ? Number(metalness) : 0.0,
            normalScale: normalScale !== undefined ? Number(normalScale) : 1.0
        };

        const fabric = new Fabric(fabricData);
        const savedFabric = await fabric.save();

        res.status(201).json({ success: true, data: savedFabric });
    } catch (error) {
        console.error('Error creating fabric:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// PUT update fabric
router.put('/:id', async (req, res) => {
    try {
        const {
            name,
            category,
            colorMapUrl,
            normalMapUrl,
            roughnessMapUrl,
            baseColor,
            price,
            roughness,
            metalness,
            normalScale,
            isActive
        } = req.body;

        const updateData = {};

        if (name) updateData.name = name.trim();
        if (category) updateData.category = category;
        if (colorMapUrl) updateData.colorMapUrl = colorMapUrl;
        if (normalMapUrl !== undefined) updateData.normalMapUrl = normalMapUrl || null;
        if (roughnessMapUrl !== undefined) updateData.roughnessMapUrl = roughnessMapUrl || null;
        if (baseColor) updateData.baseColor = baseColor;
        if (price !== undefined) updateData.price = Number(price);
        if (roughness !== undefined) updateData.roughness = Number(roughness);
        if (metalness !== undefined) updateData.metalness = Number(metalness);
        if (normalScale !== undefined) updateData.normalScale = Number(normalScale);
        if (isActive !== undefined) updateData.isActive = isActive;

        const fabric = await Fabric.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!fabric) {
            return res.status(404).json({ success: false, error: 'Fabric not found' });
        }

        res.json({ success: true, data: fabric });
    } catch (error) {
        console.error('Error updating fabric:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// DELETE fabric
router.delete('/:id', async (req, res) => {
    try {
        const fabric = await Fabric.findByIdAndDelete(req.params.id);

        if (!fabric) {
            return res.status(404).json({ success: false, error: 'Fabric not found' });
        }

        // Delete texture files
        const mapsToDelete = [fabric.textureUrl, fabric.colorMapUrl, fabric.normalMapUrl, fabric.roughnessMapUrl];
        mapsToDelete.forEach(url => {
            if (url) {
                const texturePath = path.join(__dirname, '..', 'public', url);
                fs.unlink(texturePath, () => { });
            }
        });

        res.json({ success: true, message: 'Fabric deleted successfully' });
    } catch (error) {
        console.error('Error deleting fabric:', error);
        res.status(500).json({ success: false, error: 'Failed to delete fabric' });
    }
});

export default router;
