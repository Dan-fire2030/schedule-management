'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useGoogleMaps, Location, Place } from '@/lib/maps/google-maps'
import { MapPin, Search, Navigation, ExternalLink, Loader2 } from 'lucide-react'

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void
  placeholder?: string
  className?: string
  showCurrentLocation?: boolean
}

export function LocationSearch({
  onLocationSelect,
  placeholder = "場所を検索...",
  className = "",
  showCurrentLocation = true
}: LocationSearchProps) {
  const { isLoaded, searchPlaces, getPlaceDetails, getCurrentLocation } = useGoogleMaps()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !isLoaded) {
      setResults([])
      setShowResults(false)
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true)
        const places = await searchPlaces(query)
        setResults(places)
        setShowResults(true)
        setSelectedIndex(-1)
      } catch (error) {
setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, isLoaded, searchPlaces])

  const handlePlaceSelect = async (place: Place) => {
    try {
      setIsSearching(true)
      const placeDetails = await getPlaceDetails(place.placeId)
      
      if (placeDetails) {
        setQuery(placeDetails.name)
        onLocationSelect(placeDetails.location)
        setShowResults(false)
      }
    } catch (error) {
} finally {
      setIsSearching(false)
    }
  }

  const handleCurrentLocation = async () => {
    try {
      setIsGettingLocation(true)
      const location = await getCurrentLocation()
      
      if (location) {
        setQuery(location.address || '現在地')
        onLocationSelect(location)
        setShowResults(false)
      }
    } catch (error) {
alert('現在地の取得に失敗しました。位置情報の許可を確認してください。')
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handlePlaceSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => setShowResults(false), 200)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              className="pl-10 pr-10"
              disabled={!isLoaded}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Search Results */}
          {showResults && results.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto border shadow-lg">
              <div className="py-1">
                {results.map((place, index) => (
                  <button
                    key={place.placeId}
                    onClick={() => handlePlaceSelect(place)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                          {place.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {place.address}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {showCurrentLocation && (
          <Button
            variant="outline"
            onClick={handleCurrentLocation}
            isLoading={isGettingLocation}
            disabled={!isLoaded}
            className="flex items-center gap-2 px-3"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        )}
      </div>

      {!isLoaded && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Google Maps を読み込み中...
        </p>
      )}
    </div>
  )
}

// Location display component
interface LocationDisplayProps {
  location: Location
  showDistance?: boolean
  userLocation?: Location
  className?: string
}

export function LocationDisplay({
  location,
  showDistance = false,
  userLocation,
  className = ""
}: LocationDisplayProps) {
  const { calculateDistance, getLocationUrl } = useGoogleMaps()
  
  const distance = showDistance && userLocation 
    ? calculateDistance(userLocation, location)
    : null

  const handleOpenInMaps = () => {
    window.open(getLocationUrl(location), '_blank')
  }

  return (
    <div className={`flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${className}`}>
      <MapPin className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 dark:text-gray-200">
          {location.address || `${location.lat}, ${location.lng}`}
        </p>
        {distance && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            現在地から約 {distance.toFixed(1)}km
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenInMaps}
        className="flex items-center gap-1 text-primary-600 dark:text-primary-400"
      >
        <ExternalLink className="w-4 h-4" />
        <span className="hidden sm:inline">マップで開く</span>
      </Button>
    </div>
  )
}