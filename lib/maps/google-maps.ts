'use client'

export interface Location {
  lat: number
  lng: number
  address?: string
  placeId?: string
}

export interface Place {
  placeId: string
  name: string
  address: string
  location: Location
  types: string[]
  rating?: number
  photoUrl?: string
}

declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

class GoogleMapsManager {
  private isLoaded = false
  private isLoading = false
  private loadPromise: Promise<void> | null = null
  private autocompleteService: any = null
  private placesService: any = null
  private geocoder: any = null

  constructor() {
    if (typeof window !== 'undefined') {
      window.initGoogleMaps = this.onApiLoaded.bind(this)
    }
  }

  // Load Google Maps API
  async loadGoogleMapsAPI(): Promise<void> {
    if (this.isLoaded) return
    if (this.loadPromise) return this.loadPromise

    this.loadPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Maps can only be loaded in browser'))
        return
      }

      if (window.google?.maps) {
        this.onApiLoaded()
        resolve()
        return
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        reject(new Error('Google Maps API key not found'))
        return
      }

      this.isLoading = true
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`
      script.async = true
      script.defer = true
      
      script.onerror = () => {
        this.isLoading = false
        reject(new Error('Failed to load Google Maps API'))
      }

      document.head.appendChild(script)

      // Set up success callback
      const originalCallback = window.initGoogleMaps
      window.initGoogleMaps = () => {
        this.onApiLoaded()
        if (originalCallback) originalCallback()
        resolve()
      }
    })

    return this.loadPromise
  }

  private onApiLoaded() {
    this.isLoaded = true
    this.isLoading = false
    
    if (window.google?.maps) {
      this.autocompleteService = new window.google.maps.places.AutocompleteService()
      this.geocoder = new window.google.maps.Geocoder()
    }
  }

  // Check if API is loaded
  isApiLoaded(): boolean {
    return this.isLoaded
  }

  // Search for places
  async searchPlaces(query: string): Promise<Place[]> {
    await this.loadGoogleMapsAPI()
    
    if (!this.autocompleteService) {
      throw new Error('Google Maps Autocomplete service not available')
    }

    return new Promise((resolve, reject) => {
      this.autocompleteService.getPlacePredictions(
        {
          input: query,
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'jp' } // Restrict to Japan
        },
        (predictions: any[], status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const places: Place[] = predictions.map((prediction) => ({
              placeId: prediction.place_id,
              name: prediction.structured_formatting?.main_text || prediction.description,
              address: prediction.description,
              location: { lat: 0, lng: 0 }, // Will be populated when place details are fetched
              types: prediction.types || []
            }))
            resolve(places)
          } else {
            reject(new Error(`Places search failed: ${status}`))
          }
        }
      )
    })
  }

  // Get place details
  async getPlaceDetails(placeId: string): Promise<Place | null> {
    await this.loadGoogleMapsAPI()

    if (!window.google?.maps) {
      throw new Error('Google Maps not loaded')
    }

    // Create a temporary div for PlacesService
    const tempDiv = document.createElement('div')
    const placesService = new window.google.maps.places.PlacesService(tempDiv)

    return new Promise((resolve, reject) => {
      placesService.getDetails(
        {
          placeId,
          fields: ['name', 'formatted_address', 'geometry', 'rating', 'photos', 'types']
        },
        (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const result: Place = {
              placeId,
              name: place.name,
              address: place.formatted_address,
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              },
              types: place.types || [],
              rating: place.rating,
              photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400 })
            }
            resolve(result)
          } else {
            resolve(null)
          }
        }
      )
    })
  }

  // Geocode address to coordinates
  async geocodeAddress(address: string): Promise<Location | null> {
    await this.loadGoogleMapsAPI()

    if (!this.geocoder) {
      throw new Error('Google Maps Geocoder not available')
    }

    return new Promise((resolve, reject) => {
      this.geocoder.geocode(
        { address, region: 'jp' },
        (results: any[], status: any) => {
          if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
            const location = results[0].geometry.location
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              address: results[0].formatted_address,
              placeId: results[0].place_id
            })
          } else {
            resolve(null)
          }
        }
      )
    })
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    await this.loadGoogleMapsAPI()

    if (!this.geocoder) {
      throw new Error('Google Maps Geocoder not available')
    }

    return new Promise((resolve, reject) => {
      this.geocoder.geocode(
        { location: { lat, lng } },
        (results: any[], status: any) => {
          if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
            resolve(results[0].formatted_address)
          } else {
            resolve(null)
          }
        }
      )
    })
  }

  // Get user's current location
  async getCurrentLocation(): Promise<Location | null> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser')
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const address = await this.reverseGeocode(latitude, longitude)
          
          resolve({
            lat: latitude,
            lng: longitude,
            address: address || undefined
          })
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  // Calculate distance between two locations
  calculateDistance(location1: Location, location2: Location): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.degreesToRadians(location2.lat - location1.lat)
    const dLng = this.degreesToRadians(location2.lng - location1.lng)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(location1.lat)) * 
      Math.cos(this.degreesToRadians(location2.lat)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Generate Google Maps URL for directions
  getDirectionsUrl(from: Location, to: Location): string {
    const fromCoords = `${from.lat},${from.lng}`
    const toCoords = `${to.lat},${to.lng}`
    return `https://www.google.com/maps/dir/${fromCoords}/${toCoords}`
  }

  // Generate Google Maps URL for a specific location
  getLocationUrl(location: Location): string {
    return `https://www.google.com/maps/place/${location.lat},${location.lng}`
  }
}

// Export singleton instance
export const googleMaps = new GoogleMapsManager()

// React hook for Google Maps integration
export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    googleMaps.loadGoogleMapsAPI()
      .then(() => {
        setIsLoaded(true)
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoaded(false)
      })
  }, [])

  return {
    isLoaded,
    error,
    searchPlaces: (query: string) => googleMaps.searchPlaces(query),
    getPlaceDetails: (placeId: string) => googleMaps.getPlaceDetails(placeId),
    geocodeAddress: (address: string) => googleMaps.geocodeAddress(address),
    getCurrentLocation: () => googleMaps.getCurrentLocation(),
    calculateDistance: (loc1: Location, loc2: Location) => googleMaps.calculateDistance(loc1, loc2),
    getDirectionsUrl: (from: Location, to: Location) => googleMaps.getDirectionsUrl(from, to),
    getLocationUrl: (location: Location) => googleMaps.getLocationUrl(location)
  }
}

// Import React hooks
import { useState, useEffect } from 'react'