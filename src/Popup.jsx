// PopupComponent.jsx
import React from 'react';
import Slider from 'react-slick';

const PopupComponent = ({ location }) => {
  return (
    <div className="popup-content bg-white rounded-lg shadow-lg p-4 w-full">
      <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
        {Array.from({ length: 7 }, (_, idx) => (
          location[`rasm${idx + 1}`] && (
            <div key={idx}>
              <img
                src={location[`rasm${idx + 1}`]}
                alt={`${location.nomi} Image ${idx + 1}`}
                className="popup-image rounded-xl w-full h-40 object-cover"
              />
            </div>
          )
        ))}
        {location.additionalImages && location.additionalImages.map((img, idx) => (
          <div key={idx}>
            <img
              src={img}
              alt={`${location.nomi} Image ${idx + 8}`}
              className="popup-image rounded-xl w-full h-40 object-cover"
            />
          </div>
        ))}
      </Slider>
      <h3 className="text-lg font-bold mt-6">«{location.nomi}» TJM</h3>
      <h3 className="text-base font-bold mt-6 text-green-600">{location.nomi}</h3>
      <p className="text-sm text-gray-700">{location.manzil}</p>
      <button className="w-full h-12 text-base rounded-lg bg-blue-700 text-white mt-2">
        Menga qo'ng'iroq qiling!
      </button>
    </div>
  );
};

export default PopupComponent;
