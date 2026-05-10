import { useState } from 'react'

export function useBulkSelect() {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setCheckedIds(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function toggleAll(ids: string[]) {
    const allChecked = ids.length > 0 && ids.every(id => checkedIds.has(id))
    setCheckedIds(prev => {
      const n = new Set(prev)
      if (allChecked) ids.forEach(id => n.delete(id))
      else ids.forEach(id => n.add(id))
      return n
    })
  }

  function clear(ids?: string[]) {
    if (ids) setCheckedIds(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n })
    else setCheckedIds(new Set())
  }

  function isChecked(id: string) { return checkedIds.has(id) }
  function isAllChecked(ids: string[]) { return ids.length > 0 && ids.every(id => checkedIds.has(id)) }

  return { checkedIds, toggle, toggleAll, clear, isChecked, isAllChecked, count: checkedIds.size }
}
