import { memo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

function TopAppInstallBannerComponent() {
  const { isInstalled, installApp, openPrompt } = usePWAInstall();

  // If already installed or opened in standalone app, do not render
  if (isInstalled) return null;

  const handleInstall = async () => {
    openPrompt();
    try {
      await installApp();
    } catch {
      openPrompt();
    }
  };

  return (
    <div className="block lg:hidden w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-xs border-b border-orange-700/20 select-none animate-in fade-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: App Icon + Title & description */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 shadow-sm flex items-center justify-center shrink-0 border border-white/90 overflow-hidden">
            <img
              src="/icon-192.png"
              alt="Durtup App"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/apple-touch-icon.png";
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                Durtup Mobile App
              </span>
              <span className="hidden xs:inline-block px-1.5 py-0.2 rounded-full bg-white/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shrink-0">
                Free App
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-white/90 truncate leading-tight mt-0.5">
              প্লে স্টোর ছাড়াই সরাসরি ফোনে ১ ক্লিকে ইনস্টল করুন
            </p>
          </div>
        </div>

        {/* Right: 1-Click Install Button */}
        <div className="shrink-0">
          <Button
            size="sm"
            onClick={handleInstall}
            className="h-7 sm:h-8 px-2.5 sm:px-4 rounded-lg sm:rounded-xl bg-white text-orange-600 hover:bg-orange-50 active:scale-95 font-black text-[11px] sm:text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-bounce text-orange-600" />
            <span>ইনস্টল করুন</span>
          </Button>
        </div>

      </div>
    </div>
  );
}

export const TopAppInstallBanner = memo(TopAppInstallBannerComponent);
