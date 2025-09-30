export const TypingIndicator = () => (
  <div className="py-6 px-6 bg-gray-50">
    <div className="flex items-start space-x-4 max-w-3xl mx-auto">
      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
        <img 
          src="https://media.stridecampus.com/avatar_f5d64dc3-a684-4347-8a9c-e851fadd6ff1.png" 
          alt="Nia" 
          className="w-7 h-auto object-contain rounded-lg"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 mb-1">Nia</div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  </div>
);