// useDraggableList — dnd-kit powered sortable list for admin tables/grids.
// Returns everything needed to wire up a SortableContext + drag overlay.
//
// Usage:
//   const { sensors, items, activeItem, handleDragStart, handleDragEnd, handleDragCancel } =
//     useDraggableList(rows, onReorder)
//
//   Wrap your list in:
//     <DndContext sensors={sensors} collisionDetection={closestCenter}
//       onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
//       <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
//         {items.map(item => <SortableRow key={item.id} id={item.id} ... />)}
//       </SortableContext>
//     </DndContext>
//
//   Each row must use the useSortable hook (see SortableRow helper below).

import { useState } from 'react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

export function useDraggableList(rows, onReorder) {
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeItem = activeId ? rows.find(r => r.id === activeId) ?? null : null

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIndex = rows.findIndex(r => r.id === active.id)
    const newIndex = rows.findIndex(r => r.id === over.id)
    const reordered = arrayMove(rows, oldIndex, newIndex).map((item, i) => ({
      ...item,
      sort_order: i,
    }))
    onReorder(reordered)
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  return { sensors, items: rows, activeItem, activeId, handleDragStart, handleDragEnd, handleDragCancel }
}
