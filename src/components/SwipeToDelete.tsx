import { useRef, useState, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

const REVEAL_WIDTH = 64;

export function SwipeToDelete({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startTranslate = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startTranslate.current = translateX;
    setDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientX - startX.current;
    const next = Math.min(0, Math.max(-REVEAL_WIDTH, startTranslate.current + delta));
    setTranslateX(next);
  }

  function handleTouchEnd() {
    setDragging(false);
    setTranslateX(translateX < -REVEAL_WIDTH / 2 ? -REVEAL_WIDTH : 0);
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500"
        style={{ width: REVEAL_WIDTH }}
      >
        <button
          onClick={() => {
            setTranslateX(0);
            onDelete();
          }}
          className="w-full h-full flex items-center justify-center text-white"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
        }}
        className="relative bg-inherit"
      >
        {children}
      </div>
    </div>
  );
}
