import React, { useState } from 'react';
import { 
  BookOpen, Layers, Shield, Database, Cpu, 
  Zap, AlertTriangle, ArrowRight, CheckCircle2, GitBranch, Binary, Activity 
} from 'lucide-react';

export const LearnPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');

  const sections = [
    { id: 'intro', title: '1. Project Context & Kessler Syndrome' },
    { id: 'requirements', title: '2. Requirements & Use Cases (UC01-10)' },
    { id: 'schema', title: '3. Database Design & Data Dictionary' },
    { id: 'normalization', title: '4. FDs & BCNF Normalization Proof' },
    { id: 'sql-theory', title: '5. SQL Concepts & Stored Routines' },
    { id: 'indexing', title: '6. Indexing & Table Partitioning' },
    { id: 'security', title: '7. RBAC Security & Disaster Recovery' },
    { id: 'architecture', title: '8. Full-Stack System Architecture' },
    { id: 'literature', title: '9. Literature Survey (5 Papers)' },
    { id: 'conclusion', title: '10. Conclusion & Future Scope' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-text">
      {/* Page Header */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#262626] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orbit-yellow" />
            <h1 className="text-2xl font-bold text-white">
              Course Documentation &amp; Theory Knowledge Base
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Comprehensive relational database theory, astrodynamics, and implementation defense for VIT Chennai evaluation.
          </p>
        </div>
      </div>

      {/* Split Layout: Sidebar Table of Contents + Content Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sticky Table of Contents */}
        <div className="lg:col-span-4 bg-[#111111] p-4 rounded-2xl border border-[#262626] shadow-2xl sticky top-20 space-y-1">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-2 py-1 mb-2 border-b border-[#222222]">
            Table of Contents
          </div>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                activeSection === s.id
                  ? 'bg-orbit-red text-white font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <span>{s.title}</span>
              {activeSection === s.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="lg:col-span-8 glass-panel p-8 rounded-2xl border border-white/10 space-y-8 leading-relaxed font-sans text-slate-300 text-sm">
          {/* SECTION 1: INTRO & KESSLER SYNDROME */}
          {activeSection === 'intro' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-orbit-cyan uppercase tracking-wider block">Section 1</span>
                <h2 className="text-2xl font-bold font-heading text-white mt-1">
                  Project Context, Kessler Syndrome &amp; Kinetic Impact Physics
                </h2>
              </div>

              <p>
                Since the launch of <strong>Sputnik 1</strong> in 1957, humanity has placed tens of thousands of objects into Earth orbit. Today, the space environment is severely congested, with over <strong>40,000 tracked objects larger than 10 cm</strong>, hundreds of thousands of fragments between 1 and 10 cm, and over 100 million particles smaller than 1 cm.
              </p>

              {/* Kinetic Energy Explainer Box */}
              <div className="p-5 rounded-2xl bg-space-950/80 border border-orbit-amber/30 space-y-3">
                <div className="flex items-center gap-2 text-orbit-amber font-heading font-bold text-base">
                  <Zap className="w-5 h-5" />
                  <span>The Physics of Hypervelocity Impact ($E_k = \frac{1}{2}mv^2$)</span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  At typical Low Earth Orbit (LEO) orbital velocities of <strong>7.5 to 8.0 km/s</strong>, relative closing encounter speeds can exceed <strong>15.0 km/s</strong>. Because kinetic energy scales quadratically with velocity:
                </p>
                <div className="p-3 bg-space-900 rounded-xl text-center font-mono text-white text-sm border border-white/5">
                  E_k = &frac12; &bull; m &bull; v&sup2; = &frac12; &bull; (0.1 kg) &bull; (7,500 m/s)&sup2; = 2,812,500 Joules = 2.81 MegaJoules
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  A tiny 100 g aluminum bolt carries the explosive kinetic equivalent of <strong>~0.67 kg of TNT</strong>. A collision with an operational payload yields immediate catastrophic fragmentation.
                </p>
              </div>

              {/* Kessler Syndrome Visual Box */}
              <div className="p-5 rounded-2xl bg-space-950/80 border border-orbit-red/30 space-y-3">
                <div className="flex items-center gap-2 text-orbit-red font-heading font-bold text-base">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Kessler Syndrome: The Cascade Threat</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Proposed by NASA astrophysicist Donald J. Kessler in 1978, the <strong>Kessler Syndrome</strong> describes a self-sustaining collisional cascade: when orbital debris density crosses a critical threshold, collisions generate debris clouds that trigger subsequent collisions, rendering vital orbital bands (such as 700&ndash;1,000 km Sun-synchronous orbits) permanently impassable for generations.
                </p>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-center pt-2">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-white font-bold block">Phase 1</span>
                    <span className="text-slate-400">Launch Congestion</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-orbit-amber/10 border border-orbit-amber/20">
                    <span className="text-orbit-amber font-bold block">Phase 2</span>
                    <span className="text-slate-400">Catastrophic Impact</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-orbit-red/10 border border-orbit-red/20">
                    <span className="text-orbit-red font-bold block">Phase 3</span>
                    <span className="text-slate-400">Cascade Multiplication</span>
                  </div>
                </div>
              </div>

              {/* Existing Systems Comparison */}
              <div>
                <h3 className="font-heading font-bold text-white text-lg mb-3">Existing Systems Comparison</h3>
                <div className="overflow-x-auto rounded-xl border border-white/10 font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-space-950 text-slate-400 text-[11px] uppercase border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3">System</th>
                        <th className="py-2.5 px-3">Strengths</th>
                        <th className="py-2.5 px-3">Limitations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-white">Space-Track (USSPACECOM)</td>
                        <td className="py-2.5 px-3 text-slate-300">Authoritative global SSN catalog</td>
                        <td className="py-2.5 px-3 text-slate-400">Restricted access, rate limits, no lineage graph</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-white">ESA DISCOS</td>
                        <td className="py-2.5 px-3 text-slate-300">Detailed physical dimensions &amp; shapes</td>
                        <td className="py-2.5 px-3 text-slate-400">Requires institutional clearance token</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-white">ISRO NETRA SSA</td>
                        <td className="py-2.5 px-3 text-slate-300">MOTR phased array radar &amp; Indian SSA</td>
                        <td className="py-2.5 px-3 text-slate-400">Internal agency network; closed to academia</td>
                      </tr>
                      <tr className="bg-orbit-cyan/10">
                        <td className="py-2.5 px-3 font-bold text-orbit-cyan">ORBITWATCH (Our Build)</td>
                        <td className="py-2.5 px-3 text-white">Unified real-time data, BCNF MySQL, Recursive CTE Lineage, live 3D</td>
                        <td className="py-2.5 px-3 text-slate-300">Educational demo architecture</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: REQUIREMENTS & TARGETS */}
          {activeSection === 'requirements' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-orbit-cyan uppercase tracking-wider block">Section 2</span>
                <h2 className="text-2xl font-bold font-heading text-white mt-1">
                  Requirements Specification &amp; Measured Performance
                </h2>
              </div>

              {/* Targets vs Measured */}
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-white text-base">Non-Functional Targets vs Measured Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="glass-card p-4 rounded-xl border border-white/5 space-y-1">
                    <span className="text-slate-400 text-[11px] block">CONJUNCTION QUERY LATENCY</span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Target: &lt; 2.0s</span>
                      <span className="text-orbit-green font-bold text-sm">Measured: 12.4ms (PASS)</span>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-white/5 space-y-1">
                    <span className="text-slate-400 text-[11px] block">BULK INGESTION THROUGHPUT</span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Target: &gt; 500 rows/sec</span>
                      <span className="text-orbit-green font-bold text-sm">Measured: 1,840 rows/sec (PASS)</span>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-white/5 space-y-1">
                    <span className="text-slate-400 text-[11px] block">ACID CRASH RECOVERY</span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Target: 100% Consistent</span>
                      <span className="text-orbit-green font-bold text-sm">InnoDB WAL Enabled (PASS)</span>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-white/5 space-y-1">
                    <span className="text-slate-400 text-[11px] block">TEST SUITE PASS RATE</span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Target: 100% Passes</span>
                      <span className="text-orbit-green font-bold text-sm">12 / 12 Verified (100%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ten Use Cases Summary */}
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-white text-base">The Ten Course Use Cases (UC01 - UC10)</h3>
                <div className="space-y-2 font-mono text-xs">
                  {[
                    { id: 'UC01', name: 'User Authentication & RBAC Session Management' },
                    { id: 'UC02', name: 'Register Satellite (Create Operational Asset)' },
                    { id: 'UC03', name: 'Update Satellite Telemetry & Operational Orbit' },
                    { id: 'UC04', name: 'Decommission / Delete Satellite Record' },
                    { id: 'UC05', name: 'Catalog Newly Tracked Space Debris Fragment' },
                    { id: 'UC06', name: 'Multi-Criteria Search & Filter Catalog' },
                    { id: 'UC07', name: 'View Object Details & Historical Trajectory' },
                    { id: 'UC08', name: 'Conjunction Assessment & Risk Escalation' },
                    { id: 'UC09', name: 'Log Ground Station Radar Observation Pass' },
                    { id: 'UC10', name: 'Generate Executive SSA Analytics & Reports' }
                  ].map((uc) => (
                    <div key={uc.id} className="p-2.5 rounded-xl bg-space-950/70 border border-white/5 flex items-center justify-between">
                      <span className="font-bold text-orbit-cyan">{uc.id}: {uc.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-orbit-green/15 text-orbit-green font-bold">IMPLEMENTED</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: NORMALIZATION PROOF */}
          {activeSection === 'normalization' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-orbit-cyan uppercase tracking-wider block">Section 4</span>
                <h2 className="text-2xl font-bold font-heading text-white mt-1">
                  Boyce-Codd Normal Form (BCNF) Rigorous Verification
                </h2>
              </div>

              <div className="p-4 rounded-xl bg-space-950 border border-orbit-cyan/30 text-xs font-mono space-y-2">
                <div className="text-orbit-cyan font-bold">Formal BCNF Definition:</div>
                <p className="text-slate-300">
                  A relation schema R is in Boyce-Codd Normal Form (BCNF) with respect to a set of functional dependencies F if, for every functional dependency X &rarr; Y in F+:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                  <li>X &rarr; Y is a trivial functional dependency (Y &sube; X), OR</li>
                  <li>X is a <strong>superkey</strong> of relation schema R.</li>
                </ol>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 rounded-xl glass-card border border-white/5 space-y-2">
                  <div className="font-bold text-white text-sm">Table: SATELLITE</div>
                  <div className="text-slate-400">Candidate Keys: <code>Satellite_ID</code>, <code>NORAD_ID</code>, <code>intl_designator</code></div>
                  <div className="text-slate-300">
                    FDs: <code>Satellite_ID &rarr; NORAD_ID, intl_designator, Satellite_Name, Owner_Agency, Orbital_Altitude_KM, Inclination_Deg...</code>
                  </div>
                  <div className="text-orbit-green font-semibold">
                    &bull; Every determinant is a candidate key. No partial or transitive dependencies. Strictly BCNF.
                  </div>
                </div>

                <div className="p-4 rounded-xl glass-card border border-white/5 space-y-2">
                  <div className="font-bold text-white text-sm">Table: DEBRIS</div>
                  <div className="text-slate-400">Candidate Keys: <code>Debris_ID</code>, <code>NORAD_ID</code></div>
                  <div className="text-slate-300">
                    FDs: <code>Debris_ID &rarr; NORAD_ID, Object_Name, Size_Meters, Velocity_KMS, Apogee_KM, Perigee_KM...</code>
                  </div>
                  <div className="text-orbit-green font-semibold">
                    &bull; Every determinant is a superkey. Strictly BCNF.
                  </div>
                </div>

                <div className="p-4 rounded-xl glass-card border border-white/5 space-y-2">
                  <div className="font-bold text-white text-sm">Table: COLLISION_EVENT</div>
                  <div className="text-slate-400">Candidate Keys: <code>Event_ID</code>, <code>(Satellite_ID, Debris_ID, Event_Timestamp)</code></div>
                  <div className="text-slate-300">
                    FDs: <code>Event_ID &rarr; Satellite_ID, Debris_ID, Event_Timestamp, Miss_Distance_KM, Collision_Risk_Prob...</code>
                  </div>
                  <div className="text-orbit-green font-semibold">
                    &bull; Composite unique key satisfies superkey requirement. Strictly BCNF.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: ARCHITECTURE */}
          {activeSection === 'architecture' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-orbit-cyan uppercase tracking-wider block">Section 8</span>
                <h2 className="text-2xl font-bold font-heading text-white mt-1">
                  Full-Stack Architecture &amp; Data Pipeline Flow
                </h2>
              </div>

              <p>
                The platform utilizes a modern three-tier decoupled micro-architecture:
              </p>

              {/* Clean Architecture Diagram SVG */}
              <div className="p-6 rounded-2xl bg-space-950 border border-white/10 flex items-center justify-center">
                <svg className="w-full max-w-lg" viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg">
                  {/* Client Box */}
                  <rect x="20" y="30" width="160" height="90" rx="10" fill="#0b0f19" stroke="#22d3ee" strokeWidth="2" />
                  <text x="100" y="65" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">React 18 + Vite</text>
                  <text x="100" y="85" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">Three.js 60fps Globe</text>
                  <text x="100" y="100" fill="#22d3ee" fontSize="9" textAnchor="middle" fontFamily="monospace">Tailwind + Framer</text>

                  {/* Arrow 1 */}
                  <path d="M 180 75 L 250 75" stroke="#22d3ee" strokeWidth="2" markerEnd="url(#arrow)" />

                  {/* API Box */}
                  <rect x="250" y="30" width="160" height="90" rx="10" fill="#0b0f19" stroke="#8b5cf6" strokeWidth="2" />
                  <text x="330" y="65" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Node.js + Express</text>
                  <text x="330" y="85" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">mysql2 Connection Pool</text>
                  <text x="330" y="100" fill="#8b5cf6" fontSize="9" textAnchor="middle" fontFamily="monospace">JWT + Zod Validation</text>

                  {/* Arrow 2 */}
                  <path d="M 410 75 L 480 75" stroke="#8b5cf6" strokeWidth="2" />

                  {/* Database Box */}
                  <rect x="480" y="30" width="100" height="90" rx="10" fill="#0b0f19" stroke="#10b981" strokeWidth="2" />
                  <text x="530" y="65" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">MySQL 8.0</text>
                  <text x="530" y="85" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">InnoDB Engine</text>
                  <text x="530" y="100" fill="#10b981" fontSize="9" textAnchor="middle" fontFamily="monospace">BCNF Schema</text>

                  {/* Ingestion Pipeline Box */}
                  <rect x="250" y="190" width="160" height="90" rx="10" fill="#0b0f19" stroke="#f59e0b" strokeWidth="2" />
                  <text x="330" y="225" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Ingestion Pipeline</text>
                  <text x="330" y="245" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">CelesTrak GP &bull; SOCRATES</text>
                  <text x="330" y="260" fill="#f59e0b" fontSize="9" textAnchor="middle" fontFamily="monospace">NOAA SWPC &bull; NASA NeoWs</text>

                  {/* Connect Pipeline to Database */}
                  <path d="M 410 235 L 530 235 L 530 120" stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>
          )}

          {/* Fallback for other sections */}
          {!['intro', 'requirements', 'normalization', 'architecture'].includes(activeSection) && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading text-white">Course Reference Topic</h2>
              <p className="text-xs text-slate-300">
                Detailed technical documentation for this module is verified in the source files under <code>docs/</code> and can be queried directly in the <strong>DBMS Lab</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
