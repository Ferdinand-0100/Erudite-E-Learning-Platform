// SortableRow — a <tr> wired up to dnd-kit's useSortable.
// Renders a drag handle cell as the first <td>, then the children cells.

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export default function SortableRow({ id, children, isOverlay = false }) {
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
    background: isDragging ? 'var(--color-surface-2)' : undefined,
    boxShadow: isOverlay ? 'var(--shadow-elevated)' : undefined,
    position: isOverlay ? 'relative' : undefined,
    zIndex: isOverlay ? 999 : undefined,
  }

  return (
    <tr ref={setNodeRef} style={style}>
      <td
        {...attributes}
        {...listeners}
        style={{
          padding: '8px 6px',
          width: 28,
          color: 'var(--color-text-3)',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <GripVertical size={16} />
      </td>
      {children}
    </tr>
  )
}
