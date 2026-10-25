import React from 'react';
import { BuildingInfo } from '../types';
import { ArrowRight, Sparkles, MapPin, X } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BuildingInfoDockProps {
  building: BuildingInfo | null;
  onOpenBuilding: (id: BuildingInfo['id']) => void;
  onClose: () => void;
}

export const BuildingInfoDock: React.FC<BuildingInfoDockProps> = ({
  building,
  onOpenBuilding,
  onClose,
}) => {
  if (!building) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
      <div className="liquid-glass rounded-2xl p-4 shadow-2xl border border-white/30 backdrop-blur-2xl transition-all">
        <div className="flex items-start justify-between gap-3">
          {/* Building Icon and Badge */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg border border-white/30"
              style={{ backgroundColor: `${building.accentColor}33` }}
            >
              <span>{building.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-cyan-200 border border-white/20 uppercase tracking-wider">
                  {building.category}
                </span>
                {building.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-300 border border-amber-300/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {building.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-white tracking-tight mt-0.5 flex items-center gap-1.5 font-['Outfit']">
                {building.name}
              </h3>
              <p className="text-xs text-cyan-100 font-medium">{building.tagline}</p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/25 text-white/70 hover:text-white transition-colors"
            title="Tutup info"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-200 mt-2.5 line-clamp-2 leading-relaxed bg-black/15 p-2 rounded-xl border border-white/10">
          {building.description}
        </p>

        {/* Action Button */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-300 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Refleksia Island District
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenBuilding(building.id);
            }}
            className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/25 border border-white/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
          >
            Masuk Gedung <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
