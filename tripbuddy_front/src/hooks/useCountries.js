import { useState, useEffect } from 'react';

export default function useCountries() {
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        async function fetchCountries() {
            try {
                const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags');
                const data = await res.json();
                const list = data
                    .map(c => ({
                        name: c.name.common,
                        code: c.cca2, // קוד המדינה, למשל 'IL'
                        flag: c.flags.svg // כתובת ה-URL של הדגל
                    }))
                    .filter(Boolean)
                    .sort((a, b) => a.name.localeCompare(b)); // ממיין לפי שם המדינה

                setCountries(list);
            } catch (e) {
                console.error('Error fetching countries:', e);
            }
        }
        fetchCountries();
    }, []);

    return countries;
}