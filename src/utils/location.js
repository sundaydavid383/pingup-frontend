
let locationData = {};
const location = async () => {
    if(navigator.geolocation){
        console.log("📍 Asking for location permission...")
        
        await new Promise((resolve)=> {
            navigator.geolocation.getCurrentPosition(
                async (pos)=> {
                    console.log("✅ Location granted:", pos.coords);
                    
                    const {latitude, longitude } = pos.coords;
                    locationData = { latitude, longitude };

                    try {
                        const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY
                        const response = await fetch(
                        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`
                        )
                        const data = await response.json();

                        if(data.results.length > 0){
                            const components = data.results[0].components
                            locationData.city = components.city || components.town || components.village || "";
                            locationData.country = components.country || "";
                            console.log(locationData)
                        }
                        
                    } catch (error) {
                        console.warn("⚠️ Failed to fetch city/country:", error.message)
                    }
                    resolve();
                },
                (err)=>{
                   console.warn("⚠️ Location denied or unavailable:", err.message)
                  resolve()
                }
            );
        });
    }
    else{
        console.warn("❌ Geolocation not supported in this browser")
    }

    return locationData
}

export default location;
