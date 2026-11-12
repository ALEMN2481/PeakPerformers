import { useCallback, useEffect, useState } from 'react'
import { api, listado } from '../services/api'
export function useApiList(path, keys = []) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const keyList = keys.join('|')
  const reload = useCallback(async (signal) => {
    setLoading(true); setError('')
    try {
      const result = await api(path, { signal })
      if (!signal?.aborted) setItems(listado(result, keyList ? keyList.split('|') : []))
    } catch (e) {
      if (e.name !== 'AbortError' && !signal?.aborted) { setItems([]); setError(e.message) }
    } finally { if (!signal?.aborted) setLoading(false) }
  }, [path, keyList])
  useEffect(() => {
    const controller = new AbortController(); reload(controller.signal)
    return () => controller.abort()
  }, [reload])
  return { items, loading, error, reload }
}
