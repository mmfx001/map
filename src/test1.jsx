import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMapEvent
} from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Custom Marker Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Google-location-icon-color_icons_green_home.png/151px-Google-location-icon-color_icons_green_home.png',
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Google-location-icon-color_icons_green_home.png/151px-Google-location-icon-color_icons_green_home.png',
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Debounce hook for handling zoom events
const useDebounce = (func, delay) => {
  const timeoutRef = useRef(null);

  const debouncedFunc = (...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      func(...args);
      timeoutRef.current = null;
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFunc;
};

const MapComponent = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state

  const center = [41.311081, 69.240562];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get('http://localhost:3001/map');
        setLocations(response.data);
        setFilteredLocations(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Failed to load locations. Please try again later.');
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const calculatePercentageCount = (totalCount, percentage) => {
    return Math.ceil((totalCount * percentage) / 100);
  };

  const sortLocationsByPrice = (locationsToSort) => {
    return locationsToSort.sort((a, b) => b.price - a.price);
  };

  const ZoomChecker = () => {
    const map = useMapEvent('zoomend', () => {
      const zoomLevel = map.getZoom();
      debouncedHandleZoom(map, zoomLevel);
    });

    const debouncedHandleZoom = useDebounce((map, zoomLevel) => {
      let displayedCount = 0;

      if (zoomLevel < 3) {
        displayedCount = 1;
      } else if (zoomLevel >= 3 && zoomLevel <= 5) {
        displayedCount = calculatePercentageCount(locations.length, 5);
      } else if (zoomLevel > 5 && zoomLevel <= 7) {
        displayedCount = calculatePercentageCount(locations.length, 15);
      } else if (zoomLevel > 7 && zoomLevel <= 10) {
        displayedCount = calculatePercentageCount(locations.length, 30);
      } else if (zoomLevel > 10 && zoomLevel <= 12) {
        displayedCount = calculatePercentageCount(locations.length, 50);
      } else {
        displayedCount = locations.length;
      }

      const sortedLocations = sortLocationsByPrice(locations);
      const topLocations = sortedLocations.slice(0, displayedCount);
      setFilteredLocations(topLocations);
    }, 200);

    return null;
  };

  const markers = useMemo(() => {
    return filteredLocations.map((location) => (
      <Marker
        key={location.id}
        position={[parseFloat(location.location.lat), parseFloat(location.location.lng)]}
      >
        <Popup
          className="bg-transparent w-64"
          offset={[0, 20]} // Positive Y offset to move Popup below the marker
          closeButton={false}
        >
          <div className="popup-content bg-white rounded-lg shadow-lg p-4 w-full">
            {/* Slider component for images */}
            <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
            {location.photo1 && (
                      <div>
                        <img
                          src={location.photo1}
                          alt={`${location.nomi} photo1`}
                          className="popup-image rounded-xl w-full h-40 object-cover"
                        />
                      </div>
                    )}
                    {location.photo2 && (
                      <div>
                        <img
                          src={location.photo2}
                          alt={`${location.nomi} photo2`}
                          className="popup-image rounded-xl w-full h-40 object-cover"
                        />
                      </div>
                    )}
                    {location.photo3 && (
                      <div>
                        <img
                          src={location.photo3}
                          alt={`${location.nomi} photo3`}
                          className="popup-image rounded-xl w-full h-40 object-cover"
                        />
                      </div>
                    )}
              {/* Render additional images if they exist */}
              {location.additionalImages && location.additionalImages.map((img, idx) => (
                <div key={idx}>
                  <img
                    src={img}
                    alt={`${location.nomi} Image ${idx + 4}`}
                    className="popup-image rounded-xl w-full h-40 object-cover"
                  />
                </div>
              ))}
            </Slider>
            <h3 className="text-lg font-bold mt-4">{location.nomi} TJM</h3>
            <p className="text-sm text-gray-700">{location.manzil}</p>
            <button className="w-full h-12 text-base rounded-lg bg-blue-700 text-white mt-2">
              Menga qo'ng'iroq qiling!
            </button>
          </div>
        </Popup>

        {/* Label above the marker */}
        <div
          className="absolute bg-blue-500 text-white p-1 rounded text-center"
          style={{
            transform: 'translate(-50%, -100%)'
          }}
        >
          <h4 className="text-sm font-semibold">{location.nomi}</h4>
        </div>
      </Marker>
    ));
  }, [filteredLocations]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading map...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="w-full relative h-screen flex flex-col gap-2">
      {isModalOpen && (
        <div className="fixed inset-0 flex items-end justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-t-lg shadow-lg w-full max-w-3xl p-6 overflow-y-auto h-1/2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Ko'rinayotgan Joylar Ro'yxati</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &#10005;
              </button>
            </div>
            <ul>
              {filteredLocations.map((location) => (
                <li key={location.id} className="mb-4 border-b pb-4">
                  <h3 className="text-xl font-semibold">{location.nomi}</h3>
                  <p className="text-sm text-gray-600">{location.manzil}</p>
                  <p className="text-md font-semibold text-green-600">Price: {location.price} so'm</p>
                  <div className="mt-2">
                    <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
                      {location.rasm1 && <div><img src={location.rasm1} alt={location.nomi} className="rounded-xl w-full" /></div>}
                      {location.rasm2 && <div><img src={location.rasm2} alt={location.nomi} className="rounded-xl w-full" /></div>}
                      {location.rasm3 && <div><img src={location.rasm3} alt={location.nomi} className="rounded-xl w-full" /></div>}
                    </Slider>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <MapContainer
        center={center}
        zoom={14}

        className='w-full h-screen'
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <ZoomControl position="topright" />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomChecker />
        {markers}
      </MapContainer>

      <div className='w-full flex justify-start bg-gray-50 h-[8vh] p-2'>

   
        {/* Modal oynani yaratish */}

      </div>
    </div>
  );
};

export default MapComponent;
