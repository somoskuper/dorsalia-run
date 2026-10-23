/** Clears leftover Service Workers / caches from the old Netlify SPA on dorsalia.run. */
export default function ClearLegacyServiceWorker() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{if(!('serviceWorker' in navigator))return;navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()});});if(window.caches&&caches.keys){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)});});}}catch(e){}})();`,
      }}
    />
  );
}
