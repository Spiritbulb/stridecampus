export const WelcomeMessage = () => (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <img 
          src="https://media.stridecampus.com/avatar_f5d64dc3-a684-4347-8a9c-e851fadd6ff1.png" 
          alt="Nia" 
          className="w-16 h-auto object-contain"
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Hey there! 👋</h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        I'm Nia. Whether you need study tips, life advice, or just someone to rant to about uni stress - I'm here! 💯
      </p>
    </div>
  </div>
);