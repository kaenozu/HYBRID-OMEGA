
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { chatWithAI } from '../services/geminiService';

interface AIAssistantProps {
  context: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ context }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "QUANT-AI OMEGAへようこそ。リアルタイム分析に基づいた戦略的アドバイスを提供可能です。現在の市場状況やアルファ値について質問してください。" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatWithAI(userMsg, context);
      setMessages(prev => [...prev, { role: 'model', content: response || "解析エンジンから有効な応答が得られませんでした。" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "分析プロトコルにエラーが発生しました。接続を確認してください。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-[520px] overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <h3 className="font-black flex items-center gap-2 text-[11px] uppercase tracking-widest text-indigo-400">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          AI アナリスト・エージェント
        </h3>
        <span className="text-[9px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-700">PRO MODE</span>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/30"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
              <span className="text-[9px] text-slate-500 font-black ml-2 uppercase tracking-tighter">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="市場の不確実性について解析を依頼..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-5 pr-14 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-lg active:scale-95"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
