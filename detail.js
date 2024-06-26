currentCountry = null;
let myCharts;

function getQueryParams() {
    let params = {};
    let queryString = window.location.search;
    if (queryString) {
        queryString = queryString.substring(1); // Remove the leading '?'
        let paramPairs = queryString.split('&');
        for (let pair of paramPairs) {
            let [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
    }
    return params;
}


function displayData() {
    let params = getQueryParams();
    let dataElement = document.getElementById('data');
    currentCountry = params.data;
    if (params.data) {
        dataElement.innerHTML = params.data;
    } else {
        dataElement.innerHTML = 'No Country selected';
    }
}

window.onload = displayData;

function loadChart(data) {
    if (myCharts) {
        myCharts.destroy(); // Destroy the existing chart instance
    }

    var ctx = document.getElementById('myChart').getContext('2d');
    var labels = data.map(entry => entry.year);
    var values = data.map(entry => entry.value);

    myCharts = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Value',
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


function getCountryData(countryName, fieldName) {
    let dataList = [];
    countries.features.forEach(feature => {
        if (feature.properties.ADMIN === countryName) {
            feature.properties.ratings.forEach(rating => {
                let year = rating.Year;
                let value = rating.Data[fieldName];
                if (value !== undefined) {
                    dataList.push({ year: year, value: value });
                }
            });
        }
    });
    return dataList;
}

document.getElementById('dataSelector').addEventListener('change', function () {
    const selectedField = this.value;
    const data = getCountryData(currentCountry, selectedField);
    if (data && data.length > 0) {
        document.getElementById('error').setAttribute('style', 'display: none;');
        loadChart(data);
    } else {
        document.getElementById('error').setAttribute('style', 'display: block;');
        console.error('No data available for the selected country and field.');
    }
});




