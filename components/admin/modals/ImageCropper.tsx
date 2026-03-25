import React, { useState, useRef, useEffect, PointerEvent } from 'react';
import { X, Save, Loader2, Crop, AlertTriangle } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
}

const FINAL_CROP_SIZE = 512;
const MIN_CROP_SIZE = 50;

type HandleType = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, size: 200 });
  const [imageBounds, setImageBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropSize: 0 });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new Image();
    // Importante: crossOrigin debe establecerse antes de src
    image.crossOrigin = 'anonymous'; 
    
    image.onload = () => {
        originalImageRef.current = image;
        setIsImageLoaded(true);
        setError(null);
    };
    
    image.onerror = () => {
      // Si falla, intentamos una vez más sin el cache buster por si acaso la URL firmada lo rechaza,
      // aunque es poco probable para URLs públicas de Firebase.
      // Pero por ahora mostramos el error para debug.
      setError("Error de CORS o de carga. Tu navegador puede estar usando una versión antigua de la imagen en caché. Intenta borrar el caché del navegador o espera unos minutos.");
    };

    // ESTRATEGIA DE CACHE BUSTING:
    // Añadimos un timestamp a la URL para forzar al navegador a pedir una copia fresca al servidor.
    // Esto es vital porque si el navegador tiene la imagen en caché SIN las cabeceras CORS (de antes de tu configuración),
    // seguirá fallando aunque el servidor ya esté arreglado.
    if (imageUrl.startsWith('http')) {
        const separator = imageUrl.includes('?') ? '&' : '?';
        image.src = `${imageUrl}${separator}t=${new Date().getTime()}`;
    } else {
        image.src = imageUrl;
    }
  }, [imageUrl]);
  
  const onImageRendered = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const imageRect = img.getBoundingClientRect();
    
    const bounds = {
        left: imageRect.left - containerRect.left,
        top: imageRect.top - containerRect.top,
        width: imageRect.width,
        height: imageRect.height,
    };
    setImageBounds(bounds);

    const size = Math.min(bounds.width, bounds.height) * 0.9;
    setCropBox({
        x: bounds.left + (bounds.width - size) / 2,
        y: bounds.top + (bounds.height - size) / 2,
        size: size,
    });
  };

  const handleDragPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setStartDrag({ x: e.clientX, y: e.clientY, cropX: cropBox.x, cropY: cropBox.y, cropSize: cropBox.size });
  };
  
  const handleResizePointerDown = (e: PointerEvent<HTMLDivElement>, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handle);
    setStartDrag({ x: e.clientX, y: e.clientY, cropX: cropBox.x, cropY: cropBox.y, cropSize: cropBox.size });
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      let newX = startDrag.cropX + (e.clientX - startDrag.x);
      let newY = startDrag.cropY + (e.clientY - startDrag.y);

      newX = Math.max(imageBounds.left, Math.min(imageBounds.left + imageBounds.width - cropBox.size, newX));
      newY = Math.max(imageBounds.top, Math.min(imageBounds.top + imageBounds.height - cropBox.size, newY));

      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    } else if (activeHandle) {
      const dx = e.clientX - startDrag.x;
      const dy = e.clientY - startDrag.y;

      let newX = startDrag.cropX;
      let newY = startDrag.cropY;
      let newSize = startDrag.cropSize;

      if (activeHandle === 'bottom-right') {
        const delta = Math.max(dx, dy);
        newSize = startDrag.cropSize + delta;
      } else if (activeHandle === 'bottom-left') {
        const delta = Math.max(-dx, dy);
        newSize = startDrag.cropSize + delta;
        newX = startDrag.cropX - delta;
      } else if (activeHandle === 'top-right') {
        const delta = Math.max(dx, -dy);
        newSize = startDrag.cropSize + delta;
        newY = startDrag.cropY - delta;
      } else if (activeHandle === 'top-left') {
        const delta = Math.max(-dx, -dy);
        newSize = startDrag.cropSize + delta;
        newX = startDrag.cropX - delta;
        newY = startDrag.cropY - delta;
      }

      // Clamp size
      newSize = Math.max(MIN_CROP_SIZE, newSize);
      
      // Clamp position and size within bounds
      if (newX < imageBounds.left) {
        const overflow = imageBounds.left - newX;
        newX = imageBounds.left;
        newSize -= overflow;
      }
      if (newY < imageBounds.top) {
        const overflow = imageBounds.top - newY;
        newY = imageBounds.top;
        newSize -= overflow;
      }
      if (newX + newSize > imageBounds.left + imageBounds.width) {
        newSize = imageBounds.left + imageBounds.width - newX;
      }
      if (newY + newSize > imageBounds.top + imageBounds.height) {
        newSize = imageBounds.top + imageBounds.height - newY;
      }

      setCropBox({ x: newX, y: newY, size: newSize });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setActiveHandle(null);
  };

  const handleSaveCrop = () => {
    setIsSaving(true);
    const image = originalImageRef.current;
    const displayedImage = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !displayedImage || !canvas) {
      setIsSaving(false); return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsSaving(false); return;
    }

    const scale = image.naturalWidth / displayedImage.width;
    const sourceX = (cropBox.x - imageBounds.left) * scale;
    const sourceY = (cropBox.y - imageBounds.top) * scale;
    const sourceSize = cropBox.size * scale;

    canvas.width = FINAL_CROP_SIZE;
    canvas.height = FINAL_CROP_SIZE;
    ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, FINAL_CROP_SIZE, FINAL_CROP_SIZE);
    
    onSave(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 animate-in fade-in duration-300">
      <div className="w-full h-full bg-[#0d0d0d] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="px-6 md:px-12 py-6 md:py-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-neon/10 border border-neon/20 rounded-2xl flex items-center justify-center text-neon shadow-[0_0_20px_rgba(0,255,157,0.1)]">
              <Crop size={24} className="md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-oswald font-black text-white uppercase italic tracking-tighter leading-none">
                EDITAR ENCUADRE
              </h2>
              <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mt-1 md:mt-2">
                Ajusta el área visible de la imagen
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 md:p-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
          >
            <X size={24} className="md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col items-center justify-center">
          <div className="max-w-4xl w-full flex flex-col items-center">
            <div 
                ref={containerRef}
                className="relative w-full aspect-square md:aspect-video bg-black rounded-[32px] flex items-center justify-center overflow-hidden touch-none shadow-2xl border border-white/5"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
              {!isImageLoaded && !error && <Loader2 className="w-12 h-12 animate-spin text-neon" />}
              {error && <div className="text-center p-8 bg-red-500/5 rounded-3xl border border-red-500/10"><AlertTriangle className="w-12 h-12 text-red-500 mb-4 mx-auto" /><p className="text-sm text-red-400 max-w-xs font-bold uppercase tracking-widest">{error}</p></div>}
              
              {isImageLoaded && (
                <>
                  <img
                    ref={imageRef}
                    src={originalImageRef.current?.src || imageUrl}
                    onLoad={onImageRendered}
                    className="select-none pointer-events-none max-w-full max-h-full"
                    alt="Para recortar"
                  />
                  <div 
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{
                        width: cropBox.size, 
                        height: cropBox.size,
                        transform: `translate(${cropBox.x}px, ${cropBox.y}px)`,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.8)',
                    }}
                  />
                   <div 
                    className="absolute top-0 left-0 border-4 border-dashed border-neon cursor-grab active:cursor-grabbing shadow-[0_0_30px_rgba(0,255,157,0.3)]"
                    style={{
                        width: cropBox.size, 
                        height: cropBox.size,
                        transform: `translate(${cropBox.x}px, ${cropBox.y}px)`,
                    }}
                    onPointerDown={handleDragPointerDown}
                  >
                    <div onPointerDown={e => handleResizePointerDown(e, 'top-left')} className="absolute -top-3 -left-3 w-6 h-6 bg-neon border-2 border-black rounded-full cursor-nwse-resize shadow-lg" />
                    <div onPointerDown={e => handleResizePointerDown(e, 'top-right')} className="absolute -top-3 -right-3 w-6 h-6 bg-neon border-2 border-black rounded-full cursor-nesw-resize shadow-lg" />
                    <div onPointerDown={e => handleResizePointerDown(e, 'bottom-left')} className="absolute -bottom-3 -left-3 w-6 h-6 bg-neon border-2 border-black rounded-full cursor-nesw-resize shadow-lg" />
                    <div onPointerDown={e => handleResizePointerDown(e, 'bottom-right')} className="absolute -bottom-3 -right-3 w-6 h-6 bg-neon border-2 border-black rounded-full cursor-nwse-resize shadow-lg" />
                  </div>
                </>
              )}
            </div>
            
            <p className="text-xs md:text-sm text-gray-500 text-center mt-8 uppercase font-black tracking-[0.3em] opacity-50">
              Arrastra para mover • Esquinas para redimensionar
            </p>
            
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12 w-full max-w-2xl">
              <button 
                onClick={onClose} 
                className="flex-1 py-5 bg-white/5 text-gray-400 text-sm font-black rounded-2xl hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleSaveCrop} 
                disabled={isSaving || !isImageLoaded} 
                className="flex-1 py-5 bg-neon text-black text-sm font-black uppercase italic tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_10px_40px_rgba(0,255,157,0.3)]"
              >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {isSaving ? 'GUARDANDO...' : 'GUARDAR ENCUADRE'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};