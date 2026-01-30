
const BASE_PATH = '/shirt-style-customization';

// Fabric color IDs
const FABRIC_COLORS = ['white', 'champagne', 'cobalt-blue', 'deep-blue', 'light-blue'];

// Correct filenames for Fabric Swatches
const FABRIC_IMAGES = {
    'white': 'mayfield+cotton+year-round.jpg',
    'champagne': 'bertram+cotton+year-round.jpg',
    'cobalt-blue': 'declan+cotton+cobalt.jpg',
    'deep-blue': 'bort+year-round.jpg',
    'light-blue': 'cranbins+oxford+cotton.jpg'
};

// Helper to create fabric preview images mapping
const createFabricPreviewImages = (category, filename) => {
    const mapping = {};
    FABRIC_COLORS.forEach(color => {
        // Sleeves Long now standardized to 'sleeves-long.png' (dash) across all colors (including champagne)
        // Sleeves Short uses 'sleeves_short.png' (underscore)
        mapping[`fabric-${color}`] = `${BASE_PATH}/Front/${category}/${color}/${filename}`;
    });
    return mapping;
};

// Helper to create back fabric preview images
const createBackFabricPreviewImages = (sleeveType) => {
    const mapping = {};
    // Back View Uses DASH for long, UNDERSCORE for short (Verified)
    const filename = sleeveType === 'long' ? 'sleeves-long.png' : 'sleeves_short.png';
    FABRIC_COLORS.forEach(color => {
        mapping[`fabric-${color}`] = `${BASE_PATH}/Back/${color}/${filename}`;
    });
    return mapping;
};

