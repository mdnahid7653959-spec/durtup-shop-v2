import { memo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

function AppDownloadBannerComponent() {
  const { isInstalled, openPrompt } = usePWAInstall();

  if (isInstalled) return null;

  return (
    <section className="w-full px-3 sm:px-4 py-1 sm:py-1.5">
      <div className="max-w-7xl mx-auto rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-primary p-3 sm:p-3.5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 border border-orange-400/40">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-white/90 overflow-hidden">
            <img
              src="/icon-192.png"
              alt="Durtup App"
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/apple-touch-icon.png";
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">Durtup Mobile App</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                Free App
              </span>
            </div>
            <p className="text-xs text-white/95 mt-0.5 truncate max-w-sm sm:max-w-md">
              প্লে স্টোর ছাড়াই সরাসরি ফোনে ১ ক্লিকে ইনস্টল করে দ্রুত শপিং করুন
            </p>
          </div>
        </div>

        <Button
          onClick={openPrompt}
          className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 active:scale-95 font-bold text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-5 rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span>অ্যাপ ইনস্টল করুন (Install App)</span>
        </Button>
      </div>
    </section>
  );
}

export const AppDownloadBanner = memo(AppDownloadBannerComponent);
