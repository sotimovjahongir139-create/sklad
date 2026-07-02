import { useQuery } from '@tanstack/react-query';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { getWarehouseMap } from '@/services/api/warehouse';

/* ── palette ─────────────────────────────────────────────────────── */
const WOOD      = '#c8965a';
const WOOD_DARK = '#9a6e38';
const FLOOR_CLR = '#b85c38';
const WALL_CLR  = '#d3cfc8';

const occ2clr = (o: number) =>
  o === 0 ? '#e5e7eb' : o < 0.5 ? '#4ade80' : o < 0.8 ? '#fbbf24' : '#f87171';

/* ── hardcoded slot grid (matches seed location codes exactly) ────── */
const ZONE_A_CODES: string[] = [];
const ZONE_B_CODES: string[] = [];
for (const aisle of ['A', 'B', 'C'])
  for (const shelf of ['1', '2', '3', '4'])
    for (const bin of ['L', 'R']) {
      ZONE_A_CODES.push(`A-${aisle}${shelf}${bin}`);
      ZONE_B_CODES.push(`B-${aisle}${shelf}${bin}`);
    }

/* ── slot geometry constants ─────────────────────────────────────── */
const SW = 0.82;   // slot width
const SH = 0.90;   // slot height
const SD = 0.46;   // slot depth
const PW = 0.055;  // post width
const BH = 0.05;   // board (shelf) height

type SlotData  = { occupancy: number; items: any[] };
type SelectFn  = (d: { code: string; occupancy: number; items: any[] }) => void;

