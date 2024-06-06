## topojson 
topojson statt geojson für weltkarte nutzen da weniger speicher
let drawLandkreise = L.geoJson(null,{
    filter: function(){
        return true
    },
    onEachFeature: function(feature,layer){
        log(feature)
        layer.bindPopup(
            html 
        )
    }
});
omnivore.topojson("xxx.topojson", null, drawlandkreise).addTo(map)