import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'

function PageTransition({ children }) {
  const ref = useRef(null)
  const location = useLocation()

  useEffect(() => {
    gsap.fromTo(ref.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' })
  }, [location.pathname])

  return <div ref={ref}>{children}</div>
}

export default PageTransition
