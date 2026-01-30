import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, useTexture, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Fabric3D, FabricCategory } from '@/types/fabric';
import { fetchFabrics, getTextureUrl } from '@/services/fabricService';
import { FABRIC_CATEGORIES } from '@/types/fabric';
import { useCart } from '@/context/CartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { ArrowLeft, Check, Scissors, ShoppingBag, Loader2, Sparkles, User, Bookmark, Box, LogOut, Save, ZoomIn, ZoomOut, Shirt, Layers, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Camera Controller - handles smooth zoom animation
function CameraController({ zoom }: { zoom: number }) {
    const { camera } = useThree();

    useFrame(() => {
        // Smoothly animate zoom
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, zoom, 0.1);
        // Look at center of model (slightly up)
        camera.lookAt(0, 0, 0);
    });

    return null;
}

// 3D Model Component - loads GLB model and applies fabric textures
interface Model3DProps {
    modelPath: string;
    colorMapUrl?: string;
    normalMapUrl?: string;
    roughnessMapUrl?: string;
    baseColor?: string;
    roughness?: number;
    metalness?: number;
    normalScale?: number;
    viewAngle: 'front' | 'back';
}

function Model3D({
    modelPath,
    colorMapUrl,
    normalMapUrl,
    roughnessMapUrl,
    baseColor = '#ffffff',
    roughness = 0.8,
    metalness = 0.0,
    normalScale = 1.0,
    viewAngle
}: Model3DProps) {
    const meshRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF(modelPath);
    // Front view = 0 rotation, Back view = Math.PI (180 degrees)
    const targetRotation = viewAngle === 'front' ? 0 : Math.PI;

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation, 0.1);
        }
    });

    const texturePaths = useMemo(() => {
        const paths: string[] = [];
        if (colorMapUrl) paths.push(colorMapUrl);
        if (normalMapUrl) paths.push(normalMapUrl);
        if (roughnessMapUrl) paths.push(roughnessMapUrl);
        return paths.length > 0 ? paths : ['/placeholder.svg'];
    }, [colorMapUrl, normalMapUrl, roughnessMapUrl]);

    const textures = useTexture(texturePaths);

    const textureData = useMemo(() => {
        const textureArray = Array.isArray(textures) ? textures : [textures];
        let idx = 0;
        const colorMap = colorMapUrl ? textureArray[idx++] : null;
        const normalMap = normalMapUrl ? textureArray[idx++] : null;
        const roughnessMap = roughnessMapUrl ? textureArray[idx++] : null;

        // Set correct color space for color map (sRGB for accurate colors)
        if (colorMap) {
            colorMap.colorSpace = THREE.SRGBColorSpace;
            colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
            colorMap.repeat.set(3, 3);
            colorMap.needsUpdate = true;
        }

        // Normal and roughness maps should stay in linear color space
        [normalMap, roughnessMap].forEach(tex => {
            if (tex) {
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(3, 3);
                tex.needsUpdate = true;
            }
        });

        return { colorMap, normalMap, roughnessMap };
    }, [textures, colorMapUrl, normalMapUrl, roughnessMapUrl]);

    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.material = new THREE.MeshStandardMaterial({
                    map: textureData.colorMap,
                    normalMap: textureData.normalMap,
                    roughnessMap: textureData.roughnessMap,
                    // Use white color when texture exists to show true texture colors
                    color: textureData.colorMap ? new THREE.Color('#ffffff') : new THREE.Color(baseColor),
                    roughness: textureData.roughnessMap ? 1.0 : roughness,
                    metalness: metalness,
                    normalScale: new THREE.Vector2(normalScale, normalScale),
                    side: THREE.DoubleSide,
                    // Reduce environment reflection for more accurate colors
                    envMapIntensity: 0.3
                });
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
        return clone;
    }, [scene, textureData, baseColor, roughness, metalness, normalScale]);

    // Debug: Log bounding box for the basic model
    useEffect(() => {
        console.log('=== BASIC MODEL3D DEBUG ===');
        const box = new THREE.Box3().setFromObject(scene);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        console.log('Model Path:', modelPath);
        console.log('Bounding Box Size:', size);
        console.log('Bounding Box Center:', center);
        console.log('Applied Scale: [3, 3, 3]');
        console.log('Applied Position: [0, -4, 0]');
        console.log('Texture URLs:', { colorMapUrl, normalMapUrl, roughnessMapUrl });
        console.log('=== END BASIC MODEL DEBUG ===');
    }, [scene, modelPath, colorMapUrl, normalMapUrl, roughnessMapUrl]);

    // 3d Preview Model Size and Position
    return (
        <group ref={meshRef} position={[0, -2.5, 0]}>
            <primitive object={clonedScene} scale={[3, 3, 3]} />
        </group>
    );
}

useGLTF.preload('/models/shirt.glb');

// Style options matching Blender mesh names
const COLLAR_OPTIONS = [
    { id: 'button-down', name: 'Button Down', meshName: 'Button_Down_Collar' },
    { id: 'knet', name: 'Kent Collar', meshName: 'Knet_Collar' },
    { id: 'new-knet', name: 'New Kent', meshName: 'New_Knet_Collar' },
    { id: 'rounded', name: 'Rounded', meshName: 'Rounded_Collar' },
    { id: 'stand-up', name: 'Stand Up', meshName: 'Stand_Up_Collar' },
    { id: 'wing', name: 'Wing Collar', meshName: 'Wing_Collar' },
];

const CUFF_OPTIONS = [
    { id: 'double-squared', name: 'Double Squared', meshName: 'Double_Squared_Cuff_Button' },
    { id: 'rounded-one', name: 'Rounded One Button', meshName: 'Rounded_One_Cuff_Button' },
    { id: 'single-one', name: 'Single One Button', meshName: 'Single_Cuff_One_Button' },
    { id: 'single-two', name: 'Single Two Buttons', meshName: 'Single_Cuff_Two_Buttons' },
    { id: 'two-button-cut', name: 'Two Button Cut', meshName: 'Two_Button_Cut_Cuff_Button' },
];

const POCKET_OPTIONS = [
    { id: 'none', name: 'No Pocket', meshName: 'Pocket_Inside' },
    { id: 'chest', name: 'Chest Pocket', meshName: 'Standard_Chest_Pocket' },
];

const BUTTON_COLORS = [
    { id: 'white', name: 'White', color: '#ffffff' },
    { id: 'black', name: 'Black', color: '#1a1a1a' },
    { id: 'blue', name: 'Blue', color: '#1e40af' },
    { id: 'red', name: 'Red', color: '#dc2626' },
];

// Modular 3D Model Component - loads modular GLB and toggles mesh visibility
interface ModularModel3DProps {
    colorMapUrl?: string;
    normalMapUrl?: string;
    roughnessMapUrl?: string;
    baseColor?: string;
    roughness?: number;
    metalness?: number;
    normalScale?: number;
    viewAngle: 'front' | 'back';
    selectedCollar: string;
    selectedCuff: string;
    selectedPocket: string;
    placketButtonColor: string;
    cuffButtonColor: string;
    // Independent fabric textures for parts
    collarColorMapUrl?: string;
    cuffColorMapUrl?: string;
    placketColorMapUrl?: string;
    pocketColorMapUrl?: string;
}

