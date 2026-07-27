'use client';

import { useEffect, useRef } from 'react';

// Declare google as any to avoid TypeScript errors with Google Maps API
declare const google: any;

interface Branch {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
}

interface BranchMapProps {
  branches: Branch[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
}

export function BranchMap({
  branches,
  center = { lat: 39.8283, lng: -98.5795 }, // Center of USA
  zoom = 4,
  height = '600px',
}: BranchMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !google) return;

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    googleMapRef.current = map;

    // Custom bank marker icon (SVG)
    const bankIcon = {
      path: 'M12 2L2 7v2h20V7l-10-5zm-8 7v11h4v-6h8v6h4V9H4zm8 11h-2v-4h2v4z', // Bank building icon
      fillColor: '#1a56db',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.5,
      anchor: new google.maps.Point(12, 24),
    };

    // Add markers for each branch
    const bounds = new google.maps.LatLngBounds();

    branches.forEach((branch) => {
      const marker = new google.maps.Marker({
        position: { lat: branch.lat, lng: branch.lng },
        map,
        title: branch.name,
        icon: bankIcon,
        animation: google.maps.Animation.DROP,
      });

      // Extend bounds to include this marker
      bounds.extend(marker.getPosition());

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">
              ${branch.name}
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #666; line-height: 1.5;">
              ${branch.address}
            </p>
            ${
              branch.phone
                ? `
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
                <strong>Phone:</strong> ${branch.phone}
              </p>
            `
                : ''
            }
            ${
              branch.hours
                ? `
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
                <strong>Hours:</strong> ${branch.hours}
              </p>
            `
                : ''
            }
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                branch.address
              )}"
              target="_blank"
              rel="noopener noreferrer"
              style="display: inline-block; margin-top: 8px; color: #1a56db; text-decoration: none; font-size: 14px; font-weight: 500;"
            >
              Get Directions →
            </a>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });

    // Fit map to show all markers if there are multiple branches
    if (branches.length > 1) {
      map.fitBounds(bounds);
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) map.setZoom(15);
        google.maps.event.removeListener(listener);
      });
    }
  }, [branches, center, zoom]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height, borderRadius: '8px' }}
      className="shadow-lg"
    />
  );
}
