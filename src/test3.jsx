import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvent,
  ZoomControl,
} from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Import marker shadow correctly
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom Marker Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Google-location-icon-color_icons_green_home.png/151px-Google-location-icon-color_icons_green_home.png',
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Google-location-icon-color_icons_green_home.png/151px-Google-location-icon-color_icons_green_home.png',
  shadowUrl: markerShadow,
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
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Holat o'zgaruvchilari
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false); // Filter modal
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false); // List drawer
  const [selectedRegion, setSelectedRegion] = useState('');

  // Hududlar ro'yxati
  const regions = [
    'Toshkent',
    'Samarqand',
    'Buxoro',
    'Andijon',
    'Farg‘ona',
    'Namangan',
    'Jizzax',
    'Sirdaryo',
    'Surxondaryo',
    'Qashqadaryo',
    'Xorazm',
    'Navoiy',
    'Qoraqalpog‘iston Respublikasi',
    // Boshqa hududlar...
  ];

  const center = [41.311081, 69.240562];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get('http://localhost:5001/map');
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
    // Nusxa olish orqali original massivni o'zgartirmaslik
    return [...locationsToSort].sort((a, b) => b.price - a.price);
  };

  const applyRegionFilter = () => {
    if (selectedRegion) {
      const filtered = locations.filter(location => location.mintaqa === selectedRegion);
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
    setIsFilterModalOpen(false);
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
        displayedCount = calculatePercentageCount(locations.length, 25);
      } else if (zoomLevel > 7 && zoomLevel <= 10) {
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
        icon={L.divIcon({
          className: 'custom-icon',
          html: `
            <div style="
              background-color: #28a745; /* Green background */
              border-radius: 15px; /* Rounded corners */
              padding: 5px 10px; /* Padding for some space */
              font-size: 14px; /* Font size */
              color: white; /* Text color */
              text-align: center; /* Centered text */
              width: auto; /* Auto width */
              height: auto; /* Auto height */
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); /* Light shadow for depth */
              display: inline-flex; /* Inline flex for centering */
              align-items: center; /* Center vertically */
              justify-content: center; /* Center horizontally */
              position: relative; /* For pseudo-element positioning */
            ">
              <span style="font-weight: ;">от ${location.price}
              <span style="font-size: 12px;"> млн</span>
               </span> 
            </div>
            <div style="
              position: absolute; 
              bottom: 100%; /* Position above the marker */
              left: 50%; /* Centered horizontally */
              transform: translateX(-50%); /* Centering correction */
              width: 100px; /* Set width */
              background: #28a745; /* Match background color */
              color: white; /* Text color */
              padding: 5px; /* Padding for the tooltip */
              border-radius: 5px; /* Rounded corners */
              text-align: center; /* Center text */
              font-size: 12px; /* Font size for tooltip */
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); /* Shadow for depth */
              visibility: hidden; /* Hide by default */
              opacity: 0; /* Initially invisible */
              transition: opacity 0.2s; /* Transition for fade-in effect */
            "> 
              ${location.price} 
            </div>
          `, // Custom styling directly in JS
          iconSize: [100, 40], // Adjusted icon size
        })}
        eventHandlers={{
          click: () => {
            setSelectedLocation(location);
            setDrawerOpen(true);
          },
        }}
      />
    ));
  }, [filteredLocations]);
  

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={center}
        zoom={14}
        className='w-full h-full z-0' // Ensure map fills the container
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

      {/* Ro'yxat (List) Drawer Trigger Button */}
      <button
        onClick={() => setIsListDrawerOpen(true)}
        className="bg-green-600 text-white px-7 py-2 rounded-lg shadow-md hover:bg-green-700 h-[6vh] absolute bottom-4 left-4 z-50"
      >
        Ro'yxat
      </button>

      {/* Sozlash (Filter) Drawer Trigger Button */}
      <button
        onClick={() => setIsFilterModalOpen(true)}
        className="bg-blue-600 text-white px-7 py-2 rounded-lg shadow-md hover:bg-blue-700 h-[6vh] absolute bottom-4 right-4 z-50"
      >
        Sozlash
      </button>

      {isFilterModalOpen && (
        <div
          className={`fixed 
            ${window.innerWidth <= 500 ? 'bottom-0 left-0 w-full h-[65vh] py-2' : 'right-0 top-0 w-[22%] h-full'}
            bg-white shadow-lg z-50 p-7 overflow-auto transition-transform duration-300
          `}
        >
          <button
            onClick={() => setIsFilterModalOpen(false)}
            className="text-gray-500 text-end w-full hover:text-gray-700 text-2xl mb-2"
          >
            &times;
          </button>
          <h2 className="text-xl font-bold mb-4">Region Tanlang</h2>
          <select
            className="border border-gray-300 rounded p-2 w-full mb-4"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="">Barcha hududlar</option>
            {regions.map((region, index) => (
              <option key={index} value={region}>{region}</option>
            ))}
          </select>
          <div className="flex justify-end space-x-2">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              onClick={applyRegionFilter}
            >
              Filtrlamoq
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              onClick={() => {
                setSelectedRegion('');
                setFilteredLocations(locations);
              }}
            >
              Tozalamoq
            </button>
          </div>
        </div>
      )}
      {isListDrawerOpen && (
        <div
          className={`fixed 
            ${window.innerWidth <= 500 ? 'bottom-0 left-0 w-full h-[65vh] py-2' : 'right-0 top-0 w-[22%] h-full'}
            bg-white shadow-lg z-50 p-7 overflow-auto transition-transform duration-300
          `}
        >
          <button
            onClick={() => setIsListDrawerOpen(false)}
            className="text-gray-500 text-end w-full  hover:text-gray-700 text-2xl mb-2 "
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-4">Ko'rinayotgan Joylar Ro'yxati</h2>
          <ul>
            {filteredLocations.map((location) => (
              <li key={location.id} className="mb-6 border-b pb-4">
                {/* Rasmalar va ma'lumotlar yuqoriga ko'chirildi */}
                <div className="mt-2">
                  <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1} className="mb-4">
                    {/* Display images from current location */}
                    {Array.from({ length: 7 }, (_, idx) => (
                      location[`rasm${idx + 1}`] && (
                        <div key={idx}>
                          <img
                            src={location[`rasm${idx + 1}`]}
                            alt={`${location.nomi} Image ${idx + 1}`}
                            className="rounded-xl w-full h-40 object-cover"
                          />
                        </div>
                      )
                    ))}
                    {location.additionalImages && location.additionalImages.map((img, idx) => (
                      <div key={idx}>
                        <img
                          src={img}
                          alt={`${location.nomi} Additional Image ${idx + 1}`}
                          className="rounded-xl w-full h-40 object-cover"
                        />
                      </div>
                    ))}
                  </Slider>
                </div>
                <h3 className="text-xl font-semibold mt-4">{location.nomi}</h3>
                <p className="text-sm text-gray-600">{location.manzil}</p>
                <p className="text-md font-semibold text-green-600">Price: {location.price} so'm</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Location Drawer */}
      {isDrawerOpen && selectedLocation && (
        <div
          className={`fixed 
            ${window.innerWidth <= 500 ? 'bottom-0 left-0 w-full h-[65vh] py-2' : 'left-0 top-0 w-[22%] h-full'}
            flex flex-col bg-white shadow-lg z-50 p-7 overflow-auto transition-transform duration-300
          `}
        >
          <button
            onClick={() => setDrawerOpen(false)}
            className="mb-4 text-black text-xl hover:underline self-end"
          >
            &times;
          </button>
          <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1} className="mb-4">
            {/* Display images from selected location */}
            {Array.from({ length: 7 }, (_, idx) => (
              selectedLocation[`rasm${idx + 1}`] && (
                <div key={idx}>
                  <img
                    src={selectedLocation[`rasm${idx + 1}`]}
                    alt={`${selectedLocation.nomi} Image ${idx + 1}`}
                    className="rounded-xl w-full h-40 object-cover"
                  />
                </div>
              )
            ))}
            {selectedLocation.additionalImages && selectedLocation.additionalImages.map((img, idx) => (
              <div key={idx}>
                <img
                  src={img}
                  alt={`${selectedLocation.nomi} Additional Image ${idx + 1}`}
                  className="rounded-xl w-full h-40 object-cover"
                />
              </div>
            ))}
          </Slider>
          <div>
            <h3 className="text-lg font-bold mt-6">«{selectedLocation.nomi}»</h3>
            <p className="text-sm text-gray-700">{selectedLocation.manzil}</p>
            <p className="text-md font-semibold text-green-600">Price: {selectedLocation.price} so'm</p>

            {/* Add more information or details here if needed */}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