function ModularModel3D({
    colorMapUrl,
    normalMapUrl,
    roughnessMapUrl,
    baseColor = '#ffffff',
    roughness = 0.8,
    metalness = 0.0,
    normalScale = 1.0,
    viewAngle,
    selectedCollar,
    selectedCuff,
    selectedPocket,
    placketButtonColor,
    cuffButtonColor,
    collarColorMapUrl,
    cuffColorMapUrl,
    placketColorMapUrl,
    pocketColorMapUrl,
}: ModularModel3DProps) {
    const meshRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF('/models/shirt_modular_custom.glb');
    const targetRotation = viewAngle === 'front' ? 0 : Math.PI;

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation, 0.1);
        }
    });

    // Load textures
    const texturePaths = useMemo(() => {
        const paths: string[] = [];
        if (colorMapUrl) paths.push(colorMapUrl);
        if (normalMapUrl) paths.push(normalMapUrl);
        if (roughnessMapUrl) paths.push(roughnessMapUrl);
        return paths.length > 0 ? paths : ['/placeholder.svg'];
    }, [colorMapUrl, normalMapUrl, roughnessMapUrl]);

    const textures = useTexture(texturePaths);

    const textureData = useMemo(() => {
        const textureArray = Array.isArray(textures) ? textures : [textures];
        let idx = 0;
        const colorMap = colorMapUrl ? textureArray[idx++] : null;
        const normalMap = normalMapUrl ? textureArray[idx++] : null;
        const roughnessMap = roughnessMapUrl ? textureArray[idx++] : null;

        if (colorMap) {
            colorMap.colorSpace = THREE.SRGBColorSpace;
            colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
            colorMap.repeat.set(3, 3);
            colorMap.needsUpdate = true;
        }

        [normalMap, roughnessMap].forEach(tex => {
            if (tex) {
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(3, 3);
                tex.needsUpdate = true;
            }
        });

        return { colorMap, normalMap, roughnessMap };
    }, [textures, colorMapUrl, normalMapUrl, roughnessMapUrl]);

    // Find selected mesh names
    const selectedCollarMesh = COLLAR_OPTIONS.find(c => c.id === selectedCollar)?.meshName || '';
    const selectedCuffMesh = CUFF_OPTIONS.find(c => c.id === selectedCuff)?.meshName || '';
    const selectedPocketMesh = POCKET_OPTIONS.find(p => p.id === selectedPocket)?.meshName || '';

    // All collar mesh names for hiding
    const allCollarMeshes = COLLAR_OPTIONS.map(c => c.meshName);
    const allCuffMeshes = CUFF_OPTIONS.map(c => c.meshName);
    const allPocketMeshes = POCKET_OPTIONS.map(p => p.meshName);

    // Always visible parts - includes base shirt and MOD_ modular parts
    const alwaysVisible = [
        'Front_Back', 'Front_Placket', 'Front_Placket_Buttons', 'Full_Sleeves_Left', 'Full_Sleeves_Right',
        'Cuff_Buttons', "Men's_Shirt",
        // MOD_ modular parts should always be visible
        'MOD_Front_Back', 'MOD_Sleeves', 'MOD_Cuffs', 'MOD_Placket', 'MOD_Pocket', 'MOD_Collar'
    ];

    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const meshName = mesh.name;

                // Determine visibility based on mesh name
                let isVisible = true; // Default to visible

                // Always visible parts (base shirt)
                if (alwaysVisible.some(name => meshName.includes(name))) {
                    isVisible = true;
                }

                // Collar visibility
                if (allCollarMeshes.includes(meshName)) {
                    isVisible = meshName === selectedCollarMesh;
                }

                // Cuff visibility
                if (allCuffMeshes.includes(meshName)) {
                    isVisible = meshName === selectedCuffMesh;
                }

                // Pocket visibility
                if (allPocketMeshes.includes(meshName)) {
                    isVisible = meshName === selectedPocketMesh;
                }

                mesh.visible = isVisible;

                // Check material name - button materials in GLB are Material15595, Material15575, Material15577, Material15597
                const materialName = (mesh.material as THREE.Material)?.name || '';
                // Buttons use materials like Material15595.XXX (button/accent materials from Blender export)
                const isButtonMaterial = materialName.includes('Material15595') ||
                    materialName.includes('Material15575') ||
                    materialName.includes('Material15577') ||
                    materialName.includes('Material15597');

                // Check for specific part meshes using ACTUAL mesh names from GLB
                // Based on Blender structure:
                // MOD_Cuffs > Men's_Shirt.001 → Men's_Shirt001 (cuffs fabric)
                // MOD_Cuff_Buttons > Men's_Shirt.002 → Men's_Shirt002 (cuff buttons)
                // MOD_Sleeves_Full > Men's_Shirt.003 → Men's_Shirt003 (sleeves)
                const isCollarMesh = meshName.includes('MOD_Collar') ||
                    (meshName.toLowerCase().includes('collar') && !isButtonMaterial);

                // Cuff detection - Men's_Shirt001 is the cuffs mesh (MOD_Cuffs child)
                // Note: Men's_Shirt001_1 etc are button sub-meshes, so only match exact Men's_Shirt001
                const isCuffMesh = meshName.includes('MOD_Cuff') ||
                    meshName === "Men's_Shirt001" ||
                    allCuffMeshes.includes(meshName) ||
                    (meshName.toLowerCase().includes('cuff') && !meshName.includes('Sleeves') && !isButtonMaterial);

                // Sleeves detection - Men's_Shirt003 is MOD_Sleeves_Full child, or direct MOD_Sleeves match
                const isSleeveMesh = meshName.includes('MOD_Sleeves') ||
                    meshName === "Men's_Shirt003";

                // Placket detection - the front button panel
                const isPlacketMesh = meshName.includes('MOD_Placket') ||
                    meshName.includes('Front_Placket');

                // Pocket detection
                const isPocketMesh = meshName.includes('MOD_Pocket') ||
                    allPocketMeshes.includes(meshName) ||
                    (meshName.toLowerCase().includes('pocket') && !isButtonMaterial);

                // Button identification - CORRECTED based on visual position in 3D model:
                // Shirt006* meshes are visually on the FRONT of shirt (placket buttons)
                // Shirt001*, Shirt002* meshes are visually on the SLEEVES (cuff buttons)
                // Note: The mesh naming is opposite to what you'd expect!
                const isPlacketButtonMesh = isButtonMaterial &&
                    (meshName.includes('Shirt006') || meshName.toLowerCase().includes('placket_button'));
                const isCuffButtonMesh = isButtonMaterial && !isPlacketButtonMesh;

                // Debug: Log mesh and material detection - log ALL MOD_ meshes and anything with cuff
                if (isButtonMaterial || meshName.includes('MOD_') || meshName.includes('Placket') || meshName.toLowerCase().includes('cuff')) {
                    console.log(`[DEBUG] ${meshName}: mat="${materialName}", isButton=${isButtonMaterial}, isCuffBtn=${isCuffButtonMesh}, isPlacketBtn=${isPlacketButtonMesh}, isCollar=${isCollarMesh}, isCuff=${isCuffMesh}, isSleeve=${isSleeveMesh}, isPlacket=${isPlacketMesh}, isPocket=${isPocketMesh}`);
                }

                // Apply fabric material or button color
                if (isPlacketButtonMesh) {
                    // Placket button color - for buttons NOT on cuff meshes
                    console.log(`[DEBUG] Applying PLACKET button color ${placketButtonColor} to ${meshName}`);
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: new THREE.Color(placketButtonColor),
                        roughness: 0.3,
                        metalness: 0.1,
                        side: THREE.DoubleSide,
                        envMapIntensity: 0.5
                    });
                } else if (isCuffButtonMesh) {
                    // Cuff button color - for buttons on cuff meshes
                    console.log(`[DEBUG] Applying CUFF button color ${cuffButtonColor} to ${meshName}`);
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: new THREE.Color(cuffButtonColor),
                        roughness: 0.3,
                        metalness: 0.1,
                        side: THREE.DoubleSide,
                        envMapIntensity: 0.5
                    });
                } else if (isCollarMesh && collarColorMapUrl) {
                    // Custom collar fabric - use inline texture loading
                    const loader = new THREE.TextureLoader();
                    const collarTexture = loader.load(collarColorMapUrl);
                    collarTexture.colorSpace = THREE.SRGBColorSpace;
                    collarTexture.wrapS = collarTexture.wrapT = THREE.RepeatWrapping;
                    collarTexture.repeat.set(3, 3);
                    mesh.material = new THREE.MeshStandardMaterial({
                        map: collarTexture,
                        roughness: roughness,
                        metalness: metalness,
                        normalScale: new THREE.Vector2(normalScale, normalScale),
                        side: THREE.DoubleSide,
                        envMapIntensity: 0.3
                    });
                } else if (isCuffMesh && cuffColorMapUrl) {
                    // Custom cuff fabric - applies ONLY to MOD_Cuffs mesh
                    const loader = new THREE.TextureLoader();
                    const cuffTexture = loader.load(cuffColorMapUrl);
                    cuffTexture.colorSpace = THREE.SRGBColorSpace;
                    cuffTexture.wrapS = cuffTexture.wrapT = THREE.RepeatWrapping;
                    cuffTexture.repeat.set(3, 3);
                    mesh.material = new THREE.MeshStandardMaterial({
                        map: cuffTexture,
                        roughness: roughness,
                        metalness: metalness,
                        normalScale: new THREE.Vector2(normalScale, normalScale),
                        side: THREE.DoubleSide,
                        envMapIntensity: 0.3
                    });
                } else if (isPlacketMesh && placketColorMapUrl) {
                    // Custom placket fabric
                    const loader = new THREE.TextureLoader();
                    const placketTexture = loader.load(placketColorMapUrl);
                    placketTexture.colorSpace = THREE.SRGBColorSpace;
                    placketTexture.wrapS = placketTexture.wrapT = THREE.RepeatWrapping;
                    placketTexture.repeat.set(3, 3);
                    mesh.material = new THREE.MeshStandardMaterial({
                        map: placketTexture,
                        roughness: roughness,
                        metalness: metalness,
                        normalScale: new THREE.Vector2(normalScale, normalScale),
                        side: THREE.DoubleSide,
                        envMapIntensity: 0.3
                    });
                } else if (isPocketMesh && pocketColorMapUrl) {
                    // Custom pocket fabric
                    const loader = new THREE.TextureLoader();
                    const pocketTexture = loader.load(pocketColorMapUrl);
                    pocketTexture.colorSpace = THREE.SRGBColorSpace;
                    pocketTexture.wrapS = pocketTexture.wrapT = THREE.RepeatWrapping;
                    pocketTexture.repeat.set(3, 3);
                    mesh.material = new THREE.MeshStandardMaterial({
                        map: pocketTexture,
                        roughness: roughness,
                        metalness: metalness,
                        normalScale: new THREE.Vector2(normalScale, normalScale),
                        side: THREE.DoubleSide,
                        envMapIntensity: 0.3
                    });
                } else {
                    // Default fabric material for shirt parts
                    mesh.material = new THREE.MeshStandardMaterial({
                        map: textureData.colorMap,
                        normalMap: textureData.normalMap,
                        roughnessMap: textureData.roughnessMap,
                        color: textureData.colorMap ? new THREE.Color('#ffffff') : new THREE.Color(baseColor),
                        roughness: textureData.roughnessMap ? 1.0 : roughness,
                        metalness: metalness,
                        normalScale: new THREE.Vector2(normalScale, normalScale),
                        side: THREE.DoubleSide,
                        envMapIntensity: 0.3
                    });
                }

                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
        return clone;
    }, [scene, textureData, baseColor, roughness, metalness, normalScale, selectedCollarMesh, selectedCuffMesh, selectedPocketMesh, placketButtonColor, cuffButtonColor, collarColorMapUrl, cuffColorMapUrl, placketColorMapUrl, pocketColorMapUrl]);

    // Debug: Log ALL mesh names and material names on first load
    useEffect(() => {
        console.log('=== ALL MESHES IN MODULAR MODEL ===');
        const box = new THREE.Box3().setFromObject(scene);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        console.log('Bounding Box Size:', size);
        console.log('Bounding Box Center:', center);

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const matName = (mesh.material as THREE.Material)?.name || 'NO_MATERIAL';
                // Highlight any mesh with button-like or cuff-like names
                const highlight = mesh.name.toLowerCase().includes('button') || mesh.name.toLowerCase().includes('cuff') ? '⭐ ' : '';
                console.log(`${highlight}Mesh: "${mesh.name}" | Material: "${matName}" | Visible: ${mesh.visible}`);
            }
        });
        console.log('=== END OF MESH LIST ===');
    }, [scene]);

    // Model positioning based on actual bounding box:
    // Centered vertically
    return (
        <group ref={meshRef} position={[0, 0, 0]}>
            <primitive object={clonedScene} scale={[0.03, 0.03, 0.03]} />
        </group>
    );
}

