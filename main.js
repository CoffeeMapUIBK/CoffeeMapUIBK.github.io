document.addEventListener('DOMContentLoaded', function () {
    if (typeof countries === 'undefined') {
        console.error('Countries data is not loaded.');
        return;
    }

    if (typeof refills === 'undefined') {
        console.error('Refills data is not loaded.');
        return;
    }

    var map = L.map('map',
        {
            fullscreenControl: true,
            fullscreenControlOptions: {
                position: 'topleft'
            }
        }
    ).setView([20, 0], 2); // Center the map for a global view

    // Add a basic tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.Control.geocoder().addTo(map);


    // Initialize the minimap
    var miniMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });

    var miniMap = new L.Control.MiniMap(miniMapLayer, {
        toggleDisplay: true,
        width: 250,        // Set the width of the minimap
        height: 150,        // Set the height of the minimap
        zoomLevelFixed: 0, // Set the zoom level for the minimap
        minimized: false,
        position: 'bottomleft',
    }).addTo(map);
    // 
 
    // Variables for the selected year and data type
    var selectedYear = '2016';
    var selectedData = 'Total.Cup.Points';
    var selectedMonth = 0; // Default to January
    var climateData = [];

    // Load climate data from external file
    fetch('climateData.json')
        .then(response => response.json())
        .then(data => {
            climateData = data;
            updateMap(); // Update the map after loading climate data
        })
        .catch(error => console.error('Error loading climate data:', error));

    // Function to get data for a specific year and data type
    function getDataForYear(ratings, year, dataType) {
        if (!ratings || !Array.isArray(ratings)) {
            return null;
        }
        var dataEntry = ratings.find(r => r.Year == year);
        if (!dataEntry) {
            return null;
        }
        return dataEntry.Data[dataType] || null;
    }

    // Function to get the min and max values for the selected data type and year
    function getMinMaxValues(countries, year, dataType) {
        var values = countries.features.map(function (feature) {
            return getDataForYear(feature.properties.ratings, year, dataType);
        }).filter(function (value) {
            return value !== null;
        });

        if (values.length === 0) {
            return { min: 0, max: 0 }; // Default to 0 to avoid errors
        }

        var min = Math.min.apply(Math, values);
        var max = Math.max.apply(Math, values);

        return { min: min, max: max };
    }

    // Color based on data value and dynamically calculated scale
    function getColor(value, min, max) {
        if (value === null) return '#FFFFFF'; // Default color for NA
        var scale = (value - min) / (max - min);
        return scale > 0.8 ? '#800026' :
            scale > 0.6 ? '#BD0026' :
                scale > 0.4 ? '#E31A1C' :
                    scale > 0.2 ? '#FC4E2A' :
                        scale > 0.1 ? '#FD8D3C' :
                            '#FEB24C';
    }

    // Function to update the map with new data
    function updateMap() {
        var minMax = getMinMaxValues(countries, selectedYear, selectedData);
        coffeeStatsLayer.eachLayer(function (layer) {
            var feature = layer.feature;

            var value = getDataForYear(feature.properties.ratings, selectedYear, selectedData);
            ///
            var popupContent = `
    <div class="p-4">
        <div class="text-lg bold mb-1">Country: 
            <span class="text-amber-600">${feature.properties.ADMIN || 'Unknown'}</span>
        </div>
        <div class="text-gray-700">
            <span class="font-medium">Value (${selectedYear}):</span> 
            ${value !== null ? value.toFixed(2) : 'NA'}
        </div>
    </div>
`;
            // Add climate data to the popup content
            var climateInfo = getClimateData(feature.properties.ADMIN, selectedMonth);
            if (climateInfo) {
                popupContent += `
        <div class="mt-1 p-2 bg-white">
            <div class="font-semibold mb-2">Closest Climate Data for: 
                <span class="">${climateInfo.city}</span> 
                (${getMonthName(selectedMonth)}):
            </div>
            <div class="text-gray-700">
                <div class="mt-2">
                    <span class="font-medium font-semibold">High:</span> 
                    <span class="text-red-600">${climateInfo.data.high}°C</span>
                </div>
                <div class="mt-1">
                    <span class="font-medium font-semibold">Low:</span> 
                    <span class="text-blue-600">${climateInfo.data.low}°C</span>
                </div>
                <div class="mt-1">
                    <span class="font-medium font-semibold">Dry Days:</span> 
                    ${climateInfo.data.dryDays}
                </div>
                <div class="mt-1">
                    <span class="font-medium font-semibold">Snow Days:</span> 
                    ${climateInfo.data.snowDays}
                </div>
                <div class="mt-1">
                    <span class="font-medium font-semibold">Rainfall:</span> 
                    ${climateInfo.data.rainfall} mm
                </div>
            </div>
        </div>
    `;
            } else {
                popupContent += '<br><div class="mt-1 p-2 bg-white italic">No Climate Data Available</div>';
            }
            // link to charts
            popupContent += '<br> <a href="detailPage.html?data=' + feature.properties.ADMIN + '"><div class="mt-2 p-2 bg-amber-800 text-white rounded-md"><i class="fa-solid fa-chart-simple"></i>  More Details</div></a>';

            // link to poem
            popupContent += '<br> <a href="poemPage.html?data=' + feature.properties.ADMIN + '"><div class="mt-2 p-2 bg-amber-800 text-white rounded-md"><i class="fa-solid fa-feather"></i>  Nice Poem</div></a>';
            ///
            layer.setStyle({
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7,
                fillColor: getColor(value, minMax.min, minMax.max)
            });
            layer.bindPopup(popupContent);
        });
    }

    function getClimateData(country, month) {
        for (var i = 0; i < climateData.length; i++) {
            if (climateData[i].country === country) {
                return {
                    city: climateData[i].city,
                    data: climateData[i].monthlyAvg[month]
                };
            }
        }
        return null;
    }

    function getMonthName(monthIndex) {
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return monthNames[monthIndex];
    }

    // GeoJSON layer for coffee statistics
    var coffeeStatsLayer = L.geoJson(countries, {
        style: function (feature) {
            var minMax = getMinMaxValues(countries, selectedYear, selectedData);
            var value = getDataForYear(feature.properties.ratings, selectedYear, selectedData);
            return {
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7,
                fillColor: getColor(value, minMax.min, minMax.max)
            };
        },
        onEachFeature: function (feature, layer) {
            var value = getDataForYear(feature.properties.ratings, selectedYear, selectedData);
            var popupContent = 'Country: ' + (feature.properties.ADMIN || 'Unknown') + '<br>Value (' + selectedYear + '): ' + (value !== null ? value : 'NA');

            // Add climate data to the popup content
            var climateInfo = getClimateData(feature.properties.ADMIN, selectedMonth);
            if (climateInfo) {
                popupContent += '<br><br><b>Closest Climate Data for: ' + climateInfo.city + ' (' + getMonthName(selectedMonth) + '):</b><br>' +
                    'High: ' + climateInfo.data.high + '°C<br>' +
                    'Low: ' + climateInfo.data.low + '°C<br>' +
                    'Dry Days: ' + climateInfo.data.dryDays + '<br>' +
                    'Snow Days: ' + climateInfo.data.snowDays + '<br>' +
                    'Rainfall: ' + climateInfo.data.rainfall + ' mm';
            }

            layer.bindPopup(popupContent);
        }
    }).addTo(map);

    // Placeholder layers for coffee shops and cup exchanges
    var coffeeShopsLayer = L.layerGroup().addTo(map);

    // Define a custom coffee icon for the refill stations
    var coffeeIcon = L.icon({
        iconUrl: 'icons/coffee.png', // Replace with the path to your coffee icon image
        iconSize: [32, 37], // Size of the icon
        iconAnchor: [16, 37], // Point of the icon which will correspond to marker's location
        popupAnchor: [0, -28] // Point from which the popup should open relative to the iconAnchor
    });

    var recupIcon = L.icon({
        iconUrl: 'icons/recuplogo.png', // Replace with the path to your coffee icon image
        iconSize: [40, 40], // Size of the icon
        iconAnchor: [16, 37], // Point of the icon which will correspond to marker's location
        popupAnchor: [0, -28] // Point from which the popup should open relative to the iconAnchor
    });

    // MarkerCluster group for cup exchanges
    var cupExchangesCluster = L.markerClusterGroup();

    // GeoJSON layer for cup exchanges with enhanced popup information
    var cupExchangesLayer = L.geoJson(refills, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, { icon: recupIcon });
        },
        onEachFeature: function (feature, layer) {
            var props = feature.properties;
            var popupContent = '<b>' + (props.name || 'Unknown Station') + '</b><br>' +
                'Address: ' + (props.Straße || 'No Address') + '<br>' +
                'URL: ' + (props.URL || "No Link");
            layer.bindPopup(popupContent);
        }
    });

    // Add the cup exchanges layer to the cluster group
    cupExchangesCluster.addLayer(cupExchangesLayer);
    map.addLayer(cupExchangesCluster);

    // Layers control to toggle on and off the coffee statistics and places layers
    var baseLayers = {};
    var overlays = {
        "Coffee Statistics": coffeeStatsLayer,
        "Nearby Coffee Shops": coffeeShopsLayer,
        "ReCup Stations": cupExchangesCluster
    };

    L.control.layers(baseLayers, overlays).addTo(map);

    // Event listeners for the dropdown and slider
    document.getElementById('dataSelector').addEventListener('change', function (e) {
        selectedData = e.target.value;
        updateMap();
    });

    document.getElementById('yearSlider').addEventListener('input', function (e) {
        selectedYear = e.target.value;
        document.getElementById('yearLabel').innerText = selectedYear;
        updateMap();
    });

    document.getElementById('monthSelector').addEventListener('change', function (e) {
        selectedMonth = parseInt(e.target.value);
        updateMap();
    });


    // Initial map update
    updateMap();

    // Function to plot user location and nearby coffee shops
    function plotUserLocation(lat, lng) {
        var userMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup('Your Location')
            .openPopup();

        map.setView([lat, lng], 14); // Zoom in to user location

        // Fetch and plot nearby coffee locations
        fetchNearbyCoffeeLocations(lat, lng);
    }

    // fetch nearby coffee locations using an external API
    function fetchNearbyCoffeeLocations(lat, lng) {
        var overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=cafe](around:5000,${lat},${lng});out;`;

        fetch(overpassUrl)
            .then(response => response.json())
            .then(data => {
                data.elements.forEach(function (element) {
                    var coffeeShopMarker = L.marker([element.lat, element.lon], { icon: coffeeIcon })
                        .addTo(coffeeShopsLayer)
                        .bindPopup('<b>' + (element.tags.name || 'Unnamed Cafe') + '</b><br>' +
                            'Address: ' + (element.tags['addr:street'] || 'No Address') + '<br>' +
                            'Website: ' + (element.tags.website || 'No Website'));
                });
            })
            .catch(error => console.error('Error fetching coffee locations:', error));
    }

    // Request user's geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            plotUserLocation(lat, lng);
        }, function (error) {
            console.error('Error getting geolocation:', error);
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
});

