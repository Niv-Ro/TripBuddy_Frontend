import { useState, useEffect } from 'react';

export default function useCountries() {
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        async function fetchCountries() {
            try {
                // Fetched ccn3 for mapping
                const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3,ccn3,flags');
                const data = await res.json();
                const list = data
                    .map(c => ({
                        name: c.name.common,
                        code: c.cca2,      // 2-letter code (e.g., 'IL')
                        code3: c.cca3,     // 3-letter code (e.g., 'ISR')
                        ccn3: c.ccn3,      // 3-digit numeric code (e.g., '376')
                        flag: c.flags.svg
                    }))
                    .filter(c => c.code3 && c.ccn3) // filter out countries without important information,ensure the country has the necessary codes
                    .sort((a, b) => a.name.localeCompare(b.name)); //sort alphabetically

                setCountries(list);
            } catch (e) {
                console.error('Error fetching countries:', e);
            }
        }
        fetchCountries();
    }, []);

    return countries;
}
