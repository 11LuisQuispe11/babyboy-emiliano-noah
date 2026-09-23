import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

// Stop GPU work while the invitation is in a background tab or the phone is locked.
export default function RenderLifecycle({ onContextLost, onContextRestored }) {
  const { gl, setFrameloop } = useThree()
  useEffect(() => {
    const visibility = () => setFrameloop(document.hidden ? 'never' : 'always')
    const lost = event => { event.preventDefault(); setFrameloop('never'); onContextLost() }
    const restored = () => { visibility(); onContextRestored() }
    document.addEventListener('visibilitychange', visibility)
    gl.domElement.addEventListener('webglcontextlost', lost)
    gl.domElement.addEventListener('webglcontextrestored', restored)
    visibility()
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      gl.domElement.removeEventListener('webglcontextlost', lost)
      gl.domElement.removeEventListener('webglcontextrestored', restored)
    }
  }, [gl, setFrameloop, onContextLost, onContextRestored])
  return null
}
