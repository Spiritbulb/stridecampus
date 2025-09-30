import React from 'react';
import { ArrowRight, PieChart, Target, CheckCircleIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  const user = useAuth()
  
    return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated background elements - updated for white background */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-10 animate-pulse delay-200"
          style={{ backgroundColor: '#e1a58e' }}
        />
        <div 
          className="absolute top-40 right-32 w-24 h-24 rounded-full opacity-10"
          style={{ backgroundColor: '#f23b36' }}
        />
        <div 
          className="absolute bottom-32 left-16 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor: '#eb621e' }}
        />
        <div 
          className="absolute bottom-20 right-20 w-28 h-28 rounded-full opacity-10"
          style={{ backgroundColor: '#e1e1e1' }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Image Container Side */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center p-10">
          
            <img 
              src="/pexels-137666-710743.jpg" 
              alt="Stride Campus App" 
              className="w-full object-cover rounded-lg"
            />
          
        </div>

        {/* Welcome Information Side */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <div className="max-w-md mx-auto space-y-8">
            {/* Logo section */}
            <div className="space-y-6">
              <div className="relative">
                <div 
                  className="w-36 h-36 mx-auto rounded-full flex items-center justify-center border shadow-lg"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <img src="/logo.png" alt="Stride Campus" className="w-24 h-24" />
                </div>
              </div>
                     
              <div className="space-y-3">
                <h1 
                  className="text-5xl font-bold tracking-tight text-center"
                  style={{ color: '#282331' }}
                >
                  Stride Campus
                </h1>
                <div 
                  className="inline-block px-6 py-2 rounded-full text-lg font-medium"
                >
                  The best way to do your research
                </div>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-4 py-6">
              {[
                { icon: <Target />, label: 'Simple' },
                { icon: <CheckCircleIcon />, label: 'Verified' },
                { icon: <PieChart />, label: 'Reports' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="text-center p-3 rounded-2xl border"
                  style={{ 
                    backgroundColor: 'rgba(40, 35, 49, 0.03)',
                    borderColor: 'rgba(40, 35, 49, 0.1)'
                  }}
                >
                  <div className="text-2xl mb-1 flex justify-center" style={{ color: '#f23b36' }}>{item.icon}</div>
                  <div className="text-sm font-medium" style={{ color: '#282331' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
                 
            {/* CTA Button with enhanced styling */}
            <button
              onClick={onGetStarted}
              className="relative group px-10 py-4 rounded-full font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-500 flex items-center gap-3 mx-auto overflow-hidden"
              style={{ 
                backgroundColor: '#f23b36',
                color: 'white'
              }}
            >
              {/* Button gradient overlay */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(45deg, #f23b36, #eb621e)`
                }}
              />
              
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                Get Started
              </span>
              <ArrowRight 
                size={22} 
                className="relative z-10 group-hover:translate-x-2 group-hover:text-white transition-all duration-300" 
              />
              
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-30 group-active:scale-110 transition-all duration-200" 
                   style={{ backgroundColor: '#f23b36' }} 
              />
            </button>

            {/* Bottom accent */}
            <div className="flex justify-center space-x-2 pt-4">
              {['#f23b36', '#eb621e', '#e1a58e'].map((color, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ 
                    backgroundColor: color,
                    animationDelay: `${index * 0.5}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
};