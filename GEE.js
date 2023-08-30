print('Hello World!');
//Add region of interest
Map.addLayer(roi)
Map.centerObject(roi, 9);
var imcol = ee.ImageCollection("COPERNICUS/S2_SR")
    .filterBounds(roi)
    .filterDate('2022-09-01','2023-05-30')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',1))
    .sort('CLOUD_COVER',true);
//get the median image
var median = imcol.reduce(ee.Reducer.median());
print(median)

//Display the metadata of the image variable
print(imcol);
//To print on the map, use Map.addLayer. Check the docs to see the format
var ColorPaletteFcc={bands:['B5_median','B4_median','B3_median'],min:0,max:6000};
var ColorPaletteTrue={bands:['B4_median','B3_median','B2_median'],min:0,max:3000};
Map.addLayer(median,ColorPaletteFcc,'False Color',0);
Map.addLayer(median,ColorPaletteTrue,'True Color',0);
//Clipping the image
var ClpIm=median.clip(roi);
//Classification
var TrainFC = Forest.merge(water).merge(snow).merge(barren_land).merge(Agriculture).merge(builtup)
var test=ClpIm.select('B2_median','B3_median','B4_median','B5_median','B6_median','B7_median','B8_median','B9_median','B11_median','B12_median')
var bands=test.bandNames()
var trainingSamples=ClpIm.select(bands).sampleRegions({collection:TrainFC,properties:['landuse'],scale:30});


// Training the SVM Classifier for utilizing in the classification using full image with indices
var classifierTrain=ee.Classifier.smileGradientTreeBoost(10).train({features:trainingSamples,classProperty:'landuse',inputProperties:bands});
var ClassifiedImage=ClpIm.select(bands).classify(classifierTrain);

Map.addLayer(ClassifiedImage,{min:0,max:5,palette:['49df0a','3d85c6','f091bb','111111','f7f117','ff1403']},'Classified Image',0);
