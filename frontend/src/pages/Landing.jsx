import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

// ─────────────────────────────────────────────────────────────────────────────
// 3-D Isometric Kanban Dashboard Illustration
// Built entirely with SVG transforms. The isometric projection uses
// the standard 30° cabinet-style transform:
//   X-axis goes right-down  (cos30°, sin30°)  = (0.866, 0.5)
//   Y-axis goes left-down   (-cos30°, sin30°)  = (-0.866, 0.5)
//   Z-axis goes straight up = (0, -1)
// Every surface is hand-composed so the depth reads naturally.
// ─────────────────────────────────────────────────────────────────────────────

const IsometricKanban = () => {
  // Isometric projection helper
  const iso = (x, y, z) => ({
    x: (x - y) * 0.866,
    y: (x + y) * 0.5 - z,
  });

  // Shift everything so (0,0) sits at the SVG centre-top
  const OX = 280;
  const OY = 110;
  const pt = (x, y, z) => {
    const p = iso(x, y, z);
    return `${(p.x + OX).toFixed(2)},${(p.y + OY).toFixed(2)}`;
  };

  // Build polygon string from 3-D corners
  const face = (...corners) => corners.map(([x, y, z]) => pt(x, y, z)).join(' ');

  // Column geometry
  // Each column: x offset, colour set, cards
  const COLS = [
    {
      label: 'To Do',
      labelColor: '#6B7280',
      headerBg: '#F9FAFB',
      headerStroke: '#E5E7EB',
      bodyBg: '#FFFFFF',
      cards: [
        { title: 'Research phase', tag: 'Medium', tagColor: '#F59E0B', tagBg: '#FEF3C7', avatar: '#7C3AED' },
        { title: 'Wireframes',     tag: 'Low',    tagColor: '#10B981', tagBg: '#D1FAE5', avatar: '#2563EB' },
        { title: 'Tech stack',     tag: 'High',   tagColor: '#EF4444', tagBg: '#FEE2E2', avatar: '#DB2777' },
      ],
    },
    {
      label: 'In Progress',
      labelColor: '#2563EB',
      headerBg: '#EFF6FF',
      headerStroke: '#93C5FD',
      bodyBg: '#FAFEFF',
      cards: [
        { title: 'Auth system',  tag: 'Critical', tagColor: '#EF4444', tagBg: '#FEE2E2', avatar: '#059669' },
        { title: 'Board CRUD',   tag: 'High',     tagColor: '#EF4444', tagBg: '#FEE2E2', avatar: '#7C3AED' },
      ],
    },
    {
      label: 'Done',
      labelColor: '#059669',
      headerBg: '#ECFDF5',
      headerStroke: '#6EE7B7',
      bodyBg: '#FAFFFE',
      cards: [
        { title: 'Project setup', tag: 'Done', tagColor: '#059669', tagBg: '#D1FAE5', avatar: '#2563EB' },
        { title: 'UI components', tag: 'Done', tagColor: '#059669', tagBg: '#D1FAE5', avatar: '#DB2777' },
        { title: 'DB schema',     tag: 'Done', tagColor: '#059669', tagBg: '#D1FAE5', avatar: '#F59E0B' },
      ],
    },
  ];

  const COL_W   = 90;   // column width in iso units
  const COL_D   = 10;   // depth (thickness) of the board platform
  const COL_H   = 0;    // ground Z
  const PLATFORM_H = 6; // platform thickness
  const CARD_H  = 18;   // height of each card block
  const CARD_GAP = 4;
  const CARD_MARGIN_X = 6;
  const CARD_W  = COL_W - CARD_MARGIN_X * 2;
  const HEADER_H = 20;

  const colStartX = (i) => i * (COL_W + 8);
  const colStartY = 0;

  return (
    <svg
      viewBox="0 0 560 420"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 20px 60px rgba(37,99,235,0.13))' }}
      aria-label="WorkHive Kanban board — 3D isometric view"
    >
      <defs>
        {/* Subtle grid pattern for the platform top */}
        <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30) skewX(-30) scale(1,0.577)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#E0EAFF" strokeWidth="0.3" />
          <line x1="0" y1="0" x2="8" y2="0" stroke="#E0EAFF" strokeWidth="0.3" />
        </pattern>

        {/* Glow filter for active card */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Soft shadow for board */}
        <filter id="boardShadow" x="-5%" y="-5%" width="110%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#2563EB" floodOpacity="0.15" />
        </filter>

        {/* Card shadow */}
        <filter id="cardShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#111827" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* ── Base platform ──────────────────────────────────────────────────── */}
      {/* Top face */}
      <polygon
        points={face([0,0,PLATFORM_H],[280,0,PLATFORM_H],[280,COL_D*3+8,PLATFORM_H],[0,COL_D*3+8,PLATFORM_H])}
        fill="url(#grid)"
        stroke="#C7D9FF"
        strokeWidth="0.5"
        filter="url(#boardShadow)"
      />
      {/* Front face */}
      <polygon
        points={face([0,COL_D*3+8,0],[280,COL_D*3+8,0],[280,COL_D*3+8,PLATFORM_H],[0,COL_D*3+8,PLATFORM_H])}
        fill="#C7D9FF"
      />
      {/* Right face */}
      <polygon
        points={face([280,0,0],[280,COL_D*3+8,0],[280,COL_D*3+8,PLATFORM_H],[280,0,PLATFORM_H])}
        fill="#A5C0FA"
      />

      {/* ── Columns ────────────────────────────────────────────────────────── */}
      {COLS.map((col, ci) => {
        const cx  = colStartX(ci);
        const cy  = colStartY;
        const cz  = PLATFORM_H;
        const totalCards = col.cards.length;
        const colBodyH = HEADER_H + totalCards * (CARD_H + CARD_GAP) + CARD_GAP + 6;

        return (
          <g key={col.label} filter="url(#cardShadow)">
            {/* Column top face */}
            <polygon
              points={face([cx,cy,cz+colBodyH],[cx+COL_W,cy,cz+colBodyH],[cx+COL_W,cy+COL_D,cz+colBodyH],[cx,cy+COL_D,cz+colBodyH])}
              fill={col.headerBg}
              stroke={col.headerStroke}
              strokeWidth="0.5"
            />
            {/* Column front face */}
            <polygon
              points={face([cx,cy+COL_D,cz],[cx+COL_W,cy+COL_D,cz],[cx+COL_W,cy+COL_D,cz+colBodyH],[cx,cy+COL_D,cz+colBodyH])}
              fill={col.bodyBg}
              stroke={col.headerStroke}
              strokeWidth="0.3"
            />
            {/* Column right face */}
            <polygon
              points={face([cx+COL_W,cy,cz],[cx+COL_W,cy+COL_D,cz],[cx+COL_W,cy+COL_D,cz+colBodyH],[cx+COL_W,cy,cz+colBodyH])}
              fill={ci === 1 ? '#DBEAFE' : '#F3F4F6'}
              stroke={col.headerStroke}
              strokeWidth="0.3"
            />

            {/* Header strip on top face */}
            <polygon
              points={face([cx+2,cy+0.5,cz+colBodyH],[cx+COL_W-2,cy+0.5,cz+colBodyH],[cx+COL_W-2,cy+COL_D-0.5,cz+colBodyH],[cx+2,cy+COL_D-0.5,cz+colBodyH])}
              fill={col.headerBg}
              stroke={col.headerStroke}
              strokeWidth="0.6"
            />

            {/* Column label text — projected onto front face */}
            {(() => {
              // midpoint of front face at header height
              const mid = iso(cx + COL_W / 2, cy + COL_D, cz + colBodyH - 4);
              return (
                <text
                  x={mid.x + OX}
                  y={mid.y + OY}
                  textAnchor="middle"
                  fontSize="5.5"
                  fontWeight="700"
                  fill={col.labelColor}
                  fontFamily="Inter,system-ui,sans-serif"
                  letterSpacing="0.5"
                >
                  {col.label.toUpperCase()}
                </text>
              );
            })()}

            {/* Count badge */}
            {(() => {
              const badgeP = iso(cx + COL_W - 10, cy + COL_D - 0.5, cz + colBodyH - 4);
              return (
                <text
                  x={badgeP.x + OX}
                  y={badgeP.y + OY}
                  textAnchor="middle"
                  fontSize="5"
                  fill={col.labelColor}
                  fontFamily="Inter,system-ui,sans-serif"
                  opacity="0.7"
                >
                  {col.cards.length}
                </text>
              );
            })()}

            {/* ── Cards ────────────────────────────────────────────────────── */}
            {col.cards.map((card, ki) => {
              const cardZBase = cz + HEADER_H + ki * (CARD_H + CARD_GAP) + CARD_GAP;
              const cardX  = cx + CARD_MARGIN_X;
              const cardY  = cy;
              const isActive = ci === 1 && ki === 0; // highlight first "In Progress" card

              return (
                <g key={card.title} filter={isActive ? 'url(#glow)' : undefined}>
                  {/* Card top face */}
                  <polygon
                    points={face(
                      [cardX, cardY, cardZBase + CARD_H],
                      [cardX + CARD_W, cardY, cardZBase + CARD_H],
                      [cardX + CARD_W, cardY + COL_D - 1, cardZBase + CARD_H],
                      [cardX, cardY + COL_D - 1, cardZBase + CARD_H]
                    )}
                    fill={isActive ? '#EFF6FF' : '#FFFFFF'}
                    stroke={isActive ? '#93C5FD' : '#E5E7EB'}
                    strokeWidth={isActive ? '1' : '0.5'}
                  />
                  {/* Card front face */}
                  <polygon
                    points={face(
                      [cardX, cardY + COL_D - 1, cardZBase],
                      [cardX + CARD_W, cardY + COL_D - 1, cardZBase],
                      [cardX + CARD_W, cardY + COL_D - 1, cardZBase + CARD_H],
                      [cardX, cardY + COL_D - 1, cardZBase + CARD_H]
                    )}
                    fill={isActive ? '#F0F7FF' : '#F9FAFB'}
                    stroke={isActive ? '#BFDBFE' : '#E5E7EB'}
                    strokeWidth="0.4"
                  />
                  {/* Card right face */}
                  <polygon
                    points={face(
                      [cardX + CARD_W, cardY, cardZBase],
                      [cardX + CARD_W, cardY + COL_D - 1, cardZBase],
                      [cardX + CARD_W, cardY + COL_D - 1, cardZBase + CARD_H],
                      [cardX + CARD_W, cardY, cardZBase + CARD_H]
                    )}
                    fill={isActive ? '#DBEAFE' : '#EFEFEF'}
                    strokeWidth="0"
                  />

                  {/* Card title line — on top face */}
                  {(() => {
                    const tP = iso(cardX + 4, cardY + (COL_D - 1) / 2, cardZBase + CARD_H - 5);
                    return (
                      <text
                        x={tP.x + OX}
                        y={tP.y + OY}
                        fontSize="4.2"
                        fontWeight="600"
                        fill={isActive ? '#1D4ED8' : '#374151'}
                        fontFamily="Inter,system-ui,sans-serif"
                      >
                        {card.title}
                      </text>
                    );
                  })()}

                  {/* Tag pill */}
                  {(() => {
                    const tagP = iso(cardX + 4, cardY + (COL_D - 1) / 2, cardZBase + CARD_H - 10);
                    return (
                      <text
                        x={tagP.x + OX}
                        y={tagP.y + OY}
                        fontSize="3.5"
                        fontWeight="700"
                        fill={card.tagColor}
                        fontFamily="Inter,system-ui,sans-serif"
                        letterSpacing="0.2"
                      >
                        {card.tag}
                      </text>
                    );
                  })()}

                  {/* Avatar dot */}
                  {(() => {
                    const avP = iso(cardX + CARD_W - 7, cardY + (COL_D - 1) / 2, cardZBase + CARD_H - 10);
                    return (
                      <circle
                        cx={avP.x + OX}
                        cy={avP.y + OY}
                        r="3.5"
                        fill={card.avatar}
                        opacity="0.85"
                      />
                    );
                  })()}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* ── Floating action indicators ─────────────────────────────────────── */}
      {/* Notification dot */}
      {(() => {
        const nP = iso(200, -2, PLATFORM_H + 80);
        return (
          <g>
            <circle cx={nP.x + OX} cy={nP.y + OY} r="7" fill="#EF4444" opacity="0.9" />
            <text
              x={nP.x + OX}
              y={nP.y + OY + 2}
              textAnchor="middle"
              fontSize="5.5"
              fontWeight="700"
              fill="white"
              fontFamily="Inter,system-ui,sans-serif"
            >
              3
            </text>
          </g>
        );
      })()}

      {/* Progress bar strip on platform */}
      {(() => {
        const pA = iso(10, COL_D * 3 + 5, PLATFORM_H);
        const pB = iso(270, COL_D * 3 + 5, PLATFORM_H);
        const pC = iso(270, COL_D * 3 + 7, PLATFORM_H);
        const pD = iso(10, COL_D * 3 + 7, PLATFORM_H);
        const pFill = iso(170, COL_D * 3 + 5, PLATFORM_H);
        const pFillB = iso(170, COL_D * 3 + 7, PLATFORM_H);
        return (
          <>
            <polygon
              points={`${pA.x+OX},${pA.y+OY} ${pB.x+OX},${pB.y+OY} ${pC.x+OX},${pC.y+OY} ${pD.x+OX},${pD.y+OY}`}
              fill="#E5E7EB"
              rx="2"
            />
            <polygon
              points={`${pA.x+OX},${pA.y+OY} ${pFill.x+OX},${pFill.y+OY} ${pFillB.x+OX},${pFillB.y+OY} ${pD.x+OX},${pD.y+OY}`}
              fill="#2563EB"
              opacity="0.7"
            />
          </>
        );
      })()}

      {/* ── Floating cursor/hand pointer – shows DnD in progress ──────────── */}
      {(() => {
        const cp = iso(92, -3, PLATFORM_H + 52);
        return (
          <g transform={`translate(${cp.x + OX}, ${cp.y + OY})`} opacity="0.9">
            <path
              d="M0 0 L0 12 L3 9 L5 14 L7 13 L5 8 L9 8 Z"
              fill="white"
              stroke="#374151"
              strokeWidth="0.7"
              strokeLinejoin="round"
            />
          </g>
        );
      })()}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature section illustrations (refined SVG)
// ─────────────────────────────────────────────────────────────────────────────

const PersonalProductivityIllustration = () => (
  <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="200" height="130" rx="12" fill="#EFF6FF" />
    <rect x="55" y="18" width="90" height="98" rx="8" fill="white" stroke="#DBEAFE" strokeWidth="1.5" />
    <rect x="80" y="12" width="40" height="14" rx="5" fill="#2563EB" />
    <rect x="87" y="15" width="26" height="6" rx="3" fill="#1D4ED8" />
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(0, ${i * 18})`}>
        <rect x="67" y="42" width="12" height="12" rx="3" fill={i < 2 ? '#2563EB' : '#EFF6FF'} stroke={i < 2 ? '#2563EB' : '#BFDBFE'} strokeWidth="1.5" />
        {i < 2 && <polyline points="70,48 73,51 78,45" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
        <rect x="85" y="45" width={i < 2 ? 44 : 50} height="5" rx="2.5" fill={i < 2 ? '#BFDBFE' : '#E0E7FF'} />
      </g>
    ))}
    <rect x="67" y="118" width="66" height="5" rx="2.5" fill="#EFF6FF" stroke="#DBEAFE" strokeWidth="1" />
    <rect x="67" y="118" width="44" height="5" rx="2.5" fill="#2563EB" />
    <circle cx="148" cy="42" r="4" fill="#FCD34D" />
    <circle cx="148" cy="60" r="4" fill="#FCD34D" />
    <circle cx="148" cy="78" r="4" fill="#E5E7EB" />
    <circle cx="148" cy="96" r="4" fill="#E5E7EB" />
  </svg>
);

const TeamCollaborationIllustration = () => (
  <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="200" height="130" rx="12" fill="#EFF6FF" />
    <rect x="65" y="35" width="70" height="65" rx="8" fill="white" stroke="#DBEAFE" strokeWidth="1.5" />
    <rect x="72" y="45" width="18" height="46" rx="4" fill="#EFF6FF" />
    <rect x="95" y="45" width="18" height="46" rx="4" fill="#DBEAFE" />
    <rect x="118" y="45" width="10" height="46" rx="4" fill="#EFF6FF" />
    <rect x="74" y="48" width="14" height="9" rx="2" fill="#BFDBFE" />
    <rect x="74" y="60" width="14" height="9" rx="2" fill="#BFDBFE" />
    <rect x="74" y="72" width="14" height="9" rx="2" fill="#BFDBFE" />
    <rect x="97" y="48" width="14" height="12" rx="2" fill="#2563EB" opacity="0.8" />
    <rect x="97" y="63" width="14" height="9" rx="2" fill="#2563EB" opacity="0.6" />
    <rect x="120" y="48" width="6" height="9" rx="2" fill="#86EFAC" />
    <rect x="120" y="60" width="6" height="9" rx="2" fill="#86EFAC" />
    <circle cx="32" cy="55" r="18" fill="#DBEAFE" stroke="white" strokeWidth="2" />
    <circle cx="32" cy="50" r="7" fill="#2563EB" />
    <ellipse cx="32" cy="68" rx="11" ry="7" fill="#2563EB" />
    <circle cx="168" cy="75" r="18" fill="#EDE9FE" stroke="white" strokeWidth="2" />
    <circle cx="168" cy="70" r="7" fill="#7C3AED" />
    <ellipse cx="168" cy="88" rx="11" ry="7" fill="#7C3AED" />
    <line x1="50" y1="55" x2="65" y2="62" stroke="#BFDBFE" strokeWidth="1.5" strokeDasharray="4 3" />
    <line x1="150" y1="75" x2="135" y2="72" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="4 3" />
    <rect x="8" y="75" width="30" height="14" rx="6" fill="#2563EB" />
    <polygon points="20,89 14,95 26,89" fill="#2563EB" />
    <rect x="162" y="40" width="30" height="14" rx="6" fill="#7C3AED" />
    <polygon points="175,54 181,60 168,54" fill="#7C3AED" />
    <circle cx="50" cy="37" r="5" fill="#F87171" />
    <text x="50" y="41" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">3</text>
  </svg>
);

const KanbanWorkflowIllustration = () => (
  <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="200" height="130" rx="12" fill="#EFF6FF" />
    <rect x="16" y="24" width="50" height="94" rx="6" fill="white" stroke="#DBEAFE" strokeWidth="1.5" />
    <rect x="20" y="28" width="42" height="6" rx="3" fill="#EFF6FF" />
    <text x="41" y="34" textAnchor="middle" fill="#6B7280" fontSize="6.5" fontWeight="600">TO DO</text>
    <rect x="75" y="24" width="50" height="94" rx="6" fill="white" stroke="#2563EB" strokeWidth="1.5" />
    <rect x="79" y="28" width="42" height="6" rx="3" fill="#DBEAFE" />
    <text x="100" y="34" textAnchor="middle" fill="#2563EB" fontSize="5.5" fontWeight="600">IN PROGRESS</text>
    <rect x="134" y="24" width="50" height="94" rx="6" fill="white" stroke="#DBEAFE" strokeWidth="1.5" />
    <rect x="138" y="28" width="42" height="6" rx="3" fill="#DCFCE7" />
    <text x="159" y="34" textAnchor="middle" fill="#16A34A" fontSize="6.5" fontWeight="600">DONE</text>
    <rect x="20" y="40" width="42" height="18" rx="4" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
    <rect x="23" y="44" width="25" height="3.5" rx="1.75" fill="#D1D5DB" />
    <rect x="23" y="50" width="18" height="3.5" rx="1.75" fill="#E5E7EB" />
    <circle cx="56" cy="44" r="4" fill="#FCD34D" />
    <rect x="20" y="62" width="42" height="18" rx="4" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
    <rect x="23" y="66" width="30" height="3.5" rx="1.75" fill="#D1D5DB" />
    <rect x="23" y="72" width="20" height="3.5" rx="1.75" fill="#E5E7EB" />
    <circle cx="56" cy="66" r="4" fill="#FCA5A5" />
    <rect x="79" y="40" width="42" height="18" rx="4" fill="white" stroke="#BFDBFE" strokeWidth="1" />
    <rect x="82" y="44" width="22" height="3.5" rx="1.75" fill="#93C5FD" />
    <rect x="82" y="50" width="15" height="3.5" rx="1.75" fill="#DBEAFE" />
    <circle cx="115" cy="44" r="4" fill="#2563EB" />
    <rect x="79" y="62" width="42" height="18" rx="4" fill="white" stroke="#BFDBFE" strokeWidth="1" />
    <rect x="82" y="66" width="28" height="3.5" rx="1.75" fill="#93C5FD" />
    <rect x="82" y="72" width="18" height="3.5" rx="1.75" fill="#DBEAFE" />
    <rect x="138" y="40" width="42" height="18" rx="4" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1" />
    <rect x="141" y="44" width="22" height="3.5" rx="1.75" fill="#86EFAC" />
    <circle cx="171" cy="44" r="5" fill="#22C55E" />
    <polyline points="168,44 170,46 175,41" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="138" y="62" width="42" height="18" rx="4" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1" />
    <rect x="141" y="66" width="28" height="3.5" rx="1.75" fill="#86EFAC" />
    <circle cx="171" cy="66" r="5" fill="#22C55E" />
    <polyline points="168,66 170,68 175,63" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M66 64 L72 64" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    <path d="M69 61 L72 64 L69 67" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AnalyticsIllustration = () => (
  <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="200" height="130" rx="12" fill="#EFF6FF" />
    <rect x="16" y="16" width="170" height="100" rx="10" fill="white" stroke="#DBEAFE" strokeWidth="1.5" />
    <rect x="24" y="24" width="55" height="5" rx="2.5" fill="#E5E7EB" />
    <circle cx="153" cy="56" r="28" fill="none" stroke="#EFF6FF" strokeWidth="12" />
    <circle cx="153" cy="56" r="28" fill="none" stroke="#2563EB" strokeWidth="12" strokeDasharray="88 88" strokeDashoffset="22" strokeLinecap="round" />
    <circle cx="153" cy="56" r="28" fill="none" stroke="#93C5FD" strokeWidth="12" strokeDasharray="44 132" strokeDashoffset="-66" strokeLinecap="round" />
    <circle cx="153" cy="56" r="28" fill="none" stroke="#FCA5A5" strokeWidth="12" strokeDasharray="22 154" strokeDashoffset="-110" strokeLinecap="round" />
    <circle cx="153" cy="56" r="16" fill="white" />
    <text x="153" y="54" textAnchor="middle" fill="#111827" fontSize="9" fontWeight="700">72%</text>
    <text x="153" y="62" textAnchor="middle" fill="#6B7280" fontSize="5.5">Done</text>
    {[{h:32,x:24,c:'#2563EB'},{h:50,x:38,c:'#93C5FD'},{h:22,x:52,c:'#2563EB'},{h:40,x:66,c:'#BFDBFE'},{h:55,x:80,c:'#2563EB'},{h:35,x:94,c:'#93C5FD'},{h:48,x:108,c:'#2563EB'}].map(({h,x,c},i) => (
      <rect key={i} x={x} y={91-h} width="10" height={h} rx="3" fill={c} opacity={0.85} />
    ))}
    <line x1="22" y1="92" x2="120" y2="92" stroke="#E5E7EB" strokeWidth="1" />
    <polyline points="29,74 43,56 57,80 71,62 85,46 99,66 113,52" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Page data
// ─────────────────────────────────────────────────────────────────────────────

const features = [
  { title: 'Personal Productivity',  description: 'Organize tasks and goals efficiently with personal boards built for focus.',                           illustration: PersonalProductivityIllustration },
  { title: 'Team Collaboration',     description: 'Work together and stay aligned with shared workspaces and real-time updates.',                          illustration: TeamCollaborationIllustration },
  { title: 'Kanban Workflow',        description: 'Track work through visual boards with drag-and-drop columns and cards.',                                illustration: KanbanWorkflowIllustration },
  { title: 'Analytics',             description: 'Measure team productivity with clear dashboards and progress charts.',                                   illustration: AnalyticsIllustration },
];

const steps = [
  { step: '01', title: 'Create a Workspace',  description: 'Set up your personal or team workspace in seconds.' },
  { step: '02', title: 'Create Boards',        description: 'Spin up boards for projects, sprints, or personal goals.' },
  { step: '03', title: 'Manage Tasks',         description: 'Add tasks, assign owners, set priorities and due dates.' },
  { step: '04', title: 'Track Progress',       description: 'Visualize progress with boards, activity logs, and analytics.' },
];

const testimonials = [
  { name: 'Aditi Sharma',  role: 'Final Year CS Student',  quote: 'WorkHive helped me organize my placement prep into clear daily goals. I finally feel in control of my schedule.' },
  { name: 'Marcus Lee',    role: 'Project Team Lead',     quote: 'Our hackathon team coordinated tasks and deadlines in WorkHive instead of scattered chat messages. Huge difference.' },
  { name: 'Priya Nair',   role: 'Startup Co-founder',      quote: 'The Kanban boards and activity log give our small team total visibility into what everyone is working on.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Landing page
// ─────────────────────────────────────────────────────────────────────────────

const Landing = () => (
  <div className="min-h-screen bg-white">
    <Navbar />

    {/* ── Hero ─────────────────────────────────────────────────────────────── */}
    <section className="relative overflow-hidden">
      {/* Subtle radial glow behind the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 65% 40%, rgba(37,99,235,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            {/* Eyebrow pill */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-accent/50 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Projects,perfectly aligned
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-secondary sm:text-5xl lg:text-[3.4rem]">
              WHERE PRODUCTIVITY MEETS
              <br />
              <span className="text-primary">COLLABORATION.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-secondary/60">
              Manage projects, streamline workflows, and collaborate effortlessly
              with your team — all in one clean, modern workspace.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 active:scale-95"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-secondary transition-all hover:bg-gray-50 active:scale-95"
              >
                Sign in
                <svg className="h-4 w-4 text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Social proof strip */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {['#2563EB','#7C3AED','#059669','#DB2777'].map((c) => (
                  <div
                    key={c}
                    className="h-7 w-7 rounded-full border-2 border-white"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="text-xs text-secondary/50">
                <span className="font-semibold text-secondary">2,400+</span> teams already on WorkHive
              </p>
            </div>
          </motion.div>

          {/* Right — 3-D Kanban */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
            className="relative"
          >
            {/* Glow ring behind illustration */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background:
                  'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 70%)',
              }}
            />

            {/* Outer card */}
            <div className="relative rounded-3xl border border-border bg-gradient-to-br from-white to-blue-50/60 p-4 shadow-xl shadow-blue-100/50 ring-1 ring-inset ring-white/80">
              {/* Fake window chrome */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-white/70 px-3 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-medium text-secondary/50">workhive.app/board</span>
                </div>
                <Logo variant="full" className="h-5 w-auto" linkToHome={false} />
              </div>

              {/* Isometric illustration */}
              <div className="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/40 p-2">
                <IsometricKanban />
              </div>

              {/* Floating status badge */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="absolute -right-4 top-12 flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 shadow-lg shadow-black/5"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50">
                  <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-secondary">Task completed</p>
                  <p className="text-[9px] text-secondary/40">Auth system · just now</p>
                </div>
              </motion.div>

              {/* Floating progress badge */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.4 }}
                className="absolute -left-4 bottom-16 flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 shadow-lg shadow-black/5"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-secondary">72% complete</p>
                  <p className="text-[9px] text-secondary/40">WorkHive v1.0 sprint</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* ── Trusted by strip ─────────────────────────────────────────────────── */}
    <div className="border-y border-border bg-gray-50/70 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-secondary/30">
          Built for all kinds of teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-secondary/30">
          {['Startups', 'Hackathon teams', 'College projects', 'Freelancers', 'Remote teams', 'Open-source groups'].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </div>

    {/* ── Features ─────────────────────────────────────────────────────────── */}
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-secondary sm:text-4xl">
          Everything you need to stay productive
        </h2>
        <p className="mt-3 text-secondary/50">One platform. Every workflow.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, idx) => {
          const Illustration = feature.illustration;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-[#EFF6FF] transition-transform duration-300 group-hover:scale-[1.02]">
                <Illustration />
              </div>
              <div className="p-5">
                <h3 className="text-sm font-semibold text-secondary">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-secondary/55">{feature.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>

    {/* ── How it works ─────────────────────────────────────────────────────── */}
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-secondary sm:text-4xl">How it works</h2>
          <p className="mt-3 text-secondary/50">Up and running in under a minute.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute left-full top-4 hidden w-full border-t-2 border-dashed border-border lg:block" style={{ width: 'calc(100% - 2.5rem)', left: '2.5rem' }} />
              )}
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                {item.step}
              </div>
              <h3 className="text-sm font-semibold text-secondary">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-secondary/55">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Testimonials ─────────────────────────────────────────────────────── */}
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-secondary sm:text-4xl">Loved by individuals and teams</h2>
        <p className="mt-3 text-secondary/50">Real people. Real workflows.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="rounded-2xl border border-border bg-white p-6 shadow-sm"
          >
            {/* Stars */}
            <div className="mb-3 flex gap-0.5">
              {[...Array(5)].map((_, s) => (
                <svg key={s} className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-secondary/70">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-4 flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: ['#2563EB','#7C3AED','#059669'][i] }}
              >
                {t.name[0]}
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary">{t.name}</p>
                <p className="text-[10px] text-secondary/40">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* ── CTA ──────────────────────────────────────────────────────────────── */}
    <section className="mx-4 mb-16 overflow-hidden rounded-3xl bg-primary sm:mx-6 lg:mx-8">
      <div
        className="relative px-8 py-16 text-center"
        style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 120%, rgba(255,255,255,0.08) 0%, transparent 60%)' }}
        />
        <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
          Ready to turn ideas into progress?
        </h2>
        <p className="relative mt-3 text-sm text-white/70">
          Join WorkHive today — free forever for individuals.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="rounded-xl bg-white px-7 py-3 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-95"
          >
            Get Started for Free
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white/80 transition-all hover:bg-white/10 active:scale-95"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>

    {/* ── Footer ───────────────────────────────────────────────────────────── */}
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Logo className="h-7 w-auto" />
          <div className="flex gap-6 text-sm text-secondary/50">
            <Link to="/"          className="transition-colors hover:text-secondary">Home</Link>
            <Link to="/login"     className="transition-colors hover:text-secondary">Login</Link>
            <Link to="/register"  className="transition-colors hover:text-secondary">Sign up</Link>
            <a href="mailto:hello@workhive.app" className="transition-colors hover:text-secondary">Contact</a>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-secondary/30">
          © {new Date().getFullYear()} WorkHive. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
);

export default Landing;
