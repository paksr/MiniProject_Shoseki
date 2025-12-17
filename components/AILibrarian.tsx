import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { chatWithLibrarian } from '../services/geminiService';
import { ChatMessage } from '../types';

const AILibrarian: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Greetings. I am Shoseki, your library assistant. How may I assist your literary journey today?', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
        // Format history for Gemini
        const history = messages.map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.text }]
        }));

        const responseText = await chatWithLibrarian(history, userMsg.text);
        
        const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText || "I'm having trouble reading the archives right now.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      {/* Container aligned to bottom of relative parent (PhoneFrame) */}
      <div className="absolute bottom-0 left-0 w-full h-0 z-40 pointer-events-none">
          
          {/* Floating Action Button - Positioned above tab bar */}
          <button 
            onClick={() => setIsOpen(true)}
            className={`absolute bottom-28 right-4 pointer-events-auto p-4 bg-shoseki-brown text-white rounded-full shadow-lg hover:bg-shoseki-darkBrown transition-all duration-300 z-30 dark:bg-amber-800 dark:hover:bg-amber-900 ${isOpen ? 'scale-0' : 'scale-100'}`}
          >
            <Sparkles className="w-6 h-6" />
          </button>

          {/* Chat Window */}
          <div className={`absolute bottom-28 right-4 left-4 h-[500px] pointer-events-auto bg-white dark:bg-stone-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-40 border border-shoseki-sand dark:border-stone-700 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
            
            {/* Header */}
            <div className="bg-shoseki-brown dark:bg-stone-950 p-4 flex justify-between items-center text-white border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-yellow-200" />
                <span className="font-serif font-bold">Librarian</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-shoseki-cream/50 dark:bg-stone-900 no-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-shoseki-brown text-white rounded-br-none dark:bg-amber-800' 
                      : 'bg-stone-200 text-stone-800 rounded-bl-none dark:bg-stone-800 dark:text-stone-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                   <div className="bg-stone-100 dark:bg-stone-800 p-3 rounded-2xl rounded-bl-none text-stone-500 dark:text-stone-400 text-xs italic">
                     Consulting the archives...
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-900 flex gap-2">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask for a recommendation..."
                className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-shoseki-brown/50 text-sm dark:bg-stone-800 dark:border-stone-700 dark:text-white"
              />
              <button 
                type="submit" 
                disabled={isLoading || !inputText.trim()}
                className="p-2 bg-shoseki-brown text-white rounded-full hover:bg-shoseki-darkBrown disabled:opacity-50 transition-colors dark:bg-amber-800 dark:hover:bg-amber-700"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
      </div>
    </>
  );
};

export default AILibrarian;