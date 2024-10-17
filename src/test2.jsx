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

// Custom Marker Icon (Original)
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

// Kategoriya asosida filtr maydonlarini belgilash
const categoryFilters = {
  Uchastka: [
    { label: 'Tuman', type: 'select', optionsKey: 'tuman' },
    { label: 'Sotix', type: 'number', key: 'sotix' },
    { label: 'Xona', type: 'number', key: 'xona' },
  ],
  Kvartira: [
    { label: 'Tuman', type: 'select', optionsKey: 'tuman' },
    { label: 'Kvadratura (kv)', type: 'number', key: 'kvadratura' },
    { label: 'Xona', type: 'number', key: 'xona' },
    { label: 'Qavat', type: 'number', key: 'qavat' },
    { label: 'Bino Qavat', type: 'number', key: 'bino_qavat' },
  ],
  Noturarjoy: [
    { label: 'Tuman', type: 'select', optionsKey: 'tuman' },
    { label: 'Kvadratura (kv)', type: 'number', key: 'kvadratura' },
    { label: 'Xona', type: 'number', key: 'xona' },
    { label: 'Qavat', type: 'number', key: 'qavat' },
    { label: 'Bino Qavat', type: 'number', key: 'bino_qavat' },
  ],
  Penhouse: [
    { label: 'Tuman', type: 'select', optionsKey: 'tuman' },
    { label: 'Kvadratura (kv)', type: 'number', key: 'kvadratura' },
    { label: 'Xona', type: 'number', key: 'xona' },
    { label: 'Qavat', type: 'number', key: 'qavat' },
    { label: 'Bino Qavat', type: 'number', key: 'bino_qavat' },
  ],
  Navastroyka: [
    { label: 'Tuman', type: 'select', optionsKey: 'tuman' },
    { label: 'Kvadratura (kv)', type: 'number', key: 'kvadratura' },
    { label: 'Xona', type: 'number', key: 'xona' },
    { label: 'Qavat', type: 'number', key: 'qavat' },
    { label: 'Bino Qavat', type: 'number', key: 'bino_qavat' },
  ],
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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [filters, setFilters] = useState({});

  // Hududlar ro'yxati
  const [regions, setRegions] = useState([]);

  // Kategoriyalar ro'yxati
  const categories = Object.keys(categoryFilters);

  const center = [41.311081, 69.240562];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get('https://api.uysavdo.com/user/get-map-data');
        const data = response.data;

        // Barcha kategoriya ma'lumotlarini birlashtirish
        const combinedLocations = [
          ...(data.uchastka || []),
          ...(data.kvartira || []),
          ...(data.noturarjoy || []),
          ...(data.penhouse || []),
          ...(data.navastroyka || []),
        ];

        // Hududlarni olish
        const uniqueRegions = Array.from(new Set(combinedLocations.map(loc => loc.tuman)));
        setRegions(uniqueRegions);

        setLocations(combinedLocations);
        setFilteredLocations(combinedLocations);
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
    return [...locationsToSort].sort((a, b) => parseFloat(b.narxi) - parseFloat(a.narxi));
  };

  const applyFilters = () => {
    let filtered = [...locations];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(location => location.category === selectedCategory);
    }

    // Region (Tuman) filter
    if (selectedRegion) {
      filtered = filtered.filter(location => location.tuman === selectedRegion);
    }

    // Additional filters based on category
    if (selectedCategory && categoryFilters[selectedCategory]) {
      const currentFilters = categoryFilters[selectedCategory];
      currentFilters.forEach(filter => {
        if (filters[filter.key] || filters[filter.label]) {
          switch (filter.type) {
            case 'number':
              if (filters[filter.key]) {
                const { min, max } = filters[filter.key];
                filtered = filtered.filter(location => {
                  const value = parseFloat(location[filter.key].replace(/[^0-9.]/g, ''));
                  return value >= (min || 0) && value <= (max || Infinity);
                });
              }
              break;
            case 'select':
              if (filters[filter.label]) {
                filtered = filtered.filter(location => location[filter.key || 'category'] === filters[filter.label]);
              }
              break;
            default:
              break;
          }
        }
      });
    }

    setFilteredLocations(filtered);
    setIsFilterModalOpen(false);
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedRegion('');
    setFilters({});
    setFilteredLocations(locations);
    setIsFilterModalOpen(false);
  };

  const handleFilterChange = (e, filterKey) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const handleRangeChange = (e, filterKey, bound) => {
    const value = Number(e.target.value);
    setFilters(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [bound]: value,
      },
    }));
  };

  const ZoomChecker = () => {
    const map = useMapEvent('zoomend', () => {
      const zoomLevel = map.getZoom();
      debouncedHandleZoom(map, zoomLevel);
    });

    const debouncedHandleZoom = useDebounce((map, zoomLevel) => {
      let displayedCount = 0;

      if (zoomLevel < 2) {
        displayedCount = 1;
      } else if (zoomLevel >= 2 && zoomLevel <= 4) {
        displayedCount = calculatePercentageCount(locations.length, 5);
      } else if (zoomLevel > 4 && zoomLevel <= 6) {
        displayedCount = calculatePercentageCount(locations.length, 12);
      } else if (zoomLevel > 6 && zoomLevel <= 9) {
        displayedCount = calculatePercentageCount(locations.length, 20);
      } else if (zoomLevel > 9 && zoomLevel <= 12) {
        displayedCount = calculatePercentageCount(locations.length, 30);
      } else if (zoomLevel > 12 && zoomLevel <= 14) {
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
        key={`${location.category}-${location.id}`}
        position={[parseFloat(location.latitude), parseFloat(location.longitude)]}
        icon={L.divIcon({
          className: 'custom-icon',
          html: `
            <div style="
              background-color: #28a745; /* Green background */
              border-radius: 15px; /* Rounded corners */
              padding: 5px 15px; /* Padding for some space */
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
              <span>${location.narxi} so'm</span>
            </div>
          `,
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
        zoom={16}
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

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div
          className={`fixed 
            ${window.innerWidth <= 500 ? 'bottom-0 left-0 w-full h-[65vh] py-2' : 'right-0 top-0 w-[32%] h-full'}
            bg-white shadow-lg z-50 p-7 overflow-auto transition-transform duration-300
          `}
        >
          <button
            onClick={() => setIsFilterModalOpen(false)}
            className="text-gray-500 text-end w-full hover:text-gray-700 text-2xl mb-2"
          >
            &times;
          </button>
          <h2 className="text-xl font-bold mb-4">Filtrlar</h2>

          {/* Category Filter */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Kategoriya</label>
            <select
              className="border border-gray-300 rounded p-2 w-full"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setFilters({});
              }}
            >
              <option value="">Barcha kategoriyalar</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Filters based on selected category */}
          {selectedCategory && categoryFilters[selectedCategory] && (
            <div className="mb-4">
              {categoryFilters[selectedCategory].map((filter, index) => (
                <div key={index} className="mb-4">
                  <label className="block text-gray-700 mb-2">{filter.label}</label>
                  {filter.type === 'select' ? (
                    <select
                      className="border border-gray-300 rounded p-2 w-full"
                      value={filters[filter.key || filter.label] || ''}
                      onChange={(e) => handleFilterChange(e, filter.key || filter.label)}
                    >
                      <option value="">Barcha {filter.label}</option>
                      {filter.optionsKey ? (
                        // Agar filter optionsKey bo'lsa, masalan tuman
                        regions.map((region, idx) => (
                          <option key={idx} value={region}>{region}</option>
                        ))
                      ) : (
                        // Agar filter options mavjud bo'lsa, masalan Remont
                        filter.options.map((option, idx) => (
                          <option key={idx} value={option}>{option}</option>
                        ))
                      )}
                    </select>
                  ) : filter.type === 'number' ? (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters[filter.key]?.min || ''}
                        onChange={(e) => handleRangeChange(e, filter.key, 'min')}
                        className="border border-gray-300 rounded p-2 w-1/2"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters[filter.key]?.max || ''}
                        onChange={(e) => handleRangeChange(e, filter.key, 'max')}
                        className="border border-gray-300 rounded p-2 w-1/2"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              onClick={applyFilters}
            >
              Filtrlamoq
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              onClick={resetFilters}
            >
              Tozalamoq
            </button>
          </div>
        </div>
      )}

      {/* List Drawer */}
      {isListDrawerOpen && (
        <div
          className={`fixed 
            ${window.innerWidth <= 500 ? 'bottom-0 left-0 w-full h-[65vh] py-2' : 'right-0 top-0 w-[32%] h-full'}
            bg-white shadow-lg z-50 p-7 overflow-auto transition-transform duration-300
          `}
        >
          <button
            onClick={() => setIsListDrawerOpen(false)}
            className="text-gray-500 text-end w-full hover:text-gray-700 text-2xl mb-2 "
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-4">Ko'rinayotgan Joylar Ro'yxati</h2>
          <ul>
            {filteredLocations.map((location) => (
              <li key={`${location.category}-${location.id}`} className="mb-6 border-b pb-4">
                <div className="mt-2">
                  <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1} className="mb-4">
                    {/* Display images from current location */}
                    {Array.from({ length: 5 }, (_, idx) => (
                      location[`photo${idx + 1}`] && (
                        <div key={idx}>
                          <img
                            src={`https://api.uysavdo.com${location[`photo${idx + 1}`]}`}
                            alt={`${location.joylashuv} Image ${idx + 1}`}
                            className="rounded-xl w-full h-40 object-cover"
                          />
                        </div>
                      )
                    ))}
                  </Slider>
                </div>
                <h3 className="text-xl font-semibold mt-4">{location.joylashuv}</h3>
                <p className="text-sm text-gray-600">Hudud: {location.tuman}</p>
                <p className="text-md font-semibold text-green-600">Narxi: {location.narxi} so'm</p>
                <p className="text-sm text-gray-600">Kategoriya: {location.category}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Location Drawer */}
      {isDrawerOpen && selectedLocation && (
        <div
          className={`fixed 
            ${window.innerWidth <= 500 ? 'bottom-0 left-0 w-full h-[65vh] py-2' : 'left-0 top-0 w-[32%] h-full'}
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
            {Array.from({ length: 5 }, (_, idx) => (
              selectedLocation[`photo${idx + 1}`] && (
                <div key={idx}>
                  <img
                    src={`https://api.uysavdo.com${selectedLocation[`photo${idx + 1}`]}`}
                    alt={`${selectedLocation.joylashuv} Image ${idx + 1}`}
                    className="rounded-xl w-full h-40 object-cover"
                  />
                </div>
              )
            ))}
          </Slider>
          <div>
            <h3 className="text-lg font-bold mt-6">«{selectedLocation.joylashuv}»</h3>
            <p className="text-sm text-gray-700">Hudud: {selectedLocation.tuman}</p>
            <p className="text-md font-semibold text-green-600">Narxi: {selectedLocation.narxi} so'm</p>
            <p className="text-sm text-gray-700">Kategoriya: {selectedLocation.category}</p>
            <p className="text-sm text-gray-700 mt-2">{selectedLocation.description}</p>
            <div className="mt-4">
              <h4 className="font-semibold">Aloqa:</h4>
              <ul>
                {selectedLocation.phones && selectedLocation.phones.map((phone, idx) => (
                  <li key={idx} className="text-sm text-gray-600">{phone}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
