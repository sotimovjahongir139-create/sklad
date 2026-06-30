import { useQuery } from '@tanstack/react-query';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { getWarehouseMap } from '@/services/api/warehouse';

const occupancyColor = (occ: number) => {
  if (occ === 0) return '#e5e7eb';
  if (occ < 0.5) return '#86efac';
  if (occ < 0.8) return '#fbbf24';
  return '#f87171';
};

const LocationBox = ({ position, code, occupancy, items, onSelect }: { position: [number, number, number]; code: string; occupancy: number; items: any[]; onSelect: (data: any) => void }) => {
  const [hovered, setHovered] = useState(false);
  const color = occupancyColor(occupancy);

  return (
    <group position={position} onClick={() => onSelect({ code, occupancy, items })} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <Box args={[2.4, 2.4, 2.4]} castShadow>
        <meshStandardMaterial color={hovered ? '#93c5fd' : color} />
      </Box>
      <Text position={[0, 1.4, 0]} fontSize={0.4} color="#374151" anchorX="center" anchorY="middle">
        {code}
      </Text>
    </group>
  );
};

const ZoneGroup = ({ zone, onSelectLocation }: { zone: any; onSelectLocation: (data: any) => void }) => (
  <group position={[zone.position.x, 0, 0]}>
    {zone.locations.map((loc: any, i: number) => (
      <LocationBox
        key={loc.id}
        position={[(i % 4) * 3, 0, Math.floor(i / 4) * 3]}
        code={loc.code}
        occupancy={loc.occupancy}
        items={loc.items}
        onSelect={onSelectLocation}
      />
    ))}
    <Text position={[4, 3.5, 0]} fontSize={0.8} color="#1e40af" anchorX="center">
      {zone.name}
    </Text>
  </group>
);

export default function WarehouseMap() {
  const [selected, setSelected] = useState<any>(null);
  const { data: mapRes, isLoading } = useQuery({ queryKey: ['warehouse', 'map'], queryFn: () => getWarehouseMap().then((r) => r.data) });
  const zones = mapRes?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ombor xaritasi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ombor joylashuvi va zaxiraning 3D ko'rinishi</p>
      </div>

      <div className="flex gap-3 text-xs">
        {[['Bo\'sh', '#e5e7eb'], ['Kam (<50%)', '#86efac'], ["O'rta (50-80%)", '#fbbf24'], ['To\'la (>80%)', '#f87171']].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 bg-gray-900 rounded-xl overflow-hidden" style={{ height: 520 }}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-gray-400">Xarita yuklanmoqda...</div>
          ) : (
            <Canvas camera={{ position: [15, 15, 25], fov: 50 }} shadows>
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
              <Suspense fallback={null}>
                {zones.map((zone: any, i: number) => (
                  <ZoneGroup key={zone.id} zone={{ ...zone, position: { x: i * 16 } }} onSelectLocation={setSelected} />
                ))}
              </Suspense>
              <OrbitControls enablePan enableZoom enableRotate />
            </Canvas>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          {selected ? (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{selected.code}</h3>
              <p className="text-sm text-gray-500 mb-3">Bandlik: {Math.round(selected.occupancy * 100)}%</p>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-4">
                <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${selected.occupancy * 100}%` }} />
              </div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Tarkibi</h4>
              {selected.items.length === 0 ? (
                <p className="text-sm text-gray-400">Bo'sh</p>
              ) : (
                <div className="space-y-2">
                  {selected.items.map((item: any) => (
                    <div key={item.modelId} className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-mono text-blue-600">{item.sku}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{item.name}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">Tarkibini ko'rish uchun joyni bosing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
