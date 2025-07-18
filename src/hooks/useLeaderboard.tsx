import {useEffect, useState} from 'react' 

export const useLeaderboardOptimization = () => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [shouldLoadImages, setShouldLoadImages] = useState(false)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting) {
          setShouldLoadImages(true)
        }
      },
      { threshold: 0.1 }
    )
    
    return () => observer.disconnect()
  }, [])
  
  return { isIntersecting, shouldLoadImages }
}