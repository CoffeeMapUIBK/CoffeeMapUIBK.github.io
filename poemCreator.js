currentCountry = null;

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
    let dataElement = document.getElementById('country-name');
    currentCountry = params.data;
    if (params.data) {
        dataElement.innerHTML = params.data;
    } else {
        dataElement.innerHTML = 'No Country selected';
    }
}

window.onload = displayData;

document.addEventListener("DOMContentLoaded", async function () {
    displayData();
    const apiKey = 'API_KEY';
    const poem = await fetchPoem(apiKey, currentCountry);
    typeText(poem, document.getElementById('poem'));
});

async function fetchPoem(apiKey, country) {
    console.log(country)
    const url = 'https://api.openai.com/v1/chat/completions';
    const prompt = `Schreibe ein Gedicht, welches Kaffee und ${country} (übersetze das Land auf deutsch) verbindet. Es muss sich reimen und Geographie witze enthaten. Maximal vier Strophen`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ "role": "system", "content": "Ich bin ein Lyrik-Assistent." }, { "role": "user", "content": prompt }]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}


function typeText(text, element) {
    let i = 0;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 25);  // Adjust typing speed here (in milliseconds)
        }
    }
    type();
}