useGLTF.preload('/models/shirt_modular_custom.glb');

// Props for reusable ShirtCanvas
interface ShirtCanvasProps {
    zoom: number;
    viewMode: 'front' | 'back';
    useModularModel: boolean;
    selectedFabric: Fabric3D | null;
    selectedCollar: string;
    selectedCuff: string;
    selectedPocket: string;
    placketButtonColor: string;
    cuffButtonColor: string;
    collarFabric: Fabric3D | null;
    cuffFabric: Fabric3D | null;
    placketFabric: Fabric3D | null;
    pocketFabric: Fabric3D | null;
    onZoomIn: () => void;
    onZoomOut: () => void;
}

function ShirtCanvas({
    zoom, viewMode, useModularModel, selectedFabric, selectedCollar, selectedCuff,
    selectedPocket, placketButtonColor, cuffButtonColor, collarFabric, cuffFabric,
    placketFabric, pocketFabric, onZoomIn, onZoomOut
}: ShirtCanvasProps) {
    return (
        <div className="flex-1 relative rounded-xl bg-primary/10 border border-primary/20 shadow-soft overflow-hidden h-full w-full">
            {/* Grid */}
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} style={{ height: '100%', width: '100%' }} gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }} shadows>
                {/* CameraController disabled to prevent jerkiness and conflict with OrbitControls */}
                {/* <CameraController zoom={zoom} /> */}
                <Suspense fallback={
                    <Html center>
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </Html>
                }>
                    <Environment files="/hdri/marry_hall_2k.hdr" background={false} />
                    <ambientLight intensity={0.3} />
                    <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />

                    {useModularModel ? (
                        <ModularModel3D
                            colorMapUrl={selectedFabric ? getTextureUrl(selectedFabric.colorMapUrl) : undefined}
                            normalMapUrl={selectedFabric ? getTextureUrl(selectedFabric.normalMapUrl) : undefined}
                            roughnessMapUrl={selectedFabric ? getTextureUrl(selectedFabric.roughnessMapUrl) : undefined}
                            baseColor={selectedFabric?.baseColor ?? '#ffffff'}
                            roughness={selectedFabric?.roughness ?? 0.8}
                            metalness={selectedFabric?.metalness ?? 0}
                            normalScale={selectedFabric?.normalScale ?? 1}
                            viewAngle={viewMode}
                            selectedCollar={selectedCollar}
                            selectedCuff={selectedCuff}
                            selectedPocket={selectedPocket}
                            placketButtonColor={placketButtonColor}
                            cuffButtonColor={cuffButtonColor}
                            collarColorMapUrl={collarFabric ? getTextureUrl(collarFabric.colorMapUrl) : undefined}
                            cuffColorMapUrl={cuffFabric ? getTextureUrl(cuffFabric.colorMapUrl) : undefined}
                            placketColorMapUrl={placketFabric ? getTextureUrl(placketFabric.colorMapUrl) : undefined}
                            pocketColorMapUrl={pocketFabric ? getTextureUrl(pocketFabric.colorMapUrl) : undefined}
                        />
                    ) : (
                        <Model3D
                            modelPath="/models/shirt.glb"
                            colorMapUrl={selectedFabric ? getTextureUrl(selectedFabric.colorMapUrl) : undefined}
                            normalMapUrl={selectedFabric ? getTextureUrl(selectedFabric.normalMapUrl) : undefined}
                            roughnessMapUrl={selectedFabric ? getTextureUrl(selectedFabric.roughnessMapUrl) : undefined}
                            baseColor={selectedFabric?.baseColor ?? '#ffffff'}
                            roughness={selectedFabric?.roughness ?? 0.8}
                            metalness={selectedFabric?.metalness ?? 0}
                            normalScale={selectedFabric?.normalScale ?? 1}
                            viewAngle={viewMode}
                        />
                    )}

                    <ContactShadows position={[0, useModularModel ? -1.3 : -4, 0]} opacity={0.5} scale={useModularModel ? 8 : 12} blur={2.5} far={5} color="#000000" />
                </Suspense>
                <OrbitControls enablePan={false} enableZoom={false} enableRotate={true} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} makeDefault />
            </Canvas>

            {/* Zoom Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm z-10 transition-transform active:scale-95">
                <button onClick={onZoomIn} className="p-1 hover:bg-muted rounded transition-colors" aria-label="Zoom in">
                    <ZoomIn className="w-4 h-4 text-foreground" />
                </button>
                <span className="text-xs text-muted-foreground whitespace-nowrap">Drag to rotate</span>
                <button onClick={onZoomOut} className="p-1 hover:bg-muted rounded transition-colors" aria-label="Zoom out">
                    <ZoomOut className="w-4 h-4 text-foreground" />
                </button>
            </div>
        </div>
    );
}

// Main 3D Customizer Page
export default function Customize3D() {
    const { productType } = useParams<{ productType: string }>();
    const navigate = useNavigate();
    const validProductType = (productType as 'shirt' | 'pants' | 'suit') || 'shirt';
    const modelPath = `/models/${validProductType}.glb`;

    // State
    const [fabrics, setFabrics] = useState<Fabric3D[]>([]);
    const [selectedFabric, setSelectedFabric] = useState<Fabric3D | null>(null);
    const [activeCategory, setActiveCategory] = useState<FabricCategory>('cotton');
    const [viewMode, setViewMode] = useState<'front' | 'back'>('front');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(3.5);
    const [saved, setSaved] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showSavedDesigns, setShowSavedDesigns] = useState(false);
    const [showCartDrawer, setShowCartDrawer] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

    // Modular shirt options
    const [useModularModel, setUseModularModel] = useState(false); // Default to basic model for stability
    const [activeStep, setActiveStep] = useState<'fabric' | 'collar' | 'cuff' | 'pocket' | 'buttons'>('fabric');
    const [selectedCollar, setSelectedCollar] = useState('button-down');
    const [selectedCuff, setSelectedCuff] = useState('double-squared');
    const [selectedPocket, setSelectedPocket] = useState('none');

    // Separate button colors for placket and cuff
    const [placketButtonColor, setPlacketButtonColor] = useState('#ffffff');
    const [cuffButtonColor, setCuffButtonColor] = useState('#ffffff');

    // Independent fabric for different parts (null means use main fabric)
    const [collarFabric, setCollarFabric] = useState<Fabric3D | null>(null);
    const [cuffFabric, setCuffFabric] = useState<Fabric3D | null>(null);
    const [placketFabric, setPlacketFabric] = useState<Fabric3D | null>(null);
    const [pocketFabric, setPocketFabric] = useState<Fabric3D | null>(null);

    // Toggle for using independent fabrics
    const [useIndependentFabrics, setUseIndependentFabrics] = useState(false);

    const { addToCart, itemCount, items, totalAmount, updateQuantity, removeFromCart } = useCart();
    const { customer, isAuthenticated, logout, saveDesign } = useCustomerAuth();

    // Responsive zoom - adjust based on screen size
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsLargeScreen(width >= 1024);
            if (width < 640) {
                setZoom(4.5); // Mobile - zoom out more
            } else if (width < 1024) {
                setZoom(4); // Tablet
            } else {
                setZoom(3.5); // Desktop
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load fabrics
    useEffect(() => {
        const loadFabrics = async () => {
            try {
                setIsLoading(true);
                setError(null);
                console.log('[Customize3D] Fetching fabrics...');
                const data = await fetchFabrics();
                console.log('[Customize3D] Fetched', data.length, 'fabrics');
                setFabrics(data);
                if (data.length > 0) {
                    console.log('[Customize3D] Setting initial fabric:', data[0].name, data[0].colorMapUrl);
                    setSelectedFabric(data[0]);
                    setActiveCategory(data[0].category);
                }
            } catch (err) {
                console.error('[Customize3D] Error fetching fabrics:', err);
                setError('Failed to load fabrics');
            } finally {
                setIsLoading(false);
            }
        };
        loadFabrics();
    }, []);

    const filteredFabrics = fabrics.filter(f => f.category === activeCategory);
    const availableCategories = FABRIC_CATEGORIES.filter(cat => fabrics.some(f => f.category === cat.value));
    const productId = '69786e2187dee653d099132e';

    const formatPrice = (price: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(price);

    const handleZoomIn = () => setZoom(z => Math.max(2, z - 0.5));
    const handleZoomOut = () => setZoom(z => Math.min(6, z + 0.5));

    const handleSaveDesign = async () => {
        if (!selectedFabric) {
            toast.error('Please select a fabric first');
            return;
        }

        if (!isAuthenticated) {
            toast.error('Please login to save designs');
            navigate('/auth');
            return;
        }

        // Save to account via CustomerAuthContext
        const result = await saveDesign({
            productId: productId,
            productName: `Custom ${validProductType} (3D)`,
            productCategory: validProductType,
            baseImage: getTextureUrl(selectedFabric.colorMapUrl) || '',
            fabric: { id: selectedFabric._id, name: selectedFabric.name, image: getTextureUrl(selectedFabric.colorMapUrl) || '' },
            styles: { viewMode },
            measurements: {},
            totalPrice: selectedFabric.price,
        });

        if (result.success) {
            setSaved(true);
            toast.success(result.message);
            setTimeout(() => setSaved(false), 2000);
        } else {
            toast.error(result.message);
        }
    };

    const handleAddToCart = () => {
        if (!selectedFabric) return;
        setAddingToCart(true);

        addToCart({
            productId: 'shirt-3d',
            productName: `Custom ${validProductType} (3D)`,
            productCategory: validProductType,
            baseImage: getTextureUrl(selectedFabric.colorMapUrl) || '',
            fabric: { id: selectedFabric._id, name: selectedFabric.name, priceModifier: 0 },
            styles: {},
            measurements: {},
            basePrice: selectedFabric.price,
            totalPrice: selectedFabric.price,
        });

        toast.success('Added to cart!', {
            description: selectedFabric.name,
            action: { label: 'View Cart', onClick: () => navigate('/cart') },
        });
        setAddingToCart(false);
    };

    // Category icons mapping
    const categoryIcons: Record<FabricCategory, any> = {
        cotton: Shirt,
        wool: Shirt,
        linen: Shirt,
        silk: Shirt,
        polyester: Shirt,
        denim: Shirt,
    };

    return (
        <div className="min-h-screen bg-gradient-soft flex flex-col lg:h-screen lg:w-screen lg:overflow-hidden">
            {/* ========== HEADER ========== */}
            <header className="bg-primary py-3 z-50 shrink-0">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between relative">
                        {/* Left - Logo */}
                        <Link to="/" className="flex items-center gap-3 group z-10">
                            <div className="relative">
                                <div className="absolute inset-0 bg-accent/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-accent shadow-glow transition-all duration-300">
                                    <Scissors className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-45" />
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="font-display text-xl font-bold text-white">Tailor Fit</h1>
                                <p className="text-[11px] font-medium text-white/60">Bespoke Tailoring</p>
                            </div>
                        </Link>

                        {/* Center */}
                        <div className="absolute left-1/2 -translate-x-1/2 text-center hidden sm:block">
                            <h1 className="font-display text-lg lg:text-xl font-bold text-white whitespace-nowrap capitalize">
                                3D {validProductType} Customizer
                            </h1>
                            <p className="text-[10px] lg:text-[11px] font-medium text-white/60 capitalize">3D Preview</p>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-2 sm:gap-3 z-10">
                            <button onClick={() => setShowSavedDesigns(!showSavedDesigns)} className="relative p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300">
                                <Bookmark className="w-5 h-5" />
                                {(customer?.savedDesigns?.length || 0) > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center">
                                        {customer?.savedDesigns?.length}
                                    </span>
                                )}
                            </button>
                            <button onClick={() => setShowCartDrawer(!showCartDrawer)} className="relative p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300">
                                <ShoppingBag className="w-5 h-5" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center">{itemCount}</span>
                                )}
                            </button>
                            {isAuthenticated ? (
                                <div className="relative" onMouseEnter={() => setIsUserMenuOpen(true)} onMouseLeave={() => setIsUserMenuOpen(false)}>
                                    <button className="relative p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300">
                                        <User className="w-5 h-5" />
                                    </button>
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white border border-border/50 p-2 shadow-float z-50">
                                            <div className="px-3 py-2 border-b border-border/50 mb-1">
                                                <p className="text-sm font-medium text-foreground truncate">{customer?.name}</p>
                                            </div>
                                            <Link to="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                                                <User className="w-4 h-4" /> My Account
                                            </Link>
                                            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link to="/auth" className="relative p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300">
                                    <User className="w-5 h-5" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ========== MAIN ========== */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-0">

                {/* ===== MOBILE LAYOUT (< 1024px) ===== */}
                <div className="lg:hidden flex flex-col">
                    {/* Mobile Preview Section */}
                    {/* Height logic matches Customize.tsx exactly for consistency */}
                    <div className="flex flex-row h-[55vh] min-h-[350px] max-h-[500px] min-[450px]:h-[65vh] min-[450px]:min-h-[500px] min-[450px]:max-h-[800px] min-[900px]:h-[75vh] min-[900px]:min-h-[600px] min-[900px]:max-h-[900px]">
                        <div className="flex-1 relative overflow-hidden bg-background flex flex-col">
                            {/* Nav Buttons (Absolute Top Left) */}
                            <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                                <Link to="/products" className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-foreground hover:bg-muted shadow-md transition-all border border-border/50">
                                    <ArrowLeft className="w-4 h-4" />
                                </Link>
                            </div>

                            {/* View Toggle (Absolute Top Right) */}
                            <div className="absolute top-3 right-3 z-30 flex gap-1.5">
                                <button onClick={() => setUseModularModel(!useModularModel)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-md ${useModularModel ? 'bg-accent text-primary' : 'bg-white text-foreground hover:bg-muted border border-border/50'}`}>
                                    {useModularModel ? '✨' : 'B'}
                                </button>
                                <button onClick={() => setViewMode('front')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-md ${viewMode === 'front' ? 'bg-primary text-white' : 'bg-white text-foreground hover:bg-muted border border-border/50'}`}>
                                    Front
                                </button>
                                <button onClick={() => setViewMode('back')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-md ${viewMode === 'back' ? 'bg-primary text-white' : 'bg-white text-foreground hover:bg-muted border border-border/50'}`}>
                                    Back
                                </button>
                            </div>

                            {/* Canvas Area */}
                            <div className="flex-1 relative m-3 mt-14 rounded-xl bg-primary/10 border border-primary/20 shadow-soft overflow-hidden">
                                {!isLargeScreen && (
                                    <ShirtCanvas
                                        zoom={zoom}
                                        viewMode={viewMode}
                                        useModularModel={useModularModel}
                                        selectedFabric={selectedFabric}
                                        selectedCollar={selectedCollar}
                                        selectedCuff={selectedCuff}
                                        selectedPocket={selectedPocket}
                                        placketButtonColor={placketButtonColor}
                                        cuffButtonColor={cuffButtonColor}
                                        collarFabric={collarFabric}
                                        cuffFabric={cuffFabric}
                                        placketFabric={placketFabric}
                                        pocketFabric={pocketFabric}
                                        onZoomIn={handleZoomIn}
                                        onZoomOut={handleZoomOut}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Step Buttons (Horizontal Scroll) */}
                    <div className="flex flex-row bg-transparent py-4 px-4 overflow-x-auto scrollbar-hide gap-2 shrink-0">
                        <button
                            onClick={() => setActiveStep('fabric')}
                            className={`flex flex-col items-center justify-center gap-2.5 py-3.5 px-4 w-20 rounded-lg transition-all duration-300 shrink-0 border ${activeStep === 'fabric' ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'}`}
                        >
                            <Shirt className={`w-8 h-8 ${activeStep === 'fabric' ? 'text-white' : 'text-muted-foreground'}`} />
                            <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Fabric</span>
                        </button>

                        {useModularModel && (
                            <>
                                <button onClick={() => setActiveStep('collar')} className={`flex flex-col items-center justify-center gap-2.5 py-3.5 px-4 w-20 rounded-lg transition-all duration-300 shrink-0 border ${activeStep === 'collar' ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'}`}>
                                    <Box className={`w-8 h-8 ${activeStep === 'collar' ? 'text-white' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Collar</span>
                                </button>
                                <button onClick={() => setActiveStep('cuff')} className={`flex flex-col items-center justify-center gap-2.5 py-3.5 px-4 w-20 rounded-lg transition-all duration-300 shrink-0 border ${activeStep === 'cuff' ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'}`}>
                                    <Layers className={`w-8 h-8 ${activeStep === 'cuff' ? 'text-white' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Cuff</span>
                                </button>
                                <button onClick={() => setActiveStep('pocket')} className={`flex flex-col items-center justify-center gap-2.5 py-3.5 px-4 w-20 rounded-lg transition-all duration-300 shrink-0 border ${activeStep === 'pocket' ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'}`}>
                                    <Box className={`w-8 h-8 ${activeStep === 'pocket' ? 'text-white' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Pocket</span>
                                </button>
                                <button onClick={() => setActiveStep('buttons')} className={`flex flex-col items-center justify-center gap-2.5 py-3.5 px-4 w-20 rounded-lg transition-all duration-300 shrink-0 border ${activeStep === 'buttons' ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'}`}>
                                    <Sparkles className={`w-8 h-8 ${activeStep === 'buttons' ? 'text-white' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Buttons</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Selected Customizations (Mobile) */}
                    <div className="block px-3 py-3 mx-3 mb-4 rounded-xl bg-white/80 backdrop-blur-sm border border-border/50 shadow-sm shrink-0">
                        <p className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-primary" />
                            Selected Customizations
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {selectedFabric && (
                                <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold border border-primary/20">{selectedFabric.name}</span>
                            )}
                            {useModularModel && (
                                <>
                                    <span className="px-2 py-1 bg-accent/10 text-primary rounded-lg text-[10px] font-semibold border border-accent/20 capitalize">{COLLAR_OPTIONS.find(c => c.id === selectedCollar)?.name}</span>
                                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold border border-primary/20 capitalize">{CUFF_OPTIONS.find(c => c.id === selectedCuff)?.name}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== DESKTOP PREVIEW (>= 1024px) ===== */}
                <div className="hidden lg:flex w-[45%] bg-background border-r border-border/50 flex-col overflow-hidden relative">
                    {/* Navigation Buttons - Upper Left */}
                    <div className="absolute top-2 lg:top-3 left-2 lg:left-4 z-20 flex items-center gap-1.5 lg:gap-2">
                        <Link to="/products" className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-white/95 backdrop-blur text-foreground hover:bg-white shadow-sm transition-all text-xs lg:text-sm font-medium border border-border/50">
                            <ArrowLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                        <Link to="/products" className="px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-white/95 backdrop-blur text-foreground hover:bg-white shadow-sm transition-all text-xs lg:text-sm font-medium border border-border/50">
                            Products
                        </Link>
                    </div>

                    {/* View Toggle - Upper Right */}
                    <div className="absolute top-2 lg:top-3 right-2 lg:right-4 z-20 flex gap-1 lg:gap-1.5">
                        <button
                            onClick={() => setUseModularModel(!useModularModel)}
                            className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all shadow-sm ${useModularModel ? 'bg-accent text-primary' : 'bg-white/95 backdrop-blur text-foreground hover:bg-white border border-border/50'}`}
                        >
                            {useModularModel ? '✨ Modular' : 'Basic'}
                        </button>
                        <div className="w-px bg-border/50" />
                        <button onClick={() => setViewMode('front')} className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all shadow-sm ${viewMode === 'front' ? 'bg-primary text-white' : 'bg-white/95 backdrop-blur text-foreground hover:bg-white border border-border/50'}`}>
                            Front
                        </button>
                        <button onClick={() => setViewMode('back')} className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all shadow-sm ${viewMode === 'back' ? 'bg-primary text-white' : 'bg-white/95 backdrop-blur text-foreground hover:bg-white border border-border/50'}`}>
                            Back
                        </button>
                    </div>

                    {/* Preview Area (Full Height) */}
                    <div className="flex-1 flex flex-col px-4 lg:px-8 pt-16 pb-0 lg:pb-0 overflow-hidden">
                        {/* Wrapper to match Customize.tsx structure */}
                        <div className="flex-1 relative rounded-xl bg-primary/10 border border-primary/20 shadow-soft overflow-hidden mb-4 lg:mb-0 lg:min-h-0">
                            {isLargeScreen && (
                                <ShirtCanvas
                                    zoom={zoom}
                                    viewMode={viewMode}
                                    useModularModel={useModularModel}
                                    selectedFabric={selectedFabric}
                                    selectedCollar={selectedCollar}
                                    selectedCuff={selectedCuff}
                                    selectedPocket={selectedPocket}
                                    placketButtonColor={placketButtonColor}
                                    cuffButtonColor={cuffButtonColor}
                                    collarFabric={collarFabric}
                                    cuffFabric={cuffFabric}
                                    placketFabric={placketFabric}
                                    pocketFabric={pocketFabric}
                                    onZoomIn={handleZoomIn}
                                    onZoomOut={handleZoomOut}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== RIGHT CONTAINER (SIDEBAR + OPTIONS) ===== */}
                <div className="flex-1 flex flex-col lg:flex-row min-w-0 bg-transparent overflow-hidden relative">

                    {/* Step Sidebar - Desktop Only (Vertical) */}
                    <div className="hidden lg:flex w-40 bg-transparent flex-col py-4 px-4 overflow-y-auto scrollbar-hide border-r border-border/50">
                        {/* Step 1: Fabric */}
                        <button
                            onClick={() => setActiveStep('fabric')}
                            className={`flex flex-col items-center justify-center gap-2.5 py-3.5 rounded-lg transition-all duration-300 mb-2 border ${activeStep === 'fabric' ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'}`}
                        >
                            <Shirt className={`w-8 h-8 ${activeStep === 'fabric' ? 'text-white' : 'text-muted-foreground'}`} />
                            <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Fabric</span>
                        </button>

                        {/* Modular Steps */}
                        {useModularModel && (
                            <>
                                <button
                                    onClick={() => setActiveStep('collar')}
                                    className={`flex flex-col items-center justify-center gap-2.5 py-3.5 rounded-lg transition-all duration-300 mb-2 border ${activeStep === 'collar' ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'}`}
                                >
                                    <Box className={`w-8 h-8 ${activeStep === 'collar' ? 'text-white' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Collar</span>
                                </button>
                                <button
                                    onClick={() => setActiveStep('cuff')}
                                    className={`flex flex-col items-center justify-center gap-2.5 py-3.5 rounded-lg transition-all duration-300 mb-2 border ${activeStep === 'cuff' ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'}`}
                                >
                                    <Layers className={`w-8 h-8 ${activeStep === 'cuff' ? 'text-white' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Cuff</span>
                                </button>
                                <button
                                    onClick={() => setActiveStep('pocket')}
                                    className={`flex flex-col items-center justify-center gap-2.5 py-3.5 rounded-lg transition-all duration-300 mb-2 border ${activeStep === 'pocket' ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'}`}
                                >
                                    <Box className={`w-8 h-8 ${activeStep === 'pocket' ? 'text-white' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Pocket</span>
                                </button>
                                <button
                                    onClick={() => setActiveStep('buttons')}
                                    className={`flex flex-col items-center justify-center gap-2.5 py-3.5 rounded-lg transition-all duration-300 mb-2 border ${activeStep === 'buttons' ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'}`}
                                >
                                    <Sparkles className={`w-8 h-8 ${activeStep === 'buttons' ? 'text-white' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">Buttons</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Options Panel */}
                    <div className="w-full lg:flex-1 bg-white/50 backdrop-blur-sm flex flex-col overflow-hidden min-w-0">
                        {/* Header */}
                        <div className="p-4 lg:p-5 border-b border-border/50 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="font-display text-base lg:text-lg font-semibold text-foreground flex items-center gap-2">
                                    <span className="text-primary">|</span>
                                    {activeStep === 'fabric' && 'Select Fabric'}
                                    {activeStep === 'collar' && 'Collar Style'}
                                    {activeStep === 'cuff' && 'Cuff Style'}
                                    {activeStep === 'pocket' && 'Pocket Style'}
                                    {activeStep === 'buttons' && 'Button Color'}
                                </h2>
                                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">
                                    {activeStep === 'fabric' && 'Choose from our premium fabric collection'}
                                    {activeStep === 'collar' && 'Select your preferred collar style'}
                                    {activeStep === 'cuff' && 'Choose a cuff style for your sleeves'}
                                    {activeStep === 'pocket' && 'Add or remove chest pocket'}
                                    {activeStep === 'buttons' && 'Pick a color for your shirt buttons'}
                                </p>
                            </div>
                            <Link to={`/customize/${productId}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/50">
                                Switch to 2D
                            </Link>
                        </div>

                        {/* Options Content */}
                        <div className="flex-1 p-4 lg:p-5 overflow-y-auto">
                            {/* Fabric Step */}
                            {activeStep === 'fabric' && (
                                <>
                                    {/* Fabric Category Pills */}
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                        {availableCategories.map(cat => (
                                            <button key={cat.value} onClick={() => setActiveCategory(cat.value)} className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat.value ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground border border-border/50'}`}>
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            <p className="text-sm text-muted-foreground mt-3">Loading fabrics...</p>
                                        </div>
                                    ) : error ? (
                                        <div className="text-center py-12 bg-muted/30 rounded-xl border border-border/50">
                                            <p className="text-destructive mb-4">{error}</p>
                                            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Retry</button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {filteredFabrics.map(fabric => (
                                                <button
                                                    key={fabric._id}
                                                    onClick={() => setSelectedFabric(fabric)}
                                                    className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${selectedFabric?._id === fabric._id ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-border/50 hover:border-primary/30'}`}
                                                >
                                                    <div className="aspect-square bg-muted/20" style={{ backgroundImage: `url(${getTextureUrl(fabric.colorMapUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                                        {selectedFabric?._id === fabric._id && (
                                                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-2 bg-white">
                                                        <p className="font-medium text-xs text-foreground truncate">{fabric.name}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatPrice(fabric.price)}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Placket Fabric Selection */}
                                    {useModularModel && (
                                        <div className="border-t border-border/30 pt-4 mt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-medium text-sm text-foreground">Placket Fabric</h3>
                                                <button
                                                    onClick={() => setPlacketFabric(placketFabric ? null : selectedFabric)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${placketFabric ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                                                >
                                                    {placketFabric ? 'Custom' : 'Same as Body'}
                                                </button>
                                            </div>
                                            {placketFabric && (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                                                    {filteredFabrics.map(fabric => (
                                                        <button
                                                            key={`placket-${fabric._id}`}
                                                            onClick={() => setPlacketFabric(fabric)}
                                                            className={`group relative rounded-lg overflow-hidden border-2 transition-all ${placketFabric?._id === fabric._id ? 'border-primary shadow-md' : 'border-border/50 hover:border-primary/30'}`}
                                                        >
                                                            <div className="aspect-square bg-muted/20" style={{ backgroundImage: `url(${getTextureUrl(fabric.colorMapUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                                                {placketFabric?._id === fabric._id && (
                                                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Collar Step */}
                            {activeStep === 'collar' && (
                                <div className="space-y-6">
                                    {/* Collar Style Selection */}
                                    <div>
                                        <h3 className="font-medium text-sm text-foreground mb-3">Collar Style</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {COLLAR_OPTIONS.map(collar => (
                                                <button
                                                    key={collar.id}
                                                    onClick={() => setSelectedCollar(collar.id)}
                                                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-center relative ${selectedCollar === collar.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border/50 hover:border-primary/30 bg-muted/20'}`}
                                                >
                                                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center">
                                                        <Box className={`w-6 h-6 ${selectedCollar === collar.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    </div>
                                                    <p className={`font-medium text-sm ${selectedCollar === collar.id ? 'text-primary' : 'text-foreground'}`}>{collar.name}</p>
                                                    {selectedCollar === collar.id && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Collar Fabric Selection */}
                                    <div className="border-t border-border/30 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium text-sm text-foreground">Collar Fabric</h3>
                                            <button
                                                onClick={() => setCollarFabric(collarFabric ? null : selectedFabric)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${collarFabric ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                                            >
                                                {collarFabric ? 'Custom' : 'Same as Body'}
                                            </button>
                                        </div>
                                        {collarFabric && (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                                {filteredFabrics.map(fabric => (
                                                    <button
                                                        key={`collar-${fabric._id}`}
                                                        onClick={() => setCollarFabric(fabric)}
                                                        className={`group relative rounded-lg overflow-hidden border-2 transition-all ${collarFabric?._id === fabric._id ? 'border-primary shadow-md' : 'border-border/50 hover:border-primary/30'}`}
                                                    >
                                                        <div className="aspect-square bg-muted/20" style={{ backgroundImage: `url(${getTextureUrl(fabric.colorMapUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                                            {collarFabric?._id === fabric._id && (
                                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                                    <Check className="w-2.5 h-2.5 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cuff Step */}
                            {activeStep === 'cuff' && (
                                <div className="space-y-6">
                                    {/* Cuff Style Selection */}
                                    <div>
                                        <h3 className="font-medium text-sm text-foreground mb-3">Cuff Style</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {CUFF_OPTIONS.map(cuff => (
                                                <button
                                                    key={cuff.id}
                                                    onClick={() => setSelectedCuff(cuff.id)}
                                                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${selectedCuff === cuff.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border/50 hover:border-primary/30 bg-muted/20'}`}
                                                >
                                                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center">
                                                        <Layers className={`w-6 h-6 ${selectedCuff === cuff.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    </div>
                                                    <p className={`font-medium text-sm ${selectedCuff === cuff.id ? 'text-primary' : 'text-foreground'}`}>{cuff.name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Cuff Fabric Selection */}
                                    <div className="border-t border-border/30 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium text-sm text-foreground">Cuff Fabric</h3>
                                            <button
                                                onClick={() => setCuffFabric(cuffFabric ? null : selectedFabric)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${cuffFabric ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                                            >
                                                {cuffFabric ? 'Custom' : 'Same as Body'}
                                            </button>
                                        </div>
                                        {cuffFabric && (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                                {filteredFabrics.map(fabric => (
                                                    <button
                                                        key={`cuff-${fabric._id}`}
                                                        onClick={() => setCuffFabric(fabric)}
                                                        className={`group relative rounded-lg overflow-hidden border-2 transition-all ${cuffFabric?._id === fabric._id ? 'border-primary shadow-md' : 'border-border/50 hover:border-primary/30'}`}
                                                    >
                                                        <div className="aspect-square bg-muted/20" style={{ backgroundImage: `url(${getTextureUrl(fabric.colorMapUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                                            {cuffFabric?._id === fabric._id && (
                                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                                    <Check className="w-2.5 h-2.5 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pocket Step */}
                            {activeStep === 'pocket' && (
                                <div className="space-y-6">
                                    {/* Pocket Style Selection */}
                                    <div>
                                        <h3 className="font-medium text-sm text-foreground mb-3">Pocket Style</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {POCKET_OPTIONS.map(pocket => (
                                                <button
                                                    key={pocket.id}
                                                    onClick={() => setSelectedPocket(pocket.id)}
                                                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-center ${selectedPocket === pocket.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border/50 hover:border-primary/30 bg-muted/20'}`}
                                                >
                                                    <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
                                                        <Box className={`w-8 h-8 ${selectedPocket === pocket.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    </div>
                                                    <p className={`font-medium text-base ${selectedPocket === pocket.id ? 'text-primary' : 'text-foreground'}`}>{pocket.name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pocket Fabric Selection */}
                                    {selectedPocket !== 'none' && (
                                        <div className="border-t border-border/30 pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-medium text-sm text-foreground">Pocket Fabric</h3>
                                                <button
                                                    onClick={() => setPocketFabric(pocketFabric ? null : selectedFabric)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${pocketFabric ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                                                >
                                                    {pocketFabric ? 'Custom' : 'Same as Body'}
                                                </button>
                                            </div>
                                            {pocketFabric && (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                                    {filteredFabrics.map(fabric => (
                                                        <button
                                                            key={`pocket-${fabric._id}`}
                                                            onClick={() => setPocketFabric(fabric)}
                                                            className={`group relative rounded-lg overflow-hidden border-2 transition-all ${pocketFabric?._id === fabric._id ? 'border-primary shadow-md' : 'border-border/50 hover:border-primary/30'}`}
                                                        >
                                                            <div className="aspect-square bg-muted/20" style={{ backgroundImage: `url(${getTextureUrl(fabric.colorMapUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                                                {pocketFabric?._id === fabric._id && (
                                                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Buttons Step */}
                            {activeStep === 'buttons' && (
                                <div className="space-y-6">
                                    {/* Front Placket Buttons */}
                                    <div>
                                        <h3 className="font-medium text-sm text-foreground mb-3">Front Placket Buttons</h3>
                                        <div className="grid grid-cols-4 gap-3">
                                            {BUTTON_COLORS.map(btn => (
                                                <button
                                                    key={`placket-${btn.id}`}
                                                    onClick={() => setPlacketButtonColor(btn.color)}
                                                    className={`p-3 rounded-xl border-2 transition-all duration-300 text-center ${placketButtonColor === btn.color ? 'border-primary shadow-md scale-105' : 'border-border/50 hover:border-primary/30'}`}
                                                >
                                                    <div
                                                        className="w-10 h-10 mx-auto mb-2 rounded-full border-2 border-border/50 shadow-inner"
                                                        style={{ backgroundColor: btn.color }}
                                                    />
                                                    <p className={`font-medium text-xs ${placketButtonColor === btn.color ? 'text-primary' : 'text-foreground'}`}>{btn.name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Cuff Buttons */}
                                    <div>
                                        <h3 className="font-medium text-sm text-foreground mb-3">Cuff Buttons</h3>
                                        <div className="grid grid-cols-4 gap-3">
                                            {BUTTON_COLORS.map(btn => (
                                                <button
                                                    key={`cuff-${btn.id}`}
                                                    onClick={() => setCuffButtonColor(btn.color)}
                                                    className={`p-3 rounded-xl border-2 transition-all duration-300 text-center ${cuffButtonColor === btn.color ? 'border-primary shadow-md scale-105' : 'border-border/50 hover:border-primary/30'}`}
                                                >
                                                    <div
                                                        className="w-10 h-10 mx-auto mb-2 rounded-full border-2 border-border/50 shadow-inner"
                                                        style={{ backgroundColor: btn.color }}
                                                    />
                                                    <p className={`font-medium text-xs ${cuffButtonColor === btn.color ? 'text-primary' : 'text-foreground'}`}>{btn.name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom - Price & Actions */}
                        <div className="p-3 lg:p-4 bg-white border-t border-border/50 shrink-0">
                            {/* Price Summary */}
                            <div className="flex items-center justify-between mb-3 lg:mb-4 p-3 lg:p-4 rounded-xl bg-accent/10">
                                <div>
                                    <p className="text-[10px] lg:text-xs text-muted-foreground">Total Price</p>
                                    <p className="font-display text-xl lg:text-2xl font-bold text-foreground">{selectedFabric ? formatPrice(selectedFabric.price) : 'Rs 0'}</p>
                                </div>
                                <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-accent" />
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                                <button
                                    onClick={handleSaveDesign}
                                    className={`flex-1 flex items-center justify-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-3 lg:py-4 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-300 ${saved ? 'bg-green-600 text-white' : 'bg-muted/50 text-foreground hover:bg-muted'}`}
                                >
                                    {saved ? <Check className="w-4 h-4 lg:w-5 lg:h-5" /> : <Save className="w-4 h-4 lg:w-5 lg:h-5" />}
                                    {saved ? 'Saved!' : 'Save Design'}
                                </button>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={addingToCart || !selectedFabric}
                                    className="flex-1 flex items-center justify-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-3 lg:py-4 rounded-full text-xs lg:text-sm font-semibold bg-primary text-white hover:bg-primary/90 shadow-soft transition-all disabled:opacity-50"
                                >
                                    <ShoppingBag className="w-4 h-4 lg:w-5 lg:h-5" />
                                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Saved Designs Drawer */}
            <div
                className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showSavedDesigns ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setShowSavedDesigns(false)}
            >
                <div className="fixed inset-0 bg-black/50" />
                <div
                    className={`absolute right-0 top-[68px] bottom-0 w-full sm:w-96 max-w-[95vw] sm:max-w-[90vw] bg-white shadow-float overflow-y-auto transition-transform duration-300 ease-out ${showSavedDesigns ? 'translate-x-0' : 'translate-x-full'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="sticky top-0 bg-white border-b border-border/50 p-4 z-10">
                        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                            <Bookmark className="w-5 h-5 text-primary" />
                            Saved Designs
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">{customer?.savedDesigns?.length || 0} saved design{(customer?.savedDesigns?.length || 0) !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="p-4">
                        {(!customer?.savedDesigns || customer.savedDesigns.length === 0) ? (
                            <div className="text-center py-8">
                                <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No saved designs yet.</p>
                                <p className="text-xs text-muted-foreground mt-1">Save your current configuration to see it here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {customer.savedDesigns.map((design) => (
                                    <div key={design._id} className="p-3 rounded-xl border border-border/50 bg-muted/30 hover:border-primary/30 transition-all">
                                        <div className="flex gap-3">
                                            <div className="w-16 h-16 rounded-lg bg-white border border-border/30 overflow-hidden shrink-0">
                                                {design.baseImage ? (
                                                    <img src={design.baseImage} alt={design.productName} className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Layers className="w-6 h-6 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-foreground truncate">{design.name || design.productName}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(design.savedAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-sm font-semibold text-primary mt-1">{formatPrice(design.totalPrice)}</p>
                                            </div>
                                        </div>
                                        {design.fabric && (
                                            <p className="text-xs text-muted-foreground mt-2 truncate">
                                                Fabric: {design.fabric.name}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cart Drawer */}
            <div
                className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showCartDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setShowCartDrawer(false)}
            >
                <div className="fixed inset-0 bg-black/50" />
                <div
                    className={`absolute right-0 top-[68px] bottom-0 w-full sm:w-96 max-w-[95vw] sm:max-w-[90vw] bg-white shadow-float overflow-y-auto transition-transform duration-300 ease-out ${showCartDrawer ? 'translate-x-0' : 'translate-x-full'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="sticky top-0 bg-white border-b border-border/50 p-4 z-10">
                        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                            Shopping Cart
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="p-4 flex-1">
                        {items.length === 0 ? (
                            <div className="text-center py-8">
                                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">Your cart is empty</p>
                                <p className="text-xs text-muted-foreground mt-1">Add items to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="p-3 rounded-xl border border-border/50 bg-muted/30">
                                        <div className="flex gap-3">
                                            <div className="w-14 h-14 rounded-lg bg-white border border-border/30 overflow-hidden shrink-0">
                                                {item.baseImage ? (
                                                    <img src={item.baseImage} alt={item.productName} className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Layers className="w-5 h-5 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-foreground truncate">{item.productName}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{item.productCategory}</p>
                                                <p className="text-sm font-semibold text-primary mt-1">{formatPrice(item.totalPrice)}</p>
                                            </div>
                                        </div>
                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {items.length > 0 && (
                        <div className="sticky bottom-0 bg-white border-t border-border/50 p-4">
                            <div className="flex justify-between mb-4">
                                <span className="text-sm text-muted-foreground">Subtotal</span>
                                <span className="font-display text-lg font-bold">{formatPrice(totalAmount)}</span>
                            </div>
                            <Link
                                to="/checkout"
                                onClick={() => setShowCartDrawer(false)}
                                className="block w-full py-3 bg-primary text-white text-center font-semibold rounded-full hover:bg-primary/90 transition-colors"
                            >
                                Proceed to Checkout
                            </Link>
                            <Link
                                to="/cart"
                                onClick={() => setShowCartDrawer(false)}
                                className="block w-full py-2 mt-2 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                View Full Cart
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
