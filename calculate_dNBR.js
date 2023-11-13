// Calculation of dNBR (NBR at two different times) in a shapefile area

// Define start and end date of fire:
var firestart = "YYYY-MM-DD";
var fireend = "YYYY-MM-DD";

// Period of weeks before and after the fire to look for images
// more time will yield more images BUT greater inaccuracy due to phenological changes
var weeks = 3;

// IMPORTANT: please rename the shapefile to 'table' if it is named differently!

// ------------------------------------------------------------------------------- //
// ---------------------------- SCRIPT PART -------------------------------------- //

var fire_start = ee.Date(firestart).advance(-1, "day");
var fire_end = ee.Date(fireend).advance(1, "day");

// define date ranges for images as follows:
var prefire = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(table)
  .filterDate(fire_start.advance(-weeks, "week"), fire_start)
  .sort("CLOUDY_PIXEL_PERCENTAGE")
  .first()
  .select('B4', 'B3', 'B2', "B8", "B12", "QA60");

var postfire = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(table)
  .filterDate(fire_end, fire_end.advance(weeks, "week"))
  .sort("CLOUDY_PIXEL_PERCENTAGE")
  .first()
  .select('B4', 'B3', 'B2', "B8", "B12", "QA60");

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

var preNBR = prefire.normalizedDifference(["B8", "B12"]);
var postNBR = postfire.normalizedDifference(["B8", "B12"]);
var dNBR = preNBR.subtract(postNBR);

// Multiply dNBR by factor 1000 according to UN-SPIDER:
var dNBR_scaled = dNBR.multiply(1000);
print(dNBR_scaled);

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