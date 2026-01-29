import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, useTexture, ContactShadows } from '@react-three/drei';
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

    // 3d Preview Model Size and Position
    return (
        <group ref={meshRef} position={[0, -4, 0]}>
            <primitive object={clonedScene} scale={[3, 3, 3]} />
        </group>
    );
}

useGLTF.preload('/models/shirt.glb');

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

    const { addToCart, itemCount, items, totalAmount, updateQuantity, removeFromCart } = useCart();
    const { customer, isAuthenticated, logout, saveDesign } = useCustomerAuth();

    // Responsive zoom - adjust based on screen size
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
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
                const data = await fetchFabrics();
                setFabrics(data);
                if (data.length > 0) {
                    setSelectedFabric(data[0]);
                    setActiveCategory(data[0].category);
                }
            } catch (err) {
                console.error('Error fetching fabrics:', err);
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

                {/* ===== LEFT - PREVIEW ===== */}
                <div className="flex-1 lg:w-[45%] bg-background border-r border-border/50 flex flex-col overflow-hidden relative">
                    {/* Nav */}
                    <div className="absolute top-2 lg:top-3 left-2 lg:left-4 z-20 flex items-center gap-1.5 lg:gap-2">
                        <Link to="/products" className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-white/95 backdrop-blur text-foreground hover:bg-white shadow-sm transition-all text-xs lg:text-sm font-medium border border-border/50">
                            <ArrowLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                        <Link to="/products" className="px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-white/95 backdrop-blur text-foreground hover:bg-white shadow-sm transition-all text-xs lg:text-sm font-medium border border-border/50">
                            Products
                        </Link>
                    </div>

                    {/* View Toggle */}
                    <div className="absolute top-2 lg:top-3 right-2 lg:right-4 z-20 flex gap-1 lg:gap-1.5">
                        <button onClick={() => setViewMode('front')} className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all shadow-sm ${viewMode === 'front' ? 'bg-primary text-white' : 'bg-white/95 backdrop-blur text-foreground hover:bg-white border border-border/50'}`}>
                            Front
                        </button>
                        <button onClick={() => setViewMode('back')} className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all shadow-sm ${viewMode === 'back' ? 'bg-primary text-white' : 'bg-white/95 backdrop-blur text-foreground hover:bg-white border border-border/50'}`}>
                            Back
                        </button>
                    </div>

                    {/* Preview - Full height matching 2D page */}
                    <div className="flex-1 flex flex-col px-4 lg:px-8 pt-14 pb-4 overflow-hidden">
                        <div className="flex-1 relative rounded-xl bg-primary/10 border border-primary/20 shadow-soft overflow-hidden">
                            {/* Grid */}
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                            <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} style={{ height: '100%', width: '100%' }} gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }} shadows>
                                <CameraController zoom={zoom} />
                                <Suspense fallback={null}>
                                    {/* HDRI Environment for realistic reflections */}
                                    <Environment files="/hdri/marry_hall_2k.hdr" background={false} />

                                    {/* Studio Lighting Setup */}
                                    <ambientLight intensity={0.3} />

                                    {/* Key Light - main illumination from front-right */}
                                    <directionalLight
                                        position={[5, 5, 5]}
                                        intensity={1.2}
                                        castShadow
                                        shadow-mapSize={[2048, 2048]}
                                        shadow-camera-far={50}
                                        shadow-camera-left={-10}
                                        shadow-camera-right={10}
                                        shadow-camera-top={10}
                                        shadow-camera-bottom={-10}
                                        shadow-bias={-0.0001}
                                    />

                                    {/* Fill Light - soften shadows from left */}
                                    <directionalLight position={[-5, 3, 0]} intensity={0.5} />

                                    {/* Rim Light - edge definition from behind */}
                                    <directionalLight position={[0, 3, -5]} intensity={0.4} />

                                    {/* Bottom Fill - subtle illumination from below */}
                                    <directionalLight position={[0, -2, 2]} intensity={0.2} />

                                    <Model3D
                                        modelPath={modelPath}
                                        colorMapUrl={selectedFabric ? getTextureUrl(selectedFabric.colorMapUrl) : undefined}
                                        normalMapUrl={selectedFabric ? getTextureUrl(selectedFabric.normalMapUrl) : undefined}
                                        roughnessMapUrl={selectedFabric ? getTextureUrl(selectedFabric.roughnessMapUrl) : undefined}
                                        baseColor={selectedFabric?.baseColor ?? '#ffffff'}
                                        roughness={selectedFabric?.roughness ?? 0.8}
                                        metalness={selectedFabric?.metalness ?? 0}
                                        normalScale={selectedFabric?.normalScale ?? 1}
                                        viewAngle={viewMode}
                                    />

                                    {/* Contact Shadow - realistic ground shadow */}
                                    <ContactShadows
                                        position={[0, -4, 0]}
                                        opacity={0.5}
                                        scale={12}
                                        blur={2.5}
                                        far={5}
                                        color="#000000"
                                    />
                                </Suspense>
                                <OrbitControls enablePan={false} enableZoom={false} enableRotate={true} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} makeDefault />
                            </Canvas>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                <button onClick={handleZoomIn} className="p-1 hover:bg-muted rounded transition-colors" aria-label="Zoom in">
                                    <ZoomIn className="w-4 h-4 text-foreground" />
                                </button>
                                <span className="text-xs text-muted-foreground">Drag left/right to rotate</span>
                                <button onClick={handleZoomOut} className="p-1 hover:bg-muted rounded transition-colors" aria-label="Zoom out">
                                    <ZoomOut className="w-4 h-4 text-foreground" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Selected Customizations */}
                    <div className="hidden min-[450px]:block lg:block px-3 py-3 mx-3 my-4 rounded-xl bg-white/80 backdrop-blur-sm border border-border/50 shadow-sm shrink-0">
                        <p className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-primary" />
                            Selected Customizations
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {selectedFabric && (
                                <>
                                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold border border-primary/20">{selectedFabric.name}</span>
                                    <span className="px-2 py-1 bg-accent/10 text-primary rounded-lg text-[10px] font-semibold border border-accent/20 capitalize">{selectedFabric.category}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== MIDDLE - STEP SIDEBAR ===== */}
                <div className="hidden lg:flex w-28 bg-muted/30 border-x border-border/50 flex-col py-5 px-3 overflow-y-auto">
                    {availableCategories.map((cat, idx) => {
                        const isActive = activeCategory === cat.value;
                        const Icon = categoryIcons[cat.value] || Shirt;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => setActiveCategory(cat.value)}
                                className={`flex flex-col items-center justify-center gap-2.5 py-4 rounded-lg transition-all duration-300 mb-3 ${isActive ? 'bg-primary text-white shadow-md scale-105' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border/50'}`}
                            >
                                <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                                <span className="text-[10px] font-medium text-center leading-tight">{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ===== RIGHT - OPTIONS ===== */}
                <div className="lg:w-[45%] bg-white flex flex-col overflow-hidden border-l border-border/50">
                    {/* Header */}
                    <div className="p-4 lg:p-5 border-b border-border/50 flex items-center justify-between">
                        <div>
                            <h2 className="font-display text-base lg:text-lg font-semibold text-foreground flex items-center gap-2">
                                <span className="text-primary">|</span> {availableCategories.find(c => c.value === activeCategory)?.label || 'Fabric'}
                            </h2>
                            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">Choose from our premium fabric collection</p>
                        </div>
                        <Link to={`/customize/${productId}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/50">
                            Switch to 2D
                        </Link>
                    </div>

                    {/* Mobile Category Pills */}
                    <div className="lg:hidden p-3 border-b border-border/30 overflow-x-auto">
                        <div className="flex gap-2">
                            {availableCategories.map(cat => (
                                <button key={cat.value} onClick={() => setActiveCategory(cat.value)} className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat.value ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground border border-border/50'}`}>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fabric Grid */}
                    <div className="flex-1 p-4 lg:p-5 overflow-y-auto">
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
