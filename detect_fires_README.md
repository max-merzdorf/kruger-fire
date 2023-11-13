# Detect fire events in shapefile defined locations

This Google Earth Engine script uses the Normalized Burn Ratio+ (NBR+) proposed by
[Alcaras et al. (2022)](https://www.mdpi.com/2072-4292/14/7/1727) to detect fire events for user-defined
locations with Sentinel-2 timeseries.

The locations to be analysed must be provided in form of a **POINTS** shapefile.
(Large) Polygon shapefiles will aggregate NBR+ values and make fires more unlikely to be detectable.
The shapefile must be a single feature or a feature collection. It can not be a MultiPolygon. The shapefile
must contain one field which holds the name of the locality or localities.

### Future features to be added:
1. Scripts for GEE Python API usage
2. Alternative aggregation methods (Median, Mean, ...)
3. Landsat-8 integration for longer time series (may require different index)

## General workflow

1. Import the geometry (shapefile) containing the regions to be analysed
2. Define the variables beneath as required
3. Run the script

The user must define the following variables:
```javascript
// Start and end dates of the time period to be analyzed:
var start = "YYYY-MM-DD";
var end = "YYYY-MM-DD";
var startyear = 1900;
var endyear = 2300;

// // The name of the shapefile field containing the name / description of the region(s)
var names_field = "Name";

// IMPORTANT: please rename the shapefile to 'table' if it is named differently!
```
Notes:
- Dates must be formatted in "YYYY-MM-DD"
- name_field must be string

## Executable script

```javascript
var col = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(table)
  .filterDate(start, end)
  .select('B4', 'B3', 'B2', "B8", "B12");
print(col, "initial collection");
```
Here an ImageCollection is created. It contains all images acquired by Sentinel-2 at the location of
interest during the set timeperiod. Some bands are omitted because they are not needed for visualization or
calculation of the index.


```javascript
var addNBRplus = function(image){
  var b2 = image.select("B2_median");
  var b3 = image.select("B3_median");
  var b8 = image.select("B8_median");
  var b12 = image.select("B12_median");
  
  var nbrplus = b12.subtract(b8).subtract(b3).subtract(b2)
  .divide(b12.add(b8).add(b3).add(b2)).rename("NBR_plus");
  return image.addBands(nbrplus);
};
```
A function to calculate the NBR+ index is defined. It can be mapped over an Image collection.
The function adds a band called "NBR_plus" to the resulting images and retains all other bands. To reduce
file size when exporting the user may apply `.select("NBR_plus")`.


````javascript
var years = ee.List.sequence(startyear, endyear);
var months = ee.List.sequence(1, 12);
````
These sequences are only required to attribute the respective year to each median image later.

````javascript
var colByMonth = ee.ImageCollection(ee.FeatureCollection(years.map(function (y){
  var yearCollection = col.filter(ee.Filter.calendarRange(y, y, "year"));
  var monthsByYear = ee.ImageCollection.fromImages(
    months.map(function (m){
      var medianImage = yearCollection.filter(ee.Filter.calendarRange(m, m, "month"))
      .reduce(ee.Reducer.median());
      return medianImage.set("system:time_start", ee.Date.fromYMD(y, m, 15));
    }));
    return monthsByYear;
})).flatten());
print(colByMonth, "collection aggregated on months");
````
Two `.map()` methods are wrapped around the ImageCollection to act like for-loops. The first, "outer",
iteration iterates of each year in the `years` variable. The second iteration iterates over `ee.List` which
contains a sequence of integers from 1 to 12, representing the months. Median images are then created for
each month (second iter.) of each year (first iter.), and returned to a new ImageCollection.

````javascript
var addNumBands = function(image){
  return image.set({"num_bands": image.bandNames().length()});
};
var numBandsCol = colByMonth.map(addNumBands);

var filtered_col = numBandsCol.filter(ee.Filter.eq("num_bands", 0).not());
print(filtered_col, "filtered collection");
````
In some instanced the previous methods will return a collection that has empty features (0 bands).
The above statements create a new `property` for each image containing the number of bands. This allows
the removal of the empty features. This is necessary because GEE only allows filtering for `property`, but
natively the amount of bands is not stored as a property of an image.

````javascript
var nbr_col_median = filtered_col.map(addNBRplus);
print(nbr_col_median, "NBR added");
````
Add an NBR+ band called `NBR_plus` to each median image.

````javascript
var chart = ui.Chart.image
  .seriesByRegion({
    imageCollection: nbr_col_median,
    band: "NBR_plus",
    regions: table,
    reducer: ee.Reducer.mean(),
    scale: 20,
    seriesProperty: name_field,
    xProperty: "system:time_start"
  })
  .setOptions({
    title: "NBR+ values"
  });
print(chart);
````
Chart for visualization

### Potential pitfalls

An ``Too many points`` exception may be thronw by Google Earth Engine if
1. The shapefile contains too many points
2. The timeseries is too long

In this case, reducing the number of points in the shapefile by splitting it into multiple sites / AOIs is
recommended

## Full script to copy-paste:
````javascript
// Start and end dates of the time period to be analyzed:
var start = "YYYY-MM-DD";
var end = "YYYY-MM-DD";
var startyear = 1900;
var endyear = 2300;

// // The name of the shapefile field containing the name / description of the region(s)
var names_field = "Name";

// IMPORTANT: please rename the shapefile to 'table' if it is named differently!

// ------------------------------------------------------------------------------- //
// -------------------------- DO NOT CHANGE -------------------------------------- //

var col = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(table)
  .filterDate(start, end)
  .select('B4', 'B3', 'B2', "B8", "B12");
print(col, "initial collection");

var addNBRplus = function(image){
  var b2 = image.select("B2_median");
  var b3 = image.select("B3_median");
  var b8 = image.select("B8_median");
  var b12 = image.select("B12_median");
  
  var nbrplus = b12.subtract(b8).subtract(b3).subtract(b2)
  .divide(b12.add(b8).add(b3).add(b2)).rename("NBR_plus");
  return image.addBands(nbrplus);
};

var years = ee.List.sequence(startyear, endyear);
var months = ee.List.sequence(1, 12);

var colByMonth = ee.ImageCollection(ee.FeatureCollection(years.map(function (y){
  var yearCollection = col.filter(ee.Filter.calendarRange(y, y, "year"));
  var monthsByYear = ee.ImageCollection.fromImages(
    months.map(function (m){
      var medianImage = yearCollection.filter(ee.Filter.calendarRange(m, m, "month"))
      .reduce(ee.Reducer.median());
      return medianImage.set("system:time_start", ee.Date.fromYMD(y, m, 15));
    }));
    return monthsByYear;
})).flatten());
print(colByMonth, "collection aggregated on months");


var addNumBands = function(image){
  return image.set({"num_bands": image.bandNames().length()});
};
var numBandsCol = colByMonth.map(addNumBands);

var filtered_col = numBandsCol.filter(ee.Filter.eq("num_bands", 0).not());
print(filtered_col, "filtered collection");

var nbr_col_median = filtered_col.map(addNBRplus);
print(nbr_col_median, "NBR added");

var chart = ui.Chart.image
  .seriesByRegion({
    imageCollection: nbr_col_median,
    band: "NBR_plus",
    regions: table,
    reducer: ee.Reducer.mean(),
    scale: 20,
    seriesProperty: name_field,
    xProperty: "system:time_start"
  })
  .setOptions({
    title: "NBR+ values"
  });
print(chart);
````