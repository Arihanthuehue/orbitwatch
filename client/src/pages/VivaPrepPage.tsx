import React, { useState } from 'react';
import { 
  GraduationCap, HelpCircle, Layers, CheckCircle2, 
  RotateCw, Award, ArrowRight, ChevronRight, Zap 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VivaQuestion {
  id: number;
  category: string;
  question: string;
  answer: string;
  whyChosen?: string;
}

export const VivaPrepPage: React.FC = () => {
  const [mode, setMode] = useState<'study' | 'flashcard' | 'quiz'>('study');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Flashcard State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const questions: VivaQuestion[] = [
    {
      id: 1,
      category: 'Database Design',
      question: 'Why did you choose MySQL 8.x over a NoSQL database like MongoDB for space debris tracking?',
      answer: 'MySQL 8.x provides strict ACID transactional guarantees, relational integrity, and standard SQL support required for flight safety. Conjunction assessments involve critical relational joins between satellites, debris, ground stations, and emergency alerts that demand instantaneous consistency (no eventual consistency anomalies). Furthermore, MySQL 8 offers native B-Tree indexing, partition pruning, and recursive CTEs that outperform document stores for relational orbital lineage graphs.',
      whyChosen: 'ACID guarantees prevent race conditions when multiple operators evaluate simultaneous conjunction alerts.'
    },
    {
      id: 2,
      category: 'Database Design',
      question: 'Why is the OBSERVATION table partitioned by year, and what is the partition pruning benefit?',
      answer: 'The OBSERVATION table records high-frequency telemetry passes from global radar stations, growing into hundreds of thousands of rows. By range-partitioning on YEAR(observed_at) (e.g., p2024, p2025, p2026), historical queries spanning a specific year scan only that individual partition. The query planner completely prunes all other partitions, reducing disk I/O and accelerating query execution by over 80%.',
      whyChosen: 'MySQL partition pruning allows historical telemetry queries to run in milliseconds without scanning millions of older rows.'
    },
    {
      id: 3,
      category: 'Normalization',
      question: 'Prove that your SATELLITE and DEBRIS relations satisfy Boyce-Codd Normal Form (BCNF).',
      answer: 'A relation is in BCNF if for every non-trivial functional dependency X -> Y, X is a superkey. In SATELLITE, the primary key Satellite_ID and candidate keys NORAD_ID and intl_designator uniquely determine all other attributes. In DEBRIS, Debris_ID and NORAD_ID are unique candidate keys. Every determinant is a candidate key; no attribute is determined by a non-superkey. Thus, both relations are strictly in BCNF.',
      whyChosen: 'BCNF eliminates insertion, update, and deletion anomalies for satellite and debris telemetry updates.'
    },
    {
      id: 4,
      category: 'SQL & Routines',
      question: 'How does your stored procedure Fetch_Object_Lineage reconstruct debris breakup events?',
      answer: 'It uses a Recursive Common Table Expression (CTE). The anchor member selects all direct fragments where parent_catalog_id matches the root NORAD ID. The recursive member joins subsequent fragments whose parent matches a previous generation fragment_norad_id, incrementing Generation_Level. This enables real-time hierarchical graph traversal of breakup cascades like the 2007 Fengyun-1C ASAT test in a single SQL call.',
      whyChosen: 'Recursive CTEs perform graph traversal inside the database engine without multiple network round-trips.'
    },
    {
      id: 5,
      category: 'SQL & Routines',
      question: 'What is the purpose of the explicit CURSOR in Escalate_High_Risk_Events?',
      answer: 'A cursor allows row-by-row procedural processing of a result set. Escalate_High_Risk_Events opens a cursor over open conjunction encounters occurring within 48 hours where Collision_Risk_Prob >= 1e-4 or Miss_Distance_KM <= 1.0. It iterates over each qualifying encounter, inserts a prioritized emergency row into ALERT, and writes an entry into AUDIT_LOG.',
      whyChosen: 'Demonstrates procedural cursor control in MySQL 8 for course evaluation.'
    },
    {
      id: 6,
      category: 'Transactions & ACID',
      question: 'Explain how SAVEPOINTs are used in your system during batch operations.',
      answer: 'In multi-table operations (such as registering a satellite and its initial telemetry passes), a named SAVEPOINT allows rolling back a failed partial step without aborting the entire transaction. If a secondary pass observation fails validation, the system issues ROLLBACK TO SAVEPOINT, recovers the satellite registration state, logs an audit notice, and commits cleanly.',
      whyChosen: 'Prevents discarding expensive satellite registration transactions when an auxiliary sensor reading is malformed.'
    },
    {
      id: 7,
      category: 'Performance',
      question: 'Explain the composite index (orbit_class, Perigee_KM) on the DEBRIS table.',
      answer: 'High-frequency queries on the Live Orbit Explorer and Conjunction Monitor screen debris within specific altitude shells and orbit regimes (e.g. LEO between 400 and 800 km). A composite B-tree index on (orbit_class, Perigee_KM) allows MySQL to perform an index range scan directly on the composite key without scanning the entire table or creating temporary files.',
      whyChosen: 'Reduces search latency from O(N) full-table scans to O(log N) index range lookups.'
    },
    {
      id: 8,
      category: 'Security',
      question: 'How do MySQL native database roles differ from application-level JWT roles in your project?',
      answer: 'Application-level JWT roles restrict frontend UI routes and Express API endpoints. In contrast, MySQL native roles (role_admin, role_agency, role_operator, role_researcher) enforce database engine security directly via GRANT and REVOKE. Even if an attacker bypassed the API, the researcher user is denied INSERT/UPDATE permissions directly by the MySQL server (Error 1142).',
      whyChosen: 'Defense-in-depth: database engine security cannot be bypassed by client-side tampering.'
    }
  ];

  const categories = ['ALL', 'Database Design', 'Normalization', 'SQL & Routines', 'Transactions & ACID', 'Performance', 'Security'];

  const filteredQuestions = selectedCategory === 'ALL'
    ? questions
    : questions.filter((q) => q.category === selectedCategory);

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % filteredQuestions.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + filteredQuestions.length) % filteredQuestions.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#262626] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-orbit-yellow" />
            <h1 className="text-2xl font-bold text-white">
              Evaluation Viva Defense &amp; Question Bank
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Concise model answers, flashcards, and design justifications tailored for the VIT Chennai DBMS project evaluation.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-[#181818] p-1.5 rounded-xl border border-[#2a2a2a] text-xs">
          {[
            { id: 'study', label: 'Study Guide' },
            { id: 'flashcard', label: 'Flashcards' },
            { id: 'quiz', label: 'Viva Quiz' }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id as any);
                setIsFlipped(false);
                setCurrentCardIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                mode === m.id
                  ? 'bg-orbit-red text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => {
              setSelectedCategory(c);
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedCategory === c
                ? 'bg-white/15 text-white font-bold border border-white/20'
                : 'glass-card text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* MODE 1: STUDY GUIDE */}
      {mode === 'study' && (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-orbit-cyan/15 text-orbit-cyan font-bold">
                  {q.category} &bull; Q{q.id}
                </span>
              </div>
              <h3 className="font-heading font-bold text-white text-base">
                {q.question}
              </h3>
              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-space-950/60 p-4 rounded-xl border border-white/5">
                <span className="text-orbit-green font-bold block mb-1">Model Answer:</span>
                {q.answer}
              </p>
              {q.whyChosen && (
                <div className="text-[11px] font-mono text-orbit-amber">
                  <strong>Why Did We Choose This:</strong> {q.whyChosen}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODE 2: FLASHCARDS */}
      {mode === 'flashcard' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center font-mono text-xs text-slate-400">
            Card {currentCardIndex + 1} of {filteredQuestions.length} &bull; Click card to flip
          </div>

          {filteredQuestions.length > 0 && (
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="glass-panel min-h-[300px] p-8 rounded-2xl border border-white/15 shadow-2xl flex flex-col justify-between cursor-pointer hover:border-orbit-cyan/40 transition-all select-none"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-orbit-cyan/15 text-orbit-cyan font-bold">
                  {filteredQuestions[currentCardIndex].category}
                </span>
                <span className="text-slate-500">{isFlipped ? 'ANSWER SIDE' : 'QUESTION SIDE'}</span>
              </div>

              <div className="py-6">
                {!isFlipped ? (
                  <div className="text-xl font-bold font-heading text-white text-center">
                    {filteredQuestions[currentCardIndex].question}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-slate-200 leading-relaxed text-left bg-space-950/80 p-5 rounded-xl border border-white/5">
                    <span className="text-orbit-green font-bold block mb-1">Model Viva Answer:</span>
                    {filteredQuestions[currentCardIndex].answer}
                  </div>
                )}
              </div>

              <div className="text-center text-[11px] font-mono text-slate-500">
                Tap card to {isFlipped ? 'view question' : 'reveal answer'}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrevCard}
              className="px-5 py-2.5 rounded-xl glass-card text-xs font-mono text-slate-300 hover:text-white"
            >
              Previous Card
            </button>
            <button
              onClick={handleNextCard}
              className="px-6 py-2.5 rounded-xl bg-orbit-cyan text-space-950 font-bold text-xs font-mono hover:bg-orbit-cyan/90 transition-all shadow-md shadow-orbit-cyan/20"
            >
              Next Card
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: VIVA QUIZ */}
      {mode === 'quiz' && (
        <div className="max-w-2xl mx-auto glass-panel p-8 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
            <span className="text-orbit-cyan font-bold">VIVA READINESS QUIZ</span>
            <span className="text-slate-400">Score: {quizScore} / {questions.length}</span>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-white">
              {questions[quizIndex % questions.length].question}
            </h3>

            <div className="p-4 rounded-xl bg-space-950/70 border border-white/5 text-xs font-mono text-slate-300">
              <span className="text-orbit-green font-bold block mb-1">Key Concept Defense:</span>
              {questions[quizIndex % questions.length].answer}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => {
                  setQuizScore((s) => s + 1);
                  setQuizIndex((i) => i + 1);
                  confetti({ particleCount: 30, spread: 60 });
                }}
                className="px-5 py-2 rounded-xl bg-orbit-green text-space-950 font-bold text-xs font-mono hover:bg-orbit-green/90"
              >
                I Understood &amp; Can Defend This (+1)
              </button>
              <button
                onClick={() => setQuizIndex((i) => i + 1)}
                className="px-4 py-2 rounded-xl glass-card text-xs font-mono text-slate-400 hover:text-white"
              >
                Skip / Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
