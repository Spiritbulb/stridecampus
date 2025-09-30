import { Minimize2, X } from "lucide-react";

interface HeaderProps {
  onClose: () => void;
}

export const Header = ({ onClose }: HeaderProps) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
        <img 
          src="https://media.stridecampus.com/avatar_f5d64dc3-a684-4347-8a9c-e851fadd6ff1.png" 
          alt="Nia" 
          className="w-8 h-auto object-contain"
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Nia</h2>
      </div>
    </div>
    <div className="flex items-center space-x-1">
      <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <X className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  </div>
);