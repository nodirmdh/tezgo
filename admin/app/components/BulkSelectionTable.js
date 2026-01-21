"use client";

import { useEffect, useMemo, useRef } from "react";

const HeaderCheckbox = ({ checked, indeterminate, onChange }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label="Select all on page"
    />
  );
};

export default function BulkSelectionTable({
  items,
  getRowId,
  selectedIds,
  onSelectionChange,
  children
}) {
  const selectedSet = useMemo(() => new Set(selectedIds || []), [selectedIds]);
  const rowIds = useMemo(() => items.map((item) => getRowId(item)), [items, getRowId]);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedSet.has(id));
  const someSelected = rowIds.some((id) => selectedSet.has(id));

  const toggleAll = (checked) => {
    const next = new Set(selectedSet);
    if (checked) {
      rowIds.forEach((id) => next.add(id));
    } else {
      rowIds.forEach((id) => next.delete(id));
    }
    onSelectionChange(Array.from(next));
  };

  const toggleOne = (id) => {
    const next = new Set(selectedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(Array.from(next));
  };

  const getRowCheckbox = (id) => (
    <input
      type="checkbox"
      checked={selectedSet.has(id)}
      onChange={() => toggleOne(id)}
      aria-label={`Select row ${id}`}
    />
  );

  const headerCheckbox = (
    <HeaderCheckbox
      checked={allSelected}
      indeterminate={someSelected && !allSelected}
      onChange={toggleAll}
    />
  );

  return children({
    headerCheckbox,
    getRowCheckbox,
    selectedCount: selectedSet.size,
    selectedIds: Array.from(selectedSet),
    clearSelection: () => onSelectionChange([])
  });
}
