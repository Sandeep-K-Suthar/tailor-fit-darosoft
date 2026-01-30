import mongoose from 'mongoose';

const fabricSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Fabric name is required'],
        trim: true
    },
    category: {
        type: String,
        enum: ['cotton', 'wool', 'linen', 'silk', 'polyester', 'denim'],
        required: [true, 'Fabric category is required']
    },
    // PBR Texture Maps
    colorMapUrl: {
        type: String,
        required: [true, 'Color/diffuse map is required']
    },
    normalMapUrl: {
        type: String,
        default: null
    },
    roughnessMapUrl: {
        type: String,
        default: null
    },
    // Material Properties
    baseColor: {
        type: String,
        default: '#FFFFFF'
    },
    roughness: {
        type: Number,
        default: 0.8,
        min: 0,
        max: 1
    },
    metalness: {
        type: Number,
        default: 0.0,
        min: 0,
        max: 1
    },
    normalScale: {
        type: Number,
        default: 1.0,
        min: 0,
        max: 2
    },
    // Pricing
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price must be positive']
    },
    // Status
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
fabricSchema.index({ category: 1, isActive: 1 });

const Fabric = mongoose.model('Fabric', fabricSchema);

export default Fabric;
