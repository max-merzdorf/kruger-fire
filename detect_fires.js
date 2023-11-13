// Start and end dates of the time period to be analyzed:
var start = "YYYY-MM-DD";
var end = "YYYY-MM-DD";
var startyear = 1900;
var endyear = 2300;

// // The name of the shapefile field containing the name / description of the region(s)
var names_field = "Name";

// IMPORTANT: please rename the shapefile to 'table' if it is named differently!

// ------------------------------------------------------------------------------- //
// ---------------------------- SCRIPT PART -------------------------------------- //

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