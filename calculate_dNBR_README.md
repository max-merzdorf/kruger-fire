# Calculate scaled dNBR values
This GEE script allows the calculation of difference Normalized Burn Ratio (dNBR) values to quantify burn severity.
The dNBR, proposed by [Miller & Thode (2007)](https://www.sciencedirect.com/science/article/pii/S0034425706005128?casa_token=CB0pjyzmxW4AAAAA:iFsz84SUlRHNeeA1wuZne9nxlevqGUqTkI0976dHQ_xBO-L4gPn-ewzTMuj0xh2DHGWoxGeSI8E#bbib18)
uses pre- and post-fire imagery to assess the severity of fire events. NBR was originally proposed by [Key & Benson (2005)](http://gsp.humboldt.edu/OLM/Courses/GSP_216/labs/rmrs_gtr164_13_land_assess.pdf)

Areas to be analyzed must be provided in form of a (multi-)polygon shapefile uploaded to GEE. Please retain the
default GEE naming 'table'.

The user must further define the following variables:
````javascript
// Define start and end date of fire:
var firestart = "YYYY-MM-DD";
var fireend = "YYYY-MM-DD";

// Period of weeks before and after the fire to look for images
// more time will yield more images BUT greater inaccuracy due to phenological changes
var weeks = 3;
````
The ``weeks`` parameter may be changed if the amount of images available is insufficient.
PLEASE NOTE: increasing the ``weeks`` parameter will mean that the images used in the analysis may increase
the inaccuracy of the analysis. The calculated difference may then stem to a greater part from phenological
change than if the timeperiod was kept shorter.

````javascript
var vis = {
  min: 0,
  max: 3000,
  bands: ['B4', 'B3', 'B2'],
};
Map.addLayer(prefire, vis, "Prefire Image");
print(prefire);
Map.centerObject(prefire);
Map.addLayer(postfire, vis, "Postfire Image");
print(postfire);
````
Visualization of pre- and post-fire images

````javascript
var preNBR = prefire.normalizedDifference(["B8", "B12"]);
var postNBR = postfire.normalizedDifference(["B8", "B12"]);
var dNBR = preNBR.subtract(postNBR);

// Multiply dNBR by factor 1000 according to UN-SPIDER:
var dNBR_scaled = dNBR.multiply(1000);
print(dNBR_scaled);
````
Calculate NBR for both images, result is dNBR image.

````javascript
/*
Export.image.toDrive({
  image: dNBR_scaled,
  folder: "Kruger",
  region: KNP_south,
  description: "dNBR_scaled_res20_mosaic_fire05oct",
  //maxPixels: 10000000000000,
    scale: 20
});
*/
````
Optional export statement, modify as necessary.