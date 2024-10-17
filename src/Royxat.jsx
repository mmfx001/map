// LocationsList.jsx
import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const LocationsList = ({ locations, closeModal }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Ko'rinayotgan Joylar Ro'yxati</h2>
        <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
          &#10005;
        </button>
      </div>
      <ul>
        {locations.map((location) => (
          <li key={location.id} className="mb-4 border-b pb-4">
            <h3 className="text-xl font-semibold">{location.nomi}</h3>
            <p className="text-sm text-gray-600">{location.manzil}</p>
            <p className="text-md font-semibold text-green-600">Price: {location.price} so'm</p>
            <div className="mt-2">
              <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
                {location.rasm1 && (
                  <div>
                    <img
                      src={location.rasm1}
                      alt={`${location.nomi} Image 1`}
                      className="rounded-xl w-full h-40 object-cover"
                    />
                  </div>
                )}
                {location.rasm2 && (
                  <div>
                    <img
                      src={location.rasm2}
                      alt={`${location.nomi} Image 2`}
                      className="rounded-xl w-full h-40 object-cover"
                    />
                  </div>
                )}
                {location.rasm3 && (
                  <div>
                    <img
                      src={location.rasm3}
                      alt={`${location.nomi} Image 3`}
                      className="rounded-xl w-full h-40 object-cover"
                    />
                  </div>
                )}
              </Slider>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LocationsList;
