import Product from '../models/product.js';
import connectDB from '../config/db.js';
import dotenv from 'dotenv';
import { shirtStyleProduct } from './shirtStyleSeed.js';

dotenv.config();

const sampleProducts = [
  shirtStyleProduct
];

const seedProducts = async () => {
  try {
    await connectDB();

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Seeded ${products.length} products with advanced customization options (Shirt Style Only)`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed function
seedProducts();

export default seedProducts;
