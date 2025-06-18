
"use client"
import {useEffect, useState} from "react";

function mapView() {
    return (
        <div>
            <h2>mapView</h2>
        </div>
    )
}
export default mapView;
// // File: components/MapView.js
// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import gsap from "gsap";
//
// export default function MapView() {
//     const mapContainer = useRef(null);
//     const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
//
//     useEffect(() => {
//         const loadScript = (src) =>
//             new Promise((resolve, reject) => {
//                 if (document.querySelector(`script[src='${src}']`)) {
//                     return resolve();
//                 }
//                 const s = document.createElement('script');
//                 s.src = src;
//                 s.onload = () => resolve(s);
//                 s.onerror = () => reject(new Error(`Failed to load ${src}`));
//                 document.body.appendChild(s);
//             });
//
//         const loadCSS = (href) => {
//             if (document.querySelector(`link[href='${href}']`)) return;
//             const link = document.createElement('link');
//             link.rel = 'stylesheet';
//             link.href = href;
//             document.head.appendChild(link);
//         };
//
//         async function initialize() {
//             try {
//                 // Load jQuery
//                 if (!window.jQuery) {
//                     await loadScript('https://code.jquery.com/jquery-3.6.0.min.js');
//                 }
//                 // Load MapSVG CSS
//                 loadCSS('https://cdn.jsdelivr.net/npm/mapsvg@7.1.7/jquery.mapSvg.min.css');
//                 // Load Raphael (dependency)
//                 await loadScript('https://cdnjs.cloudflare.com/ajax/libs/raphael/2.3.0/raphael.min.js');
//                 // Load MapSVG plugin
//                 await loadScript('https://cdn.jsdelivr.net/npm/mapsvg@7.1.7/jquery.mapSvg.min.js');
//                 initMap();
//             } catch (err) {
//                 console.error('Map dependencies failed to load:', err);
//             }
//         }
//
//         initialize();
//     }, []);
//
//     const initMap = () => {
//         const $ = window.jQuery;
//         if (!$.fn.mapSvg) {
//             console.error('mapSvg plugin not found.');
//             return;
//         }
//
//         const $container = $(mapContainer.current);
//         $container.mapSvg({
//             size: { width: '100%', height: '100%' },
//             source: 'https://cdn.jsdelivr.net/npm/mapsvg@7.1.7/maps/world.svg',
//             responsive: true,
//             stroke: '#ffffff',
//             strokeWidth: 1,
//             colors: { default: '#D3D3D3' },
//             zoom: { enabled: true, step: 1.2 },
//             stateSettings: {
//                 hoverColor: '#4CAF50',
//                 selColor: '#FF5722',
//                 render: { path: true, circle: false }
//             },
//             onClick: function (e, id) {
//                 const name = this.get(id).name;
//                 alert(`You clicked on ${name}`);
//             }
//         });
//
//         const mapObj = $container.mapSvg('get');
//         const el = mapContainer.current;
//
//         el.addEventListener('mousemove', (e) => {
//             const target = e.target;
//             if (target.tagName === 'path' && target.id) {
//                 const name = mapObj.get(target.id).name;
//                 const rect = el.getBoundingClientRect();
//                 setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, text: name });
//             } else {
//                 setTooltip((t) => ({ ...t, visible: false }));
//             }
//         });
//
//         gsap.from(el.querySelectorAll('path'), { duration: 1, opacity: 0, stagger: 0.005, ease: 'power1.out' });
//     };
//
//     return (
//         <div ref={mapContainer} style={{ position: 'relative', width: '100%', height: '80vh' }}>
//             <div
//                 style={{
//                     position: 'absolute', pointerEvents: 'none', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 8px',
//                     borderRadius: '4px', transform: 'translate(-50%, -120%)', whiteSpace: 'nowrap',
//                     display: tooltip.visible ? 'block' : 'none', left: tooltip.x, top: tooltip.y
//                 }}
//             >
//                 {tooltip.text}
//             </div>
//         </div>
//     );
// }
