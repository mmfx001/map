import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UchastkaList = () => {
    const [uchastkalar, setUchastkalar] = useState([]);

    useEffect(() => {
        const fetchUchastkalar = async () => {
            try {
                // API so'rovini yuborish
                const response = await axios.get('https://api.uysavdo.com/user/get-map-data');
                
                // Backend dan kelayotgan ma'lumotlarni logga chiqarish
                console.log('Backend dan kelayotgan ma\'lumotlar:', response.data.uchastka);
                
                // Uchastkalar ma'lumotlarini state ga saqlash
                setUchastkalar(response.data.uchastka);
            } catch (error) {
                // Xatolik bo'lsa, xato haqida ma'lumot logga chiqarish
                console.error('Xatolik:', error.response ? error.response.data : error.message);
            }
        };
        fetchUchastkalar();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uchastkalar.map(uchastka => (
                <div key={uchastka.id} className="border rounded-lg p-4">
                    <img src={uchastka.photo1} alt={`Uchastka ${uchastka.id}`} className="w-full h-40 object-cover rounded-t-lg" />
                    <h3 className="text-lg font-bold">{uchastka.joylashuv}</h3>
                    <p>{uchastka.narxi} so'm</p>
                    <p>{uchastka.description}</p>
                </div>
            ))}
        </div>
    );
};

export default UchastkaList;
