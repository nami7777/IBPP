
import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { ChevronLeft, ChevronRight, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface StudyModeProps {
  questions: Question[];
  onExit: () => void;
}

const StudyMode: React.FC<StudyModeProps> = ({ questions, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [revealedParts, setRevealedParts] = useState<string[]>([]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    setShowAnswer(false);
    setRevealedParts([]);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const revealPartAnswer = (partId: string) => {
    if (!revealedParts.includes(partId)) {
      setRevealedParts([...revealedParts, partId]);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-slate-950 text-slate-100">
        <h2 className="text-3xl font-bold mb-4 tracking-tight">No Questions Found</h2>
        <p className="text-slate-400 mb-8 max-w-md">Adjust your advanced filters to start a study session.</p>
        <button onClick={onExit} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors">Back to Library</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-slate-800 p-4 flex justify-between items-center shadow-lg z-10">
        <div className="flex items-center gap-6">
          <button onClick={onExit} className="text-slate-400 hover:text-white font-medium flex items-center gap-2 transition-colors">
             <ChevronLeft size={20} /> <span className="hidden md:inline">End Session</span>
          </button>
          <div className="h-6 w-px bg-slate-800"></div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Study Mode</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="text-cyan-400 font-mono">{currentIndex + 1} / {questions.length}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className={`text-xs font-bold px-2 py-1 rounded uppercase border ${currentQuestion.difficulty === 'Easy' ? 'border-green-500/30 text-green-400 bg-green-500/10' : currentQuestion.difficulty === 'Hard' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'}`}>
              {currentQuestion.difficulty}
           </div>
           <div className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
             {currentQuestion.year === 'Unknown' && currentQuestion.month === 'Unknown' ? 'Unknown Date' :
              currentQuestion.year === 'Unknown' ? currentQuestion.month :
              currentQuestion.month === 'Unknown' ? currentQuestion.year :
              `${currentQuestion.year} ${currentQuestion.month}`}
              {' '}• {currentQuestion.paperType}
           </div>
        </div>
      </div>

      {/* Main Card Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center custom-scrollbar">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Paper 1 View */}
          {currentQuestion.paperType === 'Paper 1' && (
            <div className="bg-slate-900 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden border border-slate-800">
              <div className="p-6 border-b border-slate-800 bg-slate-900">
                <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-4">Question</h3>
                {currentQuestion.p1QuestionImage ? (
                  <img src={currentQuestion.p1QuestionImage} alt="Question" className="w-full rounded-xl border border-slate-700" />
                ) : (
                   <div className="p-12 text-center text-slate-600 bg-slate-950/50 rounded-xl border border-slate-800 border-dashed">No Image Available</div>
                )}
              </div>
              
              <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest">Answer</h3>
                  <button 
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-bold uppercase tracking-wide bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/30 transition-all"
                  >
                    {showAnswer ? <><EyeOff size={16} /> Hide</> : <><Eye size={16} /> Reveal</>}
                  </button>
                </div>

                {showAnswer && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                    {currentQuestion.p1AnswerType === 'Selection' ? (
                      <div className="flex justify-center py-10">
                        <div className="w-32 h-32 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-6xl font-black border-4 border-green-500/50 shadow-[0_0_30px_rgba(74,222,128,0.2)]">
                          {currentQuestion.p1AnswerSelection}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-green-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(74,222,128,0.1)]">
                        <img src={currentQuestion.p1AnswerImage || ''} alt="Answer" className="w-full" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paper 2 View */}
          {currentQuestion.paperType === 'Paper 2/1-b' && (
             <div className="space-y-8">
               {currentQuestion.parts?.map((part, idx) => (
                 <div key={part.id} className="bg-slate-900 rounded-3xl shadow-xl shadow-black/40 overflow-hidden border border-slate-800">
                    <div className="p-5 bg-slate-800/50 border-b border-slate-700 flex items-center gap-4">
                      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-lg uppercase shadow-inner">
                        {part.label}
                      </span>
                      <span className="text-slate-300 font-medium tracking-wide">Part {part.label.toUpperCase()}</span>
                    </div>
                    
                    <div className="p-6">
                      {part.questionImage && (
                        <img src={part.questionImage} className="w-full rounded-xl border border-slate-700 mb-8 shadow-md" alt="Question Part" />
                      )}
                      
                      <div className="pt-6 border-t border-slate-800">
                        {!revealedParts.includes(part.id) ? (
                           <button 
                            onClick={() => revealPartAnswer(part.id)}
                            className="w-full py-4 bg-slate-800 text-cyan-400 rounded-xl font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                           >
                             <Eye size={20} /> Reveal Answer
                           </button>
                        ) : (
                          <div className="animate-in fade-in zoom-in-95 duration-500">
                            <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-3">Markscheme</h4>
                            {part.answerImage ? (
                              <img src={part.answerImage} className="w-full rounded-xl border-2 border-green-500/30 shadow-[0_0_20px_rgba(74,222,128,0.1)]" alt="Answer" />
                            ) : (
                              <div className="p-6 bg-slate-950/50 text-slate-500 text-center rounded-xl border border-slate-800 border-dashed">No Answer Image</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          )}

        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-slate-900/90 backdrop-blur border-t border-slate-800 p-5 flex justify-center gap-8 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-20">
         <button 
           onClick={handlePrev}
           disabled={currentIndex === 0}
           className="w-14 h-14 flex items-center justify-center rounded-full border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
         >
           <ChevronLeft size={28} />
         </button>
         
         <button 
           onClick={handleNext}
           disabled={currentIndex === questions.length - 1}
           className="w-14 h-14 flex items-center justify-center rounded-full bg-cyan-600 text-white hover:bg-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
         >
           <ChevronRight size={28} />
         </button>
      </div>
    </div>
  );
};

export default StudyMode;
