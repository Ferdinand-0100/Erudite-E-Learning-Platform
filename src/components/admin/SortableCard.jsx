// SortableCard — a div wired up to dnd-kit's useSortable for card grids.

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export default function SortableCard({ id, children, isOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.35 : 1,
    boxShadow: isOverlay ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
    position: 'relative',
    zIndex: isOverlay ? 999 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle — top-left corner */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          color: 'var(--color-text-3)',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          zIndex: 1,
        }}
        title="Drag to reorder"
      >
        <GripVertical size={15} />
      </div>
      {children}
    </div>
  )
}
