import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'shirt',
      'suit',
      'pants',
      'jacket',
      'vest',
      'blazer',
      'jeans',
      'chinos',
      'tuxedo',
      'coat',
      'polo',
      'dress-shoes',
      'sneakers'
    ],
    default: 'shirt'
  },
  basePrice: {
    type: Number,
    required: true,
    default: 0
  },
  images: {
    baseImage: { type: String }, // Base product image (PNG)
    backImage: { type: String },
    thumbnailImage: { type: String },
    gallery: [{ type: String }],
    fabricImages: [{
      fabricId: String,
      imageUrl: String
    }]
  },
  customizationOptions: {
    fabrics: [{
      id: String,
      name: String,
      color: String,
      colors: [{ type: String }],
      pattern: String,
      imageUrl: String,
      previewImage: String,
      backPreviewImage: String,
      priceModifier: { type: Number, default: 0 },
      order: { type: Number, default: 0 },
      isDefault: { type: Boolean, default: false },
      tags: [{ type: String }],
      layersByFabric: { type: mongoose.Schema.Types.Mixed },
      layersByView: { type: mongoose.Schema.Types.Mixed }
    }],
    styles: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    optionGroups: [{
      id: String,
      label: String,
      category: String,
      order: { type: Number, default: 0 },
      options: [{
        id: String,
        name: String,
        category: String,
        image: String,
        previewImage: String,
        fabricPreviewImages: { type: mongoose.Schema.Types.Mixed },
        backHalfFabricPreviewImages: { type: mongoose.Schema.Types.Mixed },
        backFullFabricPreviewImages: { type: mongoose.Schema.Types.Mixed },
        priceModifier: { type: Number, default: 0 },
        order: { type: Number, default: 0 },
        isDefault: { type: Boolean, default: false },
        tags: [{ type: String }],
        layersByFabric: { type: mongoose.Schema.Types.Mixed },
        layersByView: { type: mongoose.Schema.Types.Mixed }
      }]
    }],
    colors: [{
      id: String,
      name: String,
      hexCode: String
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
