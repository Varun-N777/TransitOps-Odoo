import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const DEPOTS = {
  'New York': [40.7128, -74.0060],
  'Chicago': [41.8781, -87.6298],
  'Los Angeles': [34.0522, -118.2437],
  'Houston': [29.7604, -95.3698],
  'Atlanta': [33.7490, -84.3880]
};

// Create custom icons using public assets
const createIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  Available: createIcon('green'),
  'On Trip': createIcon('blue'),
  'In Shop': createIcon('orange'),
  Retired: createIcon('grey')
};

const LiveMap = ({ vehicles = [], trips = [] }) => {
  const [animatedPositions, setAnimatedPositions] = useState({});
  const animationRef = useRef();

  useEffect(() => {
    const updatePositions = () => {
      const now = Date.now();
      const newPositions = {};

      // Filter active dispatched trips
      const activeTrips = trips.filter(t => t.status === 'Dispatched' && t.vehicle_id);

      activeTrips.forEach(trip => {
        const sourceCoords = DEPOTS[trip.source];
        const destCoords = DEPOTS[trip.destination];

        if (sourceCoords && destCoords) {
          // Animate along route using a 25-second loop cycle
          const duration = 25000; // 25 seconds for trip cycle
          const progress = (now % duration) / duration;

          const lat = sourceCoords[0] + progress * (destCoords[0] - sourceCoords[0]);
          const lng = sourceCoords[1] + progress * (destCoords[1] - sourceCoords[1]);

          newPositions[trip.vehicle_id] = {
            coords: [lat, lng],
            progress: Math.round(progress * 100),
            source: trip.source,
            destination: trip.destination,
            cargo: trip.cargo_weight,
            driver: trip.driver_name || 'Driver'
          };
        }
      });

      setAnimatedPositions(newPositions);
      animationRef.current = requestAnimationFrame(updatePositions);
    };

    animationRef.current = requestAnimationFrame(updatePositions);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trips]);

  // Center map on USA central point
  const mapCenter = [37.8, -96.0];
  const zoomLevel = 4;

  return (
    <div className="w-full h-[550px] bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden shadow-lg">
      <MapContainer center={mapCenter} zoom={zoomLevel} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Modern dark mode tile
        />

        {/* Depots static markers */}
        {Object.entries(DEPOTS).map(([name, coords]) => (
          <Marker 
            key={name} 
            position={coords} 
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
              iconSize: [16, 26],
              iconAnchor: [8, 26]
            })}
          >
            <Popup>
              <div className="text-slate-950 font-semibold font-sans">
                <h3>Depot: {name}</h3>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Vehicle markers */}
        {vehicles.map(vehicle => {
          const isAnimated = vehicle.status === 'On Trip' && animatedPositions[vehicle.id];
          const position = isAnimated 
            ? animatedPositions[vehicle.id].coords 
            : DEPOTS[vehicle.home_depot] || [40.7128, -74.0060];

          const icon = icons[vehicle.status] || icons.Available;

          return (
            <React.Fragment key={vehicle.id}>
              {/* Show line for active moving trips */}
              {isAnimated && DEPOTS[animatedPositions[vehicle.id].source] && DEPOTS[animatedPositions[vehicle.id].destination] && (
                <Polyline 
                  positions={[
                    DEPOTS[animatedPositions[vehicle.id].source],
                    DEPOTS[animatedPositions[vehicle.id].destination]
                  ]}
                  color="#3b82f6"
                  weight={2}
                  dashArray="5, 10"
                />
              )}
              
              <Marker position={position} icon={icon}>
                <Popup>
                  <div className="text-slate-900 font-sans">
                    <h4 className="font-bold text-sm">{vehicle.make} {vehicle.model}</h4>
                    <p className="text-xs text-slate-500">Plate: {vehicle.license_plate}</p>
                    <p className="text-xs mt-1">Status: <span className="font-semibold">{vehicle.status}</span></p>
                    <p className="text-xs">Location: {vehicle.home_depot} Depot</p>
                    {isAnimated && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <p className="text-xs text-blue-600 font-medium">Route: {animatedPositions[vehicle.id].source} ➔ {animatedPositions[vehicle.id].destination}</p>
                        <p className="text-xs">Driver: {animatedPositions[vehicle.id].driver}</p>
                        <p className="text-xs">Load: {animatedPositions[vehicle.id].cargo} kg</p>
                        <p className="text-xs">Progress: {animatedPositions[vehicle.id].progress}%</p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
