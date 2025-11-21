import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Clipboard } from 'lucide-react';

interface ImagePasteUploaderProps {
  value: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
  height?: string;
  autoFocus?: boolean;
}

const ImagePasteUploader: React.FC<ImagePasteUploaderProps> = ({ 
  value, 
  onChange, 
  label = "Upload Image", 
  height = "h-48",
  autoFocus = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus if requested (e.g. when switching tabs)
  useEffect(() => {
    if (autoFocus && containerRef.current && !value) {
      containerRef.current.focus();
    }
  }, [autoFocus, value]);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let foundImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          handleFileChange(blob);
          foundImage = true;
        }
        break;
      }
    }
    if (!foundImage) {
      // Optional: Feedback if they pasted text instead of image
      // console.log("No image in clipboard");
    }
  };

  // Manual paste button for mobile or mouse-only users
  const handleManualPaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.some(type => type.startsWith('image/'))) {
          const blob = await item.getType(item.types.find(type => type.startsWith('image/'))!);
          handleFileChange(new File([blob], "pasted-image"));
          return;
        }
      }
      alert("No image found in clipboard.");
    } catch (err) {
      // Fallback instructions if browser blocks programmatic read
      alert("Click the box to focus it, then press Ctrl+V (Cmd+V) to paste.");
      containerRef.current?.focus();
    }
  };

  return (
    <div className="w-full group">
      {label && (
        <div className="flex justify-between items-end mb-2">
           <label className={`text-sm font-bold transition-colors ${isFocused ? 'text-cyan-400' : 'text-slate-400'}`}>{label}</label>
           {isFocused && !value && <span className="text-[10px] text-cyan-400 animate-pulse">Ready to Paste (Ctrl+V)</span>}
        </div>
      )}
      
      {value ? (
        <div className={`relative w-full ${height} bg-slate-900 rounded-xl border border-slate-700 overflow-hidden group-hover:border-slate-600 transition-all`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
          <img 
            src={value} 
            alt="Uploaded content" 
            className="w-full h-full object-contain relative z-10" 
          />
          
          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm z-20">
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="bg-red-500/20 text-red-400 border border-red-500/50 p-3 rounded-full hover:bg-red-600 hover:text-white hover:scale-110 transition-all shadow-lg shadow-red-900/50"
              title="Remove Image"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          tabIndex={0}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPaste={handlePaste}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
          className={`
            relative flex flex-col items-center justify-center w-full ${height} 
            rounded-xl border-2 border-dashed transition-all duration-300 outline-none cursor-pointer overflow-hidden
            ${isFocused || isDragging
              ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(34,211,238,0.15)] scale-[1.01]' 
              : 'border-slate-700 bg-slate-900/40 hover:bg-slate-800 hover:border-slate-600'
            }
          `}
        >
           {/* File Input (Hidden) */}
           <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            // Prevent clicking input from stealing focus logic if needed, 
            // but usually input click works fine. 
            // We stop propagation on the manual button to allow input click elsewhere.
          />
          
          <div className="flex flex-col items-center justify-center p-6 text-center pointer-events-none z-0">
            <div className={`
              w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-all duration-500
              ${isFocused 
                ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
                : 'bg-slate-800 text-slate-600'
              }
            `}>
              {isFocused ? <Clipboard className="w-8 h-8 animate-bounce" /> : <Upload className="w-8 h-8" />}
            </div>
            
            <h4 className={`font-bold text-lg mb-1 transition-colors ${isFocused ? 'text-cyan-400' : 'text-slate-300'}`}>
              {isFocused ? 'Ctrl+V to Paste' : 'Click to Upload'}
            </h4>
            <p className="text-xs text-slate-500 max-w-[200px]">
              Click here to activate, then paste your screenshot or drag & drop.
            </p>
          </div>

          {/* Manual Paste Button (Visual cue mainly) */}
          <button 
            type="button"
            onClick={handleManualPaste}
            className={`absolute top-3 right-3 z-20 p-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2
              ${isFocused 
                ? 'bg-cyan-500 text-white border-cyan-400 hover:bg-cyan-400' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
          >
            <Clipboard size={14} /> Paste
          </button>
        </div>
      )}
    </div>
  );
};

export default ImagePasteUploader;