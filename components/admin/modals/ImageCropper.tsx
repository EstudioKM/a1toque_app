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
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 lg:p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-4 lg:p-6 max-w-lg w-full flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-base lg:text-lg font-oswald font-black italic text-neon flex items-center gap-2 uppercase tracking-tight">
            <Crop size={18}/> EDITAR ENCUADRE
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-all"><X size={20}/></button>
        </div>
        
        <div 
            ref={containerRef}
            className="relative w-full h-[300px] lg:h-[512px] bg-black rounded-xl flex items-center justify-center overflow-hidden touch-none flex-1"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
          {!isImageLoaded && !error && <Loader2 className="w-8 h-8 animate-spin text-gray-500" />}
          {error && <div className="text-center p-4"><AlertTriangle className="w-8 h-8 text-red-500 mb-2 mx-auto" /><p className="text-xs text-red-400 max-w-xs">{error}</p></div>}
          
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
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                }}
              />
               <div 
                className="absolute top-0 left-0 border-2 border-dashed border-neon cursor-grab active:cursor-grabbing"
                style={{
                    width: cropBox.size, 
                    height: cropBox.size,
                    transform: `translate(${cropBox.x}px, ${cropBox.y}px)`,
                }}
                onPointerDown={handleDragPointerDown}
              >
                <div onPointerDown={e => handleResizePointerDown(e, 'top-left')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-neon border border-black cursor-nwse-resize" />
                <div onPointerDown={e => handleResizePointerDown(e, 'top-right')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-neon border border-black cursor-nesw-resize" />
                <div onPointerDown={e => handleResizePointerDown(e, 'bottom-left')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-neon border border-black cursor-nesw-resize" />
                <div onPointerDown={e => handleResizePointerDown(e, 'bottom-right')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-neon border border-black cursor-nwse-resize" />
              </div>
            </>
          )}
        </div>
        <p className="text-[9px] lg:text-xs text-gray-500 text-center mt-3 uppercase font-bold tracking-widest opacity-50">Arrastra para mover o las esquinas para redimensionar</p>
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex flex-col sm:flex-row justify-end gap-3 lg:gap-4 mt-6 flex-shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 bg-white/5 text-gray-400 text-[10px] lg:text-xs font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest">CANCELAR</button>
          <button onClick={handleSaveCrop} disabled={isSaving || !isImageLoaded} className="w-full sm:w-auto px-6 py-2.5 bg-neon text-black text-[10px] lg:text-xs font-black uppercase italic tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,157,0.2)]">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'GUARDANDO...' : 'GUARDAR ENCUADRE'}
          </button>
        </div>
      </div>
    </div>
  );
};