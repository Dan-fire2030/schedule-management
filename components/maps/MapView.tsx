'use client'

import { useEffect, useRef, useState } from 'react'
import { useGoogleMaps, Location } from '@/lib/maps/google-maps'
import { Button } from '@/components/ui/Button'
import { Navigation, RotateCcw, Maximize } from 'lucide-react'

interface MapViewProps {
  location?: Location
  locations?: Location[]
  center?: Location
  zoom?: number
  height?: string
  className?: string
  showCurrentLocation?: boolean
  onLocationClick?: (location: Location) => void
  markers?: MapMarker[]
}

interface MapMarker {
  location: Location
  title?: string
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple'
  icon?: string
}

export function MapView({
  location,
  locations = [],
  center,
  zoom = 15,
  height = '400px',
  className = '',
  showCurrentLocation = true,
  onLocationClick,
  markers = []
}: MapViewProps) {
  const { isLoaded, getCurrentLocation } = useGoogleMaps()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return

    const mapCenter = center || location || { lat: 35.6762, lng: 139.6503 } // Tokyo Station
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    })

    mapInstanceRef.current = map

    // Add click listener if callback provided
    if (onLocationClick) {
      map.addListener('click', (event: any) => {
        const clickedLocation: Location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        }
        onLocationClick(clickedLocation)
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        window.google.maps.event.clearInstanceListeners(mapInstanceRef.current)
      }
    }
  }, [isLoaded, center, location, zoom, onLocationClick])

  // Update markers when locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    const allLocations = [
      ...(location ? [location] : []),
      ...locations,
      ...markers.map(m => m.location)
    ]

    // Add markers for all locations
    allLocations.forEach((loc, index) => {
      const marker = new window.google.maps.Marker({
        position: loc,
        map: mapInstanceRef.current,
        title: loc.address || `Location ${index + 1}`,
        animation: window.google.maps.Animation.DROP
      })

      markersRef.current.push(marker)

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <p class="font-medium">${loc.address || '選択された場所'}</p>
            <p class="text-sm text-gray-600">${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}</p>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker)
      })
    })

    // Add custom markers
    markers.forEach((markerData, index) => {
      const marker = new window.google.maps.Marker({
        position: markerData.location,
        map: mapInstanceRef.current,
        title: markerData.title || `Marker ${index + 1}`,
        icon: markerData.icon || {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${getMarkerColor(markerData.color || 'red')}" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 24)
        }
      })

      markersRef.current.push(marker)

      if (markerData.title) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <p class="font-medium">${markerData.title}</p>
              <p class="text-sm text-gray-600">${markerData.location.address || `${markerData.location.lat.toFixed(6)}, ${markerData.location.lng.toFixed(6)}`}</p>
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker)
        })
      }
    })

    // Fit bounds if multiple locations
    if (allLocations.length > 1) {
      const bounds = new window.google.maps.LatLngBounds()
      allLocations.forEach(loc => bounds.extend(loc))
      mapInstanceRef.current.fitBounds(bounds)
    }
  }, [location, locations, markers])

  // Add user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !window.google) return

    const userMarker = new window.google.maps.Marker({
      position: userLocation,
      map: mapInstanceRef.current,
      title: '現在地',
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
            <circle cx="10" cy="10" r="3" fill="white"/>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(20, 20),
        anchor: new window.google.maps.Point(10, 10)
      }
    })

    markersRef.current.push(userMarker)

    return () => {
      userMarker.setMap(null)
    }
  }, [userLocation])

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true)
      const location = await getCurrentLocation()
      
      if (location) {
        setUserLocation(location)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location)
          mapInstanceRef.current.setZoom(16)
        }
      }
    } catch (error) {
alert('現在地の取得に失敗しました。位置情報の許可を確認してください。')
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleResetView = () => {
    if (!mapInstanceRef.current) return

    const defaultCenter = center || location || { lat: 35.6762, lng: 139.6503 }
    mapInstanceRef.current.setCenter(defaultCenter)
    mapInstanceRef.current.setZoom(zoom)
  }

  const handleFullscreen = () => {
    if (mapRef.current) {
      if (mapRef.current.requestFullscreen) {
        mapRef.current.requestFullscreen()
      }
    }
  }

  const getMarkerColor = (color: string): string => {
    const colors = {
      red: '#EA4335',
      blue: '#4285F4',
      green: '#34A853',
      yellow: '#FBBC04',
      purple: '#9333EA'
    }
    return colors[color as keyof typeof colors] || colors.red
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500 dark:text-gray-400">マップを読み込み中...</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Map Controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        {showCurrentLocation && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleGetCurrentLocation}
            isLoading={isGettingLocation}
            className="bg-white dark:bg-gray-800 shadow-md"
            title="現在地を表示"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleResetView}
          className="bg-white dark:bg-gray-800 shadow-md"
          title="表示をリセット"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleFullscreen}
          className="bg-white dark:bg-gray-800 shadow-md"
          title="フルスクリーン"
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}