# WORK IN PROGRESS

import ee
import datetime
#import gcloud
import geojson as gj
from IPython.display import Image, display
#ee.Authenticate()
ee.Initialize()

# Variables:
fire_start = datetime.datetime(2023, 9, 14) # Date the fire started
fire_end = datetime.datetime(2023, 9, 17) # Date the fire was extinguished
KNP = ee.FeatureCollection("projects/ee-maximilianmerzdorf/assets/KrugerNP")

#############################################################################

fire_start = fire_start - datetime.timedelta(days=1)
fire_end = fire_end + datetime.timedelta(days=1)
twoweeks = datetime.timedelta(days=14)

# one ImgCol for pre- and one for post-fire NBR:
prefire = ee.ImageCollection(
    "COPERNICUS/S2_SR_HARMONIZED"
).filterBounds(
    KNP
).select(
    ["B8", "B12"]
).filterDate(
    fire_start, fire_start - twoweeks
)

postfire = ee.ImageCollection(
    "COPERNICUS/S2_SR_HARMONIZED"
).filterBounds(
    KNP
).select(
    ["B8", "B12"]
).filterDate(
    fire_end, fire_end + twoweeks
)

# Cloud masking:

def s2_cloudmasking(image):
    cloudBitMask = 1024
    cirrusBitMask = 2048
    qa = image.select("QA60")
    # Both flags set to zero
    mask = qa.bitwiseAnd(cloudBitMask).eq(0).AND(qa.bitwiseAnd(cirrusBitMask).eq(0))
    return image.updateMask(mask).divide(10000).select(["B8", "B12"]).copyProperties(image, ["system:time_start"])

pre_cf = prefire.map(s2_cloudmasking(prefire))
post_cf = postfire.map(s2_cloudmasking(postfire))

premosaic = prefire.mosaic()
postmosaic = postfire.mosaic()

prefire_image = premosaic.clip(KNP)
postfire_image = postmosaic.clip(KNP)

export_pre = ee.batch.Export.image.toDrive(prefire_image, "prefireimg", folder="Kruger", scale=30)
export_post = ee.batch.Export.image.toDrive(postfire_image, "postfireimg", folder="Kruger", scale=30)

export_pre.start()
export_post.start()
