import { useState, useEffect } from 'react'

/**
 * Returns a debounced version of the value that only updates after the delay.
 */
export default function useDebounce(value, delay = 400) {
 const [debouncedValue, setDebouncedValue] = useState(value)

 useEffect(() => {
 const timer = setTimeout(() => {
 setDebouncedValue(value)
 }, delay)

 return () => clearTimeout(timer)
 }, [value, delay])

 return debouncedValue
}