export const shirtStyleProduct = {
    name: 'Custom Tailored Shirt',
    description: 'Premium custom-tailored shirt with multiple fabric colors and customization options.',
    category: 'shirt',
    basePrice: 8500,
    images: {
        // Use mock-shirt.png for the product card view (Catalogue)
        baseImage: '/mock-shirt.png',
        backImage: `${BASE_PATH}/Back/white/sleeves-long.png`,
        thumbnailImage: '/mock-shirt.png'
    },
    customizationOptions: {
        fabrics: [
            {
                id: 'fabric-white',
                name: 'White',
                image: `${BASE_PATH}/Fabric/white/${FABRIC_IMAGES['white']}`, // Used by context?
                imageUrl: `${BASE_PATH}/Fabric/white/${FABRIC_IMAGES['white']}`,
                // Preview Image uses Sleeves Long (Dash)
                previewImage: `${BASE_PATH}/Front/Sleeves/white/sleeves-long.png`,
                priceModifier: 0,
                isDefault: true,
                order: 0,
                tags: ['classic', 'formal'],
                colors: ['#FFFFFF']
            },
            {
                id: 'fabric-champagne',
                name: 'Champagne',
                image: `${BASE_PATH}/Fabric/champagne/${FABRIC_IMAGES['champagne']}`,
                imageUrl: `${BASE_PATH}/Fabric/champagne/${FABRIC_IMAGES['champagne']}`,
                previewImage: `${BASE_PATH}/Front/Sleeves/champagne/sleeves-long.png`,
                priceModifier: 200,
                order: 1,
                tags: ['elegant', 'formal'],
                colors: ['#F7E7CE']
            },
            {
                id: 'fabric-cobalt-blue',
                name: 'Cobalt Blue',
                image: `${BASE_PATH}/Fabric/cobalt-blue/${FABRIC_IMAGES['cobalt-blue']}`,
                imageUrl: `${BASE_PATH}/Fabric/cobalt-blue/${FABRIC_IMAGES['cobalt-blue']}`,
                previewImage: `${BASE_PATH}/Front/Sleeves/cobalt-blue/sleeves-long.png`,
                priceModifier: 300,
                order: 2,
                tags: ['bold', 'business'],
                colors: ['#0047AB']
            },
            {
                id: 'fabric-deep-blue',
                name: 'Deep Blue',
                image: `${BASE_PATH}/Fabric/deep-blue/${FABRIC_IMAGES['deep-blue']}`,
                imageUrl: `${BASE_PATH}/Fabric/deep-blue/${FABRIC_IMAGES['deep-blue']}`,
                previewImage: `${BASE_PATH}/Front/Sleeves/deep-blue/sleeves-long.png`,
                priceModifier: 300,
                order: 3,
                tags: ['formal', 'business'],
                colors: ['#00008B']
            },
            {
                id: 'fabric-light-blue',
                name: 'Light Blue',
                image: `${BASE_PATH}/Fabric/light-blue/${FABRIC_IMAGES['light-blue']}`,
                imageUrl: `${BASE_PATH}/Fabric/light-blue/${FABRIC_IMAGES['light-blue']}`,
                previewImage: `${BASE_PATH}/Front/Sleeves/light-blue/sleeves-long.png`,
                priceModifier: 200,
                order: 4,
                tags: ['classic', 'business'],
                colors: ['#ADD8E6']
            }
        ],
        optionGroups: [
            // SLEEVES
            {
                id: 'shirt-sleeves',
                label: 'Sleeves',
                category: 'sleeve',
                order: 0,
                zIndex: 10,
                options: [
                    {
                        id: 'sleeve-long',
                        name: 'Full Sleeves',
                        category: 'sleeve',
                        // Front uses DASH for long (Standardized)
                        image: `${BASE_PATH}/Front/Sleeves/white/sleeves-long.png`,
                        previewImage: `${BASE_PATH}/Front/Sleeves/white/sleeves-long.png`,
                        fabricPreviewImages: createFabricPreviewImages('Sleeves', 'sleeves-long.png'),
                        priceModifier: 0,
                        isDefault: true,
                        order: 0,
                        zIndex: 10,
                        description: 'Full length sleeves'
                    },
                    {
                        id: 'sleeve-short',
                        name: 'Half Sleeves',
                        category: 'sleeve',
                        image: `${BASE_PATH}/Front/Sleeves/white/sleeves_short.png`,
                        previewImage: `${BASE_PATH}/Front/Sleeves/white/sleeves_short.png`,
                        fabricPreviewImages: createFabricPreviewImages('Sleeves', 'sleeves_short.png'),
                        priceModifier: -500,
                        order: 1,
                        zIndex: 10,
                        description: 'Half length sleeves for casual wear'
                    }
                ]
            },
            // COLLAR STYLES
            {
                id: 'shirt-collar',
                label: 'Collar',
                category: 'collar',
                order: 1,
                zIndex: 140,
                options: [
                    {
                        id: 'collar-button-down',
                        name: 'Button Down',
                        category: 'collar',
                        image: `${BASE_PATH}/Front/Collar/white/button-down.png`,
                        previewImage: `${BASE_PATH}/Front/Collar/white/button-down.png`,
                        fabricPreviewImages: createFabricPreviewImages('Collar', 'button-down.png'),
                        priceModifier: 0,
                        isDefault: true,
                        order: 0,
                        zIndex: 140,
                        description: 'Classic button down collar'
                    },
                    {
                        id: 'collar-knet',
                        name: 'Knet Collar',
                        category: 'collar',
                        image: `${BASE_PATH}/Front/Collar/white/knet-collar.png`,
                        previewImage: `${BASE_PATH}/Front/Collar/white/knet-collar.png`,
                        fabricPreviewImages: createFabricPreviewImages('Collar', 'knet-collar.png'),
                        priceModifier: 200,
                        order: 1,
                        zIndex: 140,
                        description: 'Modern knet collar style'
                    },
                    {
                        id: 'collar-new-knet',
                        name: 'New Knet Collar',
                        category: 'collar',
                        // Renamed white/new-knet-collar.png to new-knet.png to match others
                        image: `${BASE_PATH}/Front/Collar/white/new-knet.png`,
                        previewImage: `${BASE_PATH}/Front/Collar/white/new-knet.png`,
                        fabricPreviewImages: createFabricPreviewImages('Collar', 'new-knet.png'),
                        priceModifier: 250,
                        order: 2,
                        zIndex: 140,
                        description: 'Updated knet collar design'
                    },
                    {
                        id: 'collar-rounded',
                        name: 'Rounded Collar',
                        category: 'collar',
                        image: `${BASE_PATH}/Front/Collar/white/rounded-collar.png`,
                        previewImage: `${BASE_PATH}/Front/Collar/white/rounded-collar.png`,
                        fabricPreviewImages: createFabricPreviewImages('Collar', 'rounded-collar.png'),
                        priceModifier: 150,
                        order: 3,
                        zIndex: 140,
                        description: 'Soft rounded collar'
                    },
                    {
                        id: 'collar-stand-up',
                        name: 'Stand Up Collar',
                        category: 'collar',
                        image: `${BASE_PATH}/Front/Collar/white/stand-up-collar.png`,
                        previewImage: `${BASE_PATH}/Front/Collar/white/stand-up-collar.png`,
                        fabricPreviewImages: createFabricPreviewImages('Collar', 'stand-up-collar.png'),
                        priceModifier: 300,
                        order: 4,
                        zIndex: 140,
                        description: 'Modern stand-up collar'
                    },
                    {
                        id: 'collar-wing',
                        name: 'Wing Collar',
                        category: 'collar',
                        image: `${BASE_PATH}/Front/Collar/white/wing-collar.png`,
                        previewImage: `${BASE_PATH}/Front/Collar/white/wing-collar.png`,
                        fabricPreviewImages: createFabricPreviewImages('Collar', 'wing-collar.png'),
                        priceModifier: 350,
                        order: 5,
                        zIndex: 140,
                        description: 'Formal wing collar for special occasions'
                    }
                ]
            },
            // CUFF STYLES (Confirmed filenames match)
            {
                id: 'shirt-cuffs',
                label: 'Cuffs',
                category: 'cuff',
                order: 2,
                zIndex: 130,
                options: [
                    {
                        id: 'cuff-double-squared',
                        name: 'Double Squared',
                        category: 'cuff',
                        image: `${BASE_PATH}/Front/Cuffs/white/double-squared.png`,
                        previewImage: `${BASE_PATH}/Front/Cuffs/white/double-squared.png`,
                        fabricPreviewImages: createFabricPreviewImages('Cuffs', 'double-squared.png'),
                        priceModifier: 0,
                        isDefault: true,
                        order: 0,
                        zIndex: 130,
                        description: 'Double squared cuff design'
                    },
                    {
                        id: 'cuff-rounded-one-button',
                        name: 'Rounded One Button',
                        category: 'cuff',
                        image: `${BASE_PATH}/Front/Cuffs/white/rounded-one-button.png`,
                        previewImage: `${BASE_PATH}/Front/Cuffs/white/rounded-one-button.png`,
                        fabricPreviewImages: createFabricPreviewImages('Cuffs', 'rounded-one-button.png'),
                        priceModifier: 100,
                        order: 1,
                        zIndex: 130,
                        description: 'Rounded cuff with single button'
                    },
                    {
                        id: 'cuff-single-one-button',
                        name: 'Single Cuff One Button',
                        category: 'cuff',
                        image: `${BASE_PATH}/Front/Cuffs/white/single-cuff-one-button.png`,
                        previewImage: `${BASE_PATH}/Front/Cuffs/white/single-cuff-one-button.png`,
                        fabricPreviewImages: createFabricPreviewImages('Cuffs', 'single-cuff-one-button.png'),
                        priceModifier: 50,
                        order: 2,
                        zIndex: 130,
                        description: 'Single cuff with one button'
                    },
                    {
                        id: 'cuff-single-two-buttons',
                        name: 'Single Cuff Two Buttons',
                        category: 'cuff',
                        image: `${BASE_PATH}/Front/Cuffs/white/single-cuff-two-buttons.png`,
                        previewImage: `${BASE_PATH}/Front/Cuffs/white/single-cuff-two-buttons.png`,
                        fabricPreviewImages: createFabricPreviewImages('Cuffs', 'single-cuff-two-buttons.png'),
                        priceModifier: 100,
                        order: 3,
                        zIndex: 130,
                        description: 'Single cuff with two buttons'
                    },
                    {
                        id: 'cuff-two-button-cut',
                        name: 'Two Button Cut',
                        category: 'cuff',
                        image: `${BASE_PATH}/Front/Cuffs/white/two-button-cut.png`,
                        previewImage: `${BASE_PATH}/Front/Cuffs/white/two-button-cut.png`,
                        fabricPreviewImages: createFabricPreviewImages('Cuffs', 'two-button-cut.png'),
                        priceModifier: 150,
                        order: 4,
                        zIndex: 130,
                        description: 'Two button cut style cuff'
                    }
                ]
            },
            // CHEST POCKET
            {
                id: 'shirt-chestpocket',
                label: 'Chest Pocket',
                category: 'pocket',
                order: 3,
                zIndex: 145,
                options: [
                    {
                        id: 'pocket-none',
                        name: 'No Pocket',
                        category: 'pocket',
                        image: null,
                        previewImage: null,
                        priceModifier: 0,
                        isDefault: true,
                        order: 0,
                        zIndex: 145,
                        description: 'Clean front without pocket'
                    },
                    {
                        id: 'pocket-standard',
                        name: 'Standard Pocket',
                        category: 'pocket',
                        image: `${BASE_PATH}/Front/Chestpocket/white/standard.png`,
                        previewImage: `${BASE_PATH}/Front/Chestpocket/white/standard.png`,
                        fabricPreviewImages: createFabricPreviewImages('Chestpocket', 'standard.png'),
                        priceModifier: 200,
                        order: 1,
                        zIndex: 145,
                        description: 'Standard chest pocket'
                    }
                ]
            },
            // BUTTONS
            {
                id: 'shirt-buttons',
                label: 'Buttons',
                category: 'button',
                order: 4,
                zIndex: 150,
                options: [
                    {
                        id: 'button-white',
                        name: 'White Buttons',
                        category: 'button',
                        image: `${BASE_PATH}/Front/Buttons/white.png`,
                        previewImage: `${BASE_PATH}/Front/Buttons/white.png`,
                        priceModifier: 0,
                        isDefault: true,
                        order: 0,
                        zIndex: 150,
                        description: 'Classic white buttons'
                    },
                    {
                        id: 'button-black',
                        name: 'Black Buttons',
                        category: 'button',
                        image: `${BASE_PATH}/Front/Buttons/black.png`,
                        previewImage: `${BASE_PATH}/Front/Buttons/black.png`,
                        priceModifier: 100,
                        order: 1,
                        zIndex: 150,
                        description: 'Sophisticated black buttons'
                    },
                    {
                        id: 'button-blue',
                        name: 'Blue Buttons',
                        category: 'button',
                        image: `${BASE_PATH}/Front/Buttons/blue.png`,
                        previewImage: `${BASE_PATH}/Front/Buttons/blue.png`,
                        priceModifier: 100,
                        order: 2,
                        zIndex: 150,
                        description: 'Elegant blue buttons'
                    },
                    {
                        id: 'button-red',
                        name: 'Red Buttons',
                        category: 'button',
                        image: `${BASE_PATH}/Front/Buttons/red.png`,
                        previewImage: `${BASE_PATH}/Front/Buttons/red.png`,
                        priceModifier: 100,
                        order: 3,
                        zIndex: 150,
                        description: 'Bold red buttons'
                    }
                ]
            },
            // NECKTIE
            {
                id: 'shirt-necktie',
                label: 'Necktie',
                category: 'necktie',
                order: 5,
                zIndex: 160,
                options: [
                    {
                        id: 'necktie-none',
                        name: 'No Necktie',
                        category: 'necktie',
                        image: null,
                        previewImage: null,
                        priceModifier: 0,
                        isDefault: true,
                        order: 0,
                        zIndex: 160,
                        description: 'No necktie'
                    },
                    {
                        id: 'necktie-lazio-kera',
                        name: 'Lazio Kera Tie',
                        category: 'necktie',
                        image: `${BASE_PATH}/Front/Necktie/lazio-kera-tie.png`,
                        previewImage: `${BASE_PATH}/Front/Necktie/lazio-kera-tie.png`,
                        priceModifier: 800,
                        order: 1,
                        zIndex: 160,
                        description: 'Elegant Lazio Kera pattern tie'
                    },
                    {
                        id: 'necktie-lazio-lisard',
                        name: 'Lazio Lisard Tie',
                        category: 'necktie',
                        image: `${BASE_PATH}/Front/Necktie/lazio-lisard-tie.png`,
                        previewImage: `${BASE_PATH}/Front/Necktie/lazio-lisard-tie.png`,
                        priceModifier: 850,
                        order: 2,
                        zIndex: 160,
                        description: 'Stylish Lazio Lisard pattern tie'
                    },
                    {
                        id: 'necktie-lazio-parma',
                        name: 'Lazio Parma Tie',
                        category: 'necktie',
                        image: `${BASE_PATH}/Front/Necktie/lazio-parma-tie.png`,
                        previewImage: `${BASE_PATH}/Front/Necktie/lazio-parma-tie.png`,
                        priceModifier: 900,
                        order: 3,
                        zIndex: 160,
                        description: 'Premium Lazio Parma pattern tie'
                    }
                ]
            },
            // BOWTIE
            {
                id: 'shirt-bowtie',
                label: 'Bowtie',
                category: 'bowtie',
                order: 6,
                zIndex: 165,
                options: [
                    {
                        id: 'bowtie-none',
                        name: 'No Bowtie',
                        category: 'bowtie',
                        image: null,
                        previewImage: null,
                        priceModifier: 0,
                        isDefault: true,
                        order: 0,
                        zIndex: 165,
                        description: 'No bowtie'
                    },
                    {
                        id: 'bowtie-essential-black',
                        name: 'Essential Black Bowtie',
                        category: 'bowtie',
                        image: `${BASE_PATH}/Front/Bowtie/essential-black-bowtie.png`,
                        previewImage: `${BASE_PATH}/Front/Bowtie/essential-black-bowtie.png`,
                        priceModifier: 600,
                        order: 1,
                        zIndex: 165,
                        description: 'Classic black bowtie'
                    },
                    {
                        id: 'bowtie-floral-print',
                        name: 'Floral Print Bowtie',
                        category: 'bowtie',
                        image: `${BASE_PATH}/Front/Bowtie/floral-print-bowtie.png`,
                        previewImage: `${BASE_PATH}/Front/Bowtie/floral-print-bowtie.png`,
                        priceModifier: 700,
                        order: 2,
                        zIndex: 165,
                        description: 'Floral pattern bowtie'
                    },
                    {
                        id: 'bowtie-robin-hood',
                        name: 'Robin Hood Bowtie',
                        category: 'bowtie',
                        image: `${BASE_PATH}/Front/Bowtie/robin-hood-bowtie.png`,
                        previewImage: `${BASE_PATH}/Front/Bowtie/robin-hood-bowtie.png`,
                        priceModifier: 650,
                        order: 3,
                        zIndex: 165,
                        description: 'Unique Robin Hood style bowtie'
                    }
                ]
            },
            // BACK STYLE
            {
                id: 'shirt-back',
                label: 'Back',
                category: 'back',
                order: 7,
                zIndex: 200,
                options: [
                    {
                        id: 'back-plain',
                        name: 'Plain Back',
                        category: 'back',
                        // Back uses Dash for Long
                        image: `${BASE_PATH}/Back/white/sleeves-long.png`,
                        previewImage: `${BASE_PATH}/Back/white/sleeves-long.png`,
                        layersByView: {
                            front: null,
                            back: `${BASE_PATH}/Back/white/sleeves-long.png`
                        },
                        backFullFabricPreviewImages: createBackFabricPreviewImages('long'),
                        backHalfFabricPreviewImages: createBackFabricPreviewImages('short'),
                        priceModifier: 0,
                        isDefault: true,
                        order: 0,
                        zIndex: 200,
                        description: 'Plain back design'
                    }
                ]
            }
        ]
    },
    isActive: true
};

// Z-Index reference for layer stacking
export const LAYER_ZINDEX = {
    sleeve: 10,
    cuff: 130,
    collar: 140,
    pocket: 145,
    button: 150,
    necktie: 160,
    bowtie: 165,
    back: 200
};

export default shirtStyleProduct;