/* ── single clickable slot ───────────────────────────────────────── */
function Slot({ pos, code, occ, items, onSelect }: {
  pos: [number, number, number]; code: string;
  occ: number; items: any[]; onSelect: SelectFn;
}) {
  const [hov, setHov] = useState(false);
  return (
    <group
      position={pos}
      onClick={(e) => { e.stopPropagation(); onSelect({ code, occupancy: occ, items }); }}
      onPointerOver={(e) => { e.stopPropagation(); setHov(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHov(false); document.body.style.cursor = 'default'; }}
    >
      <mesh castShadow>
        <boxGeometry args={[SW, SH, SD]} />
        <meshStandardMaterial color={hov ? '#bfdbfe' : occ2clr(occ)} roughness={0.65} />
      </mesh>
      <Text
        position={[0, 0, SD / 2 + 0.01]}
        fontSize={0.09}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        renderOrder={2}
      >
        {code}
      </Text>
    </group>
  );
}

/* ── one shelf bank: wooden frame + rows of slots ────────────────── */
function ShelfBank({ codes, map, pos, rot, cols, rows, onSelect }: {
  codes: string[]; map: Record<string, SlotData>;
  pos: [number, number, number]; rot: [number, number, number];
  cols: number; rows: number; onSelect: SelectFn;
}) {
  const step  = SW + PW;
  const rowH  = SH + BH;
  const bankW = cols * step + PW;
  const bankH = rows * rowH + BH;

  return (
    <group position={pos} rotation={rot}>
      {/* vertical posts */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <mesh key={`v${i}`} position={[i * step - bankW / 2 + PW / 2, bankH / 2, 0]}>
          <boxGeometry args={[PW, bankH + 0.04, SD + 0.06]} />
          <meshStandardMaterial color={WOOD} roughness={0.82} />
        </mesh>
      ))}
      {/* horizontal shelf boards */}
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <mesh key={`h${i}`} position={[0, i * rowH - BH / 2, 0]}>
          <boxGeometry args={[bankW, BH, SD + 0.08]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.82} />
        </mesh>
      ))}
      {/* slot cells */}
      {codes.slice(0, cols * rows).map((code, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x   = col * step - bankW / 2 + PW + SW / 2;
        const y   = row * rowH + SH / 2;
        const d   = map[code] ?? { occupancy: 0, items: [] };
        return (
          <Slot
            key={code}
            pos={[x, y, 0]}
            code={code}
            occ={d.occupancy}
            items={d.items}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}

/* ── full warehouse scene ────────────────────────────────────────── */
function Scene({ map, onSelect }: { map: Record<string, SlotData>; onSelect: SelectFn }) {
  const COLS = 12, ROWS = 2;
  const bankW = COLS * (SW + PW) + PW; // ≈ 10.5 m

  return (
    <>
      {/* lighting — ambient + directional, NO visible lamp fixtures */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 14, 6]}   intensity={0.55} castShadow />
      <directionalLight position={[-8, 10, -4]}  intensity={0.30} />

      {/* floor — terracotta tiles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[48, 36]} />
        <meshStandardMaterial color={FLOOR_CLR} roughness={0.92} />
      </mesh>

      {/* back wall */}
      <mesh position={[0, 3.5, -12.5]}>
        <planeGeometry args={[48, 8]} />
        <meshStandardMaterial color={WALL_CLR} roughness={1} side={2} />
      </mesh>

      {/* left / side wall */}
      <mesh position={[-14.5, 3.5, 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[36, 8]} />
        <meshStandardMaterial color={WALL_CLR} roughness={1} side={2} />
      </mesh>

      {/* Zone A — back wall (centered on x=0, z=-11.4) */}
      <ShelfBank
        codes={ZONE_A_CODES}
        map={map}
        pos={[0, 0.05, -11.4]}
        rot={[0, 0, 0]}
        cols={COLS}
        rows={ROWS}
        onSelect={onSelect}
      />

      {/* Zone B — left/side wall (x=-13.4, centered on z=0, rotated 90°)
           After Y-rotation: local X → world −Z, so bank spans world z ±bankW/2 */}
      <ShelfBank
        codes={ZONE_B_CODES}
        map={map}
        pos={[-13.4, 0.05, 0]}
        rot={[0, Math.PI / 2, 0]}
        cols={COLS}
        rows={ROWS}
        onSelect={onSelect}
      />
    </>
  );
}

/* ── page ────────────────────────────────────────────────────────── */
export default function WarehouseMap() {
  const [selected, setSelected] = useState<{ code: string; occupancy: number; items: any[] } | null>(null);

  const { data: mapRes, isLoading } = useQuery({
    queryKey: ['warehouse', 'map'],
    queryFn: () => getWarehouseMap().then((r) => r.data),
  });

  // Build code → data lookup from API response; falls back to empty if API unavailable
  const dataMap: Record<string, SlotData> = {};
  if (mapRes?.data) {
    for (const zone of mapRes.data as any[])
      for (const loc of zone.locations)
        dataMap[loc.code] = { occupancy: loc.occupancy, items: loc.items };
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ombor xaritasi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ombor joylashuvi va zaxiraning 3D ko'rinishi</p>
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {([["Bo'sh", '#e5e7eb'], ["Kam (<50%)", '#4ade80'], ["O'rta (50–80%)", '#fbbf24'], ["To'la (>80%)", '#f87171']] as const).map(
          ([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-gray-600 dark:text-gray-400">{label}</span>
            </div>
          )
        )}
        {isLoading && <span className="text-gray-400 ml-2">Zaxira ma'lumotlari yuklanmoqda…</span>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* 3D canvas */}
        <div className="xl:col-span-3 rounded-xl overflow-hidden bg-gray-800" style={{ height: 540 }}>
          <Canvas camera={{ position: [14, 12, 22], fov: 52 }} shadows>
            <Suspense fallback={null}>
              <Scene map={dataMap} onSelect={setSelected} />
            </Suspense>
            <OrbitControls enablePan enableZoom enableRotate minDistance={4} maxDistance={50} />
          </Canvas>
        </div>

        {/* side detail panel */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col">
          {selected ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Joy</p>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg font-mono">{selected.code}</h3>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Bandlik</span>
                  <span className="font-medium">{Math.round(selected.occupancy * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${selected.occupancy * 100}%`, backgroundColor: occ2clr(selected.occupancy) }}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tarkibi</p>
                {selected.items.length === 0 ? (
                  <p className="text-sm text-gray-400">Bo'sh</p>
                ) : (
                  <div className="space-y-2">
                    {selected.items.map((item: any) => (
                      <div key={item.modelId} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <div>
                          <p className="text-xs font-mono font-medium text-blue-600">{item.modelCode}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.name}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.quantity} dona</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">Tarkibini ko'rish uchun<br />joyni bosing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
