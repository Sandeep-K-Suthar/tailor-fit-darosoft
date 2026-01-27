import mongoose from 'mongoose';
import Product from '../models/product.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedPants = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Remove existing product to ensure clean update
        await Product.deleteOne({ name: 'Classic Chinos' });

        const fabrics = [
            { id: 'fabric-navy-karels', dir: 'navy-blue+karels', name: 'Navy Blue Karels', color: 'Navy', hex: '#000080', img: 'navy-blue+karels+comfort-stretch.jpg' },
            { id: 'fabric-gray-sicilion', dir: 'iron-gray+sicilion', name: 'Iron Gray Sicilion', color: 'Gray', hex: '#4a4a4a', img: 'iron-gray+sicilion-grey+melange.jpg' },
            { id: 'fabric-black-sunders', dir: 'black+sunders', name: 'Black Sunders', color: 'Black', hex: '#000000', img: 'black+sunders+comfort-stretch.jpg' },
            { id: 'fabric-gray-blazies', dir: 'iron-gray+blazies', name: 'Iron Gray Blazies', color: 'Gray', hex: '#555555', img: 'iron-gray+blazies+comfort-stretch.jpg' },
            { id: 'fabric-navy-oberon', dir: 'navy-blue+oberon', name: 'Navy Blue Oberon', color: 'Navy', hex: '#000085', img: 'navy-blue+oberon+twill.jpg' },
        ];

        // Layer helper that returns BOTH front and back view paths
        const createFabricLayersByView = (frontTemplate, backTemplate) => {
            const layers = {};
            fabrics.forEach(f => {
                layers[f.id] = {
                    front: frontTemplate ? frontTemplate.replace('{{fabric}}', f.dir) : null,
                    back: backTemplate ? backTemplate.replace('{{fabric}}', f.dir) : null
                };
            });
            return layers;
        };

        // Simple front-only layer helper
        const createFabricLayers = (frontTemplate) => {
            const layers = {};
            fabrics.forEach(f => {
                layers[f.id] = frontTemplate.replace('{{fabric}}', f.dir);
            });
            return layers;
        };

        const pantData = {
            name: 'Classic Chinos',
            description: 'Premium custom tailored chinos with Italian fabrics.',
            category: 'pants',
            basePrice: 5500,
            images: {
                baseImage: '/pant-style-customization/Front/Fit/Normal Fit/navy-blue+karels/normal-fit.png',
                backImage: '/pant-style-customization/Back/Fit/Normal Fit/navy-blue+karels/long+normal-fit.png',
                thumbnailImage: '/pant-style-customization/Fabric/navy-blue+karels+comfort-stretch.jpg',
            },
            customizationOptions: {
                fabrics: fabrics.map((f, idx) => ({
                    id: f.id,
                    name: f.name,
                    priceModifier: 0,
                    imageUrl: `/pant-style-customization/Fabric/${f.img}`, // Set imageUrl for schema compatibility
                    image: `/pant-style-customization/Fabric/${f.img}`, // Set image for frontend compatibility
                    previewImage: `/pant-style-customization/Front/Fit/Normal Fit/${f.dir}/normal-fit.png`,
                    backPreviewImage: `/pant-style-customization/Back/Fit/Normal Fit/${f.dir}/long+normal-fit.png`,
                    color: f.color,
                    colors: [f.hex],
                    order: idx + 1,
                    isDefault: idx === 0
                })),
                optionGroups: [
                    {
                        id: 'fit',
                        label: 'Fit',
                        category: 'fit',
                        order: 1,
                        options: [
                            {
                                id: 'fit-normal',
                                name: 'Normal Fit',
                                isDefault: true,
                                layersByFabric: createFabricLayersByView(
                                    '/pant-style-customization/Front/Fit/Normal Fit/{{fabric}}/normal-fit.png',
                                    '/pant-style-customization/Back/Fit/Normal Fit/{{fabric}}/long+normal-fit.png'
                                )
                            },
                            {
                                id: 'fit-slim',
                                name: 'Slim Fit',
                                layersByFabric: createFabricLayersByView(
                                    '/pant-style-customization/Front/Fit/Slim Fit/{{fabric}}/slim-fit.png',
                                    '/pant-style-customization/Back/Fit/Slim Fit/{{fabric}}/long+slim-fit.png'
                                )
                            }
                        ]
                    },
                    {
                        id: 'waist', // Was 'belt', renamed to 'waist' to ensure uniqueness/visibility
                        label: 'Belt', // Explicitly label as 'Belt' for user clarty
                        category: 'waist',
                        order: 2,
                        options: [
                            {
                                id: 'belt-none',
                                name: 'No Belt',
                                isDefault: true,
                                previewImage: null
                            },
                            {
                                id: 'belt-angelo',
                                name: 'Angelo Belt',
                                priceModifier: 1500,
                                previewImage: null,
                                layersByView: {
                                    front: '/pant-style-customization/Front/Belt/Add/angelo-belts.png',
                                    back: '/pant-style-customization/Back/Belt/Add/angelo-belts.png'
                                }
                            },
                            {
                                id: 'belt-sansone',
                                name: 'Sansone Belt',
                                priceModifier: 1500,
                                previewImage: null,
                                layersByView: {
                                    front: '/pant-style-customization/Front/Belt/Add/sansone-belts.png',
                                    back: '/pant-style-customization/Back/Belt/Add/sansone-belts.png'
                                }
                            },
                            {
                                id: 'belt-vecellio',
                                name: 'Vecellio Belt',
                                priceModifier: 1500,
                                previewImage: null,
                                layersByView: {
                                    front: '/pant-style-customization/Front/Belt/Add/vecellio-belts.png',
                                    back: '/pant-style-customization/Back/Belt/Add/vecellio-belts.png'
                                }
                            }
                        ]
                    },
                    {
                        id: 'pleats',
                        label: 'Pleats',
                        category: 'pleats',
                        order: 3,
                        options: [
                            {
                                id: 'pleat-none',
                                name: 'No Pleats',
                                isDefault: true,
                                layersByFabric: createFabricLayers('/pant-style-customization/Front/Pleats/No Pleats/{{fabric}}/no-pleats.png')
                            },
                            {
                                id: 'pleat-single',
                                name: 'Single Pleat',
                                layersByFabric: createFabricLayers('/pant-style-customization/Front/Pleats/Pleats Single/{{fabric}}/pleats-single.png')
                            },
                            {
                                id: 'pleat-double',
                                name: 'Double Pleat',
                                layersByFabric: createFabricLayers('/pant-style-customization/Front/Pleats/Double Pleats/{{fabric}}/double-pleats.png')
                            }
                        ]
                    },
                    {
                        id: 'cuffs',
                        label: 'Cuffs',
                        category: 'cuffs',
                        order: 4,
                        options: [
                            {
                                id: 'cuff-none',
                                name: 'No Cuffs',
                                isDefault: true,
                                previewImage: null
                            },
                            {
                                id: 'cuff-yes',
                                name: 'Turn Up',
                                priceModifier: 300,
                                layersByFabric: createFabricLayers('/pant-style-customization/Front/Cuffs/Length/Long/With Pant Cuffs/{{fabric}}/cuffs.png')
                            }
                        ]
                    },
                    {
                        id: 'fastening',
                        label: 'Fastening',
                        category: 'fastening',
                        order: 5,
                        options: [
                            {
                                id: 'fasten-centered',
                                name: 'Centered Button',
                                isDefault: true,
                                layersByFabric: createFabricLayers('/pant-style-customization/Front/Fastening/Centered/{{fabric}}/centered.png')
                            },
                            {
                                id: 'fasten-off-center',
                                name: 'Off-Centered',
                                layersByFabric: createFabricLayers('/pant-style-customization/Front/Fastening/Off Centered/{{fabric}}/off-centered.png')
                            },
                            {
                                id: 'fasten-off-center-buttonless',
                                name: 'Off-Centered Buttonless',
                                layersByFabric: createFabricLayers('/pant-style-customization/Front/Fastening/Off Centered Buttonless/{{fabric}}/off-centered-buttonless.png')
                            },
                            {
                                id: 'fasten-no-button',
                                name: 'No Button',
                                layersByFabric: createFabricLayers('/pant-style-customization/Front/Fastening/No Button/{{fabric}}/no-button.png')
                            }
                        ]
                    },
                    {
                        id: 'back-pockets',
                        label: 'Back Pockets',
                        category: 'back-pockets',
                        order: 6,
                        options: [
                            {
                                id: 'pocket-patched',
                                name: 'Patched',
                                isDefault: true,
                                layersByFabric: createFabricLayersByView(
                                    null,
                                    '/pant-style-customization/Back/Back Pockets/Patched/{{fabric}}/patched.png'
                                )
                            },
                            {
                                id: 'pocket-flap',
                                name: 'Flap Pocket',
                                layersByFabric: createFabricLayersByView(
                                    null,
                                    '/pant-style-customization/Back/Back Pockets/Flap Pockets/{{fabric}}/flap-pockets.png'
                                )
                            },
                            {
                                id: 'pocket-double-welted',
                                name: 'Double Welted',
                                layersByFabric: createFabricLayersByView(
                                    null,
                                    '/pant-style-customization/Back/Back Pockets/Double Welted Pocket with Button/{{fabric}}/double-welted-pocket-with-button.png'
                                )
                            },
                            {
                                id: 'pocket-patched-x2',
                                name: 'Patched x2',
                                layersByFabric: createFabricLayersByView(
                                    null,
                                    '/pant-style-customization/Back/Back Pockets/Patched x2/{{fabric}}/patched-x2.png'
                                )
                            },
                            {
                                id: 'pocket-flap-x2',
                                name: 'Flap Pocket x2',
                                layersByFabric: createFabricLayersByView(
                                    null,
                                    '/pant-style-customization/Back/Back Pockets/Flap Pockets x2/{{fabric}}/flap-pockets-x2.png'
                                )
                            },
                            {
                                id: 'pocket-double-welted-x2',
                                name: 'Double Welted x2',
                                layersByFabric: createFabricLayersByView(
                                    null,
                                    '/pant-style-customization/Back/Back Pockets/Double Welted Pocket with Button x2/{{fabric}}/double-welted-pocket-with-button-x2.png'
                                )
                            },
                            {
                                id: 'pocket-none',
                                name: 'No Pockets',
                                previewImage: null
                            }
                        ]
                    }
                ]
            }
        };

        const pant = new Product(pantData);
        await pant.save();
        console.log('Classic Chinos created successfully!');

        process.exit();
    } catch (error) {
        console.error('Error seeding pants:', error);
        process.exit(1);
    }
};

seedPants();
