export const useTickedNow = () => useState('now', () => new Date())

export function useFlushOnHidden(filter: { flush: () => void }) {
  const visibility = useDocumentVisibility()
  watch(
    visibility,
    (v) => {
      if (v === 'hidden') filter.flush()
    },
    { flush: 'sync' },
  )
}
