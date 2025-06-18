import { useState, useEffect } from 'react';

export default function useCountries() {
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        async function fetchCountries() {
            try {
                const res = await fetch('https://restcountries.com/v3.1/all?fields=name');
                const data = await res.json();
                const list = data
                    .map(c => c.name.common)
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b));
                setCountries(list);
            } catch (e) {
                console.error('Error fetching countries:', e);
            }
        }
        fetchCountries();
    }, []);

    return countries;
}