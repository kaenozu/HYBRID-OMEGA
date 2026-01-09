
import React from 'react';

interface UsageGuideProps {
  onClose: () => void;
}

const UsageGuide: React.FC<UsageGuideProps> = ({ onClose }) => {
  const steps = [
    {
      icon: "fa-chart-pie",
      title: "1. 銘柄を選択する",
      desc: "ヘッダーにある銘柄ボタン（NVDA, BTC/USDなど）をクリックして、分析したい対象を切り替えます。"
    },
    {
      icon: "fa-wand-magic-sparkles",
      title: "2. AI深層分析を実行",
      desc: "「AI深層分析」ボタンをクリックすると、Geminiが最新ニュースとチャートを解析し、強気・弱気の判定と戦略を提案します。"
    },
    {
      icon: "fa-money-bill-transfer",
      title: "3. シミュレーション取引",
      desc: "「クイック・トレード」パネルで数量を入力し、買い(LONG)または売り(SHORT)を選択して約定させます。"
    },
    {
      icon: "fa-comments",
      title: "4. AIに直接質問する",
      desc: "右下の「AIアナリスト・エージェント」に、「今のトレンドは？」や「サポートラインはどこ？」と日本語で自由に質問できます。"
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <i className="fa-solid fa-book-open text-white"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none">使いかたガイド</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Quick Start Guide</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                <i className={`fa-solid ${step.icon} text-sky-400 text-lg`}></i>
              </div>
              <div>
                <h4 className="font-bold text-slate-100 mb-1">{step.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-center">
          <button 
            onClick={onClose}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-10 py-3 rounded-full shadow-lg shadow-sky-900/20 transition-all active:scale-95"
          >
            ダッシュボードを開始
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageGuide;
