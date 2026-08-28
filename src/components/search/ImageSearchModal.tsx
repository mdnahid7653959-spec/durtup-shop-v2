import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  ShoppingBag, 
  SlidersHorizontal,
  X,
  Scan,
  Tag,
  Palette
} from "lucide-react";
import { analyzeProductImage, type ImageAnalysisResult } from "@/utils/imageSearch";
import { cn } from "@/lib/utils";

interface ImageSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectKeyword?: (keyword: string) => void;
}

export function ImageSearchModal({ open, onOpenChange, onSelectKeyword }: ImageSearchModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [showCameraStream, setShowCameraStream] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCameraStream(false);
  };

  useEffect(() => {
    if (!open) {
      stopCameraStream();
      setAnalyzing(false);
      setShowCameraStream(false);
      setAnalysisResult(null);
    }
  }, [open]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        mediaStreamRef.current = stream;
        setShowCameraStream(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 100);
      } else {
        cameraInputRef.current?.click();
      }
    } catch (err: any) {
      console.warn("Camera access fallback:", err);
      setCameraError("Camera stream unavailable on this browser. Opening device camera...");
      cameraInputRef.current?.click();
    }
  };

  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          stopCameraStream();
          handleFileChange(file);
        }
      }, "image/jpeg", 0.92);
    }
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    stopCameraStream();
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await analyzeProductImage(file);
      
      // Give realistic 600ms AI scan feeling, then reveal matched results directly inside modal!
      setTimeout(() => {
        setAnalyzing(false);
        setAnalysisResult(res);
      }, 650);
    } catch (err) {
      console.error("Failed to analyze image:", err);
      setAnalyzing(false);
    }
  };

  const handleViewAllResults = () => {
    if (!analysisResult) return;
    onOpenChange(false);
    const keyword = analysisResult.primaryKeyword || "smart watch";
    if (onSelectKeyword) {
      onSelectKeyword(keyword);
    } else {
      navigate(`/products?search=${encodeURIComponent(keyword)}&visualSearch=true`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card text-card-foreground p-0 overflow-hidden border border-border shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary via-orange-600 to-amber-600 p-5 text-white relative overflow-hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                ছবি দিয়ে খুঁজুন <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Visual Search</span>
              </DialogTitle>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                যেকোনো প্রোডাক্টের ছবি আপলোড বা লাইভ ক্যামেরা দিয়ে তুলুন, তাৎক্ষণিক মিল পাওয়া যাবে
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />

          {/* Live Camera Stream Mode */}
          {showCameraStream && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-primary shadow-xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[11px] font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Live Camera
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={capturePhotoFromStream}
                  className="flex-1 h-12 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Camera className="h-4 w-4" /> ছবি তুলুন (Snap Photo)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={stopCameraStream}
                  className="h-12 rounded-xl font-semibold border-border text-sm px-6"
                >
                  বাতিল
                </Button>
              </div>
            </div>
          )}

          {/* Upload Dropzone View (Initial state) */}
          {!analyzing && !showCameraStream && !analysisResult && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
                }}
                className={cn(
                  "border-2 border-dashed border-primary/40 hover:border-primary rounded-2xl p-8 sm:p-10 text-center",
                  "bg-muted/20 hover:bg-primary/[0.04] cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center"
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center mb-3 transition-colors">
                  <Upload className="h-8 w-8 transition-transform group-hover:-translate-y-0.5" />
                </div>
                <h4 className="text-base font-bold text-foreground">
                  প্রোডাক্টের ছবি এখানে আপলোড করুন
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  গ্যালারি থেকে ছবি বেছে নিন অথবা কম্পিউটার/ফোন থেকে ড্রপ করুন
                </p>
                <Badge variant="outline" className="mt-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  JPG • PNG • WEBP • Max 10MB
                </Badge>
              </div>

              {cameraError && (
                <p className="text-xs text-amber-600 text-center font-medium bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  {cameraError}
                </p>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl text-xs sm:text-sm font-bold border-border/80 hover:bg-muted transition-all flex items-center justify-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 text-primary" /> গ্যালারি থেকে নিন
                </Button>

                <Button
                  type="button"
                  className="h-12 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  onClick={startCamera}
                >
                  <Camera className="h-4 w-4" /> ক্যামেরা দিয়ে তুলুন
                </Button>
              </div>
            </div>
          )}

          {/* High-Tech AI Scanning Animation */}
          {analyzing && (
            <div className="py-12 text-center space-y-5">
              <div className="relative mx-auto w-28 h-28 rounded-2xl overflow-hidden border-2 border-primary shadow-xl bg-slate-950 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-transparent to-primary/30 animate-pulse" />
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 shadow-[0_0_15px_#eab308] animate-bounce top-1/2" />
                <Scan className="h-12 w-12 text-primary animate-pulse" />
              </div>

              <div>
                <h4 className="text-base font-extrabold text-foreground tracking-tight">
                  ছবি স্ক্যান ও প্রোডাক্ট ম্যাচিং হচ্ছে... 🔍
                </h4>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  ছবির কালার ও ধরন বিশ্লেষণ করে স্টোরের প্রোডাক্টের সাথে মিল খোঁজা হচ্ছে
                </p>
              </div>
            </div>
          )}

          {/* Instant Visual Match Results View */}
          {analysisResult && !analyzing && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Analysis Summary Header */}
              <div className="p-3.5 bg-muted/40 border rounded-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border bg-background shrink-0 shadow-sm">
                    <img
                      src={analysisResult.previewUrl}
                      alt="Uploaded search"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center font-bold py-0.5">
                      Your Photo
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" /> {analysisResult.confidence}% Match Found
                      </Badge>
                      {analysisResult.colorName && (
                        <Badge variant="outline" className="text-[10px] font-semibold gap-1">
                          <Palette className="h-2.5 w-2.5 text-primary" /> {analysisResult.colorName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-bold text-foreground truncate mt-1">
                      ক্যাটাগরি: {analysisResult.categoryHint}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAnalysisResult(null);
                    fileInputRef.current?.click();
                  }}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <RefreshCw className="h-3 w-3" /> অন্য ছবি দিন
                </Button>
              </div>

              {/* Matching Products List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> মিল থাকা প্রোডাক্টসমূহ (Matching Products)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {analysisResult.matchedProducts.map((item, idx) => (
                    <div
                      key={item.product.id || idx}
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/product/${item.product.slug || item.product.id}`);
                      }}
                      className="group p-2.5 bg-card border rounded-xl hover:border-primary hover:shadow-md transition-all cursor-pointer flex gap-3 items-center"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-lg border shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <Badge className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-1.5 py-0">
                            {item.matchScore}% Match
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-foreground truncate mt-0.5 group-hover:text-primary transition-colors">
                          {item.product.name}
                        </p>
                        <p className="text-xs font-black text-primary">
                          ৳{item.product.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View All Matches Button */}
              <Button
                type="button"
                onClick={handleViewAllResults}
                className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <span>সব মিল থাকা পণ্যগুলো দেখুন (View All Matches)</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
