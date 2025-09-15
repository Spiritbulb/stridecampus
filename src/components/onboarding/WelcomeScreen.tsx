import React from 'react';
import { Gift, ArrowRight, Star } from 'lucide-react';

interface WelcomeScreenProps {
  credits?: number;
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ credits = 120, onContinue }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-accent/90 to-warning/80 flex items-center justify-center p-6">
      <div className="text-center max-w-lg mx-auto space-y-8">
        {/* Gift Icon */}
        <div className="space-y-6">
          <div className="w-24 h-24 bg-primary-foreground/20 backdrop-blur-lg rounded-full mx-auto flex items-center justify-center border border-primary-foreground/30">
            <Gift className="w-12 h-12 text-primary-foreground" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-primary-foreground">Welcome gift!</h1>
            <div className="text-6xl font-bold text-primary-foreground">{credits}</div>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Credits to get you started on your survey journey
            </p>
          </div>
        </div>

        {/* How Credits Work */}
        <div className="bg-primary-foreground/10 backdrop-blur-lg rounded-3xl p-6 border border-primary-foreground/20">
          <h3 className="text-xl font-semibold text-primary-foreground mb-6">How credits work</h3>
          <div className="space-y-4 text-left">
            {[
              'Spend credits to publish your surveys',
              'Earn credits by answering surveys',
              'Invite friends to earn bonus credits'
            ].map((text, index) => (
              <div key={index} className="flex items-start gap-3">
                <Star className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <span className="text-primary-foreground/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onContinue}
          className="bg-primary-foreground text-accent px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto group"
        >
          Continue
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};