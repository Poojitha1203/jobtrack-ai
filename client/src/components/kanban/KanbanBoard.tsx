import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn.tsx';
import { KanbanCardContent } from './KanbanCard.tsx';
import { useToast } from '../../hooks/useToast.ts';
import { moveApplication } from '../../services/applications.ts';
import { STATUS_META } from '../../lib/status.ts';
import { appliedDateForStatus } from '../../lib/applicationForm.ts';
import { findApplication, findColumn, groupByStatus, sameOrder, type Columns } from '../../lib/kanban.ts';
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '../../types/application.ts';

export function KanbanBoard({ initialApplications }: { initialApplications: Application[] }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [columns, setColumns] = useState<Columns>(() => groupByStatus(initialApplications));
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overStatus, setOverStatus] = useState<ApplicationStatus | null>(null);
  const snapshot = useRef<Columns | null>(null);
  const justDragged = useRef(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Press-and-hold on touch screens, so a normal swipe still scrolls the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const cardLabel = (id: UniqueIdentifier) => {
    const app = findApplication(columns, id);
    return app ? `${app.jobTitle} at ${app.company.name}` : 'Card';
  };
  const columnLabel = (id: UniqueIdentifier) => {
    const status = findColumn(columns, id);
    return status ? STATUS_META[status].label : 'unknown';
  };

  const openCard = (id: string) => {
    if (!justDragged.current) navigate(`/applications/${id}`);
  };

  const finishDrag = () => {
    setActiveId(null);
    setOverStatus(null);
    // Swallow the click event that browsers fire right after a mouse drag ends.
    justDragged.current = true;
    window.setTimeout(() => {
      justDragged.current = false;
    }, 0);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    snapshot.current = columns;
    setActiveId(active.id);
  };

  // Moving across columns happens live while dragging, so the card visibly joins the new column.
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setOverStatus(findColumn(columns, over.id) ?? null);
    setColumns((prev) => {
      const from = findColumn(prev, active.id);
      const to = findColumn(prev, over.id);
      if (!from || !to || from === to) return prev;
      const moving = prev[from].find((a) => a.id === active.id);
      if (!moving) return prev;
      const target = prev[to];
      const overIndex = target.findIndex((a) => a.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : target.length;
      return {
        ...prev,
        [from]: prev[from].filter((a) => a.id !== active.id),
        [to]: [...target.slice(0, insertAt), { ...moving, status: to }, ...target.slice(insertAt)],
      };
    });
  };

  const handleDragCancel = () => {
    if (snapshot.current) setColumns(snapshot.current);
    snapshot.current = null;
    finishDrag();
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const before = snapshot.current;
    snapshot.current = null;
    finishDrag();
    if (!before) return;
    if (!over) {
      setColumns(before);
      return;
    }

    const status = findColumn(columns, active.id);
    const original = findApplication(before, active.id);
    if (!status || !original) return;

    let list = columns[status];
    const oldIndex = list.findIndex((a) => a.id === active.id);
    const overIndex = list.findIndex((a) => a.id === over.id);
    if (overIndex >= 0 && overIndex !== oldIndex) list = arrayMove(list, oldIndex, overIndex);

    const appliedAt = appliedDateForStatus(status, original.appliedAt);
    list = list.map((a) => (a.id === original.id ? { ...a, status, appliedAt } : a));
    setColumns({ ...columns, [status]: list });

    if (original.status === status && sameOrder(before[status], list)) return;

    moveApplication(original.id, {
      status,
      orderedIds: list.map((a) => a.id),
      appliedAt: appliedAt !== original.appliedAt ? appliedAt : undefined,
    })
      .then(() => {
        if (original.status !== status) showToast(`Moved “${original.jobTitle}” to ${STATUS_META[status].label}`);
      })
      .catch((error: unknown) => {
        setColumns(before);
        showToast(error instanceof Error ? error.message : 'Could not save the move', 'error');
      });
  };

  const activeApp = activeId ? findApplication(columns, activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            'Press Space to pick up the card, use the arrow keys to move it between columns, then press Space or Enter to drop it. Press Escape to cancel. Press Enter to open the application.',
        },
        announcements: {
          onDragStart: ({ active }) => `Picked up ${cardLabel(active.id)}.`,
          onDragOver: ({ active, over }) =>
            over ? `${cardLabel(active.id)} is over the ${columnLabel(over.id)} column.` : `${cardLabel(active.id)} is not over a column.`,
          onDragEnd: ({ active, over }) =>
            over ? `${cardLabel(active.id)} dropped in ${columnLabel(over.id)}.` : `${cardLabel(active.id)} was dropped.`,
          onDragCancel: ({ active }) => `Moving ${cardLabel(active.id)} was cancelled.`,
        },
      }}
    >
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {APPLICATION_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={columns[status]}
            highlighted={activeId !== null && overStatus === status}
            isDragActive={activeId !== null}
            onOpen={openCard}
          />
        ))}
      </div>
      <DragOverlay>{activeApp ? <KanbanCardContent application={activeApp} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
