import { useState, useEffect } from 'react';

export default function useCountries() {
    // --- State and Hooks ---
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        async function fetchCountries() {
            try {
                const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3,flags');
                const data = await res.json();
                const list = data
                    .map(c => ({
                        name: c.name.common,
                        code: c.cca2,      // 2-letter code (e.g., 'IL')
                        code3: c.cca3,     // 🔥 FIX 2: Add the 3-letter code to our object
                        flag: c.flags.svg
                    }))
                    .filter(c => c.code3) // Ensure the country has a 3-letter code
                    .sort((a, b) => a.name.localeCompare(b.name));

                setCountries(list);
            } catch (e) {
                console.error('Error fetching countries:', e);
            }
        }
        fetchCountries();
    }, []);

    return countries;
}