import rasterio
import geopandas
import matplotlib
from rasterio.plot import show
from rasterio.merge import merge
from pathlib2 import Path

img = "C:/EAGLE/INT-1_Kruger/data/raster/dNBR_kruger1.tif"
dataset = rasterio.open(img)
dnbr = dataset.read()

# merge mutliple tif files
path = Path("C:/EAGLE/INT-1_Kruger/data/raster/test/")
outpath = "C:/EAGLE/INT-1_Kruger/data/raster/"
raster_files = list(path.iterdir())
raster_to_mosaic = []

for file in raster_files:
    raster = rasterio.open(file)
    raster_to_mosaic.append(raster)

mosaic, output = merge(raster_to_mosaic)
output_meta = raster.meta.copy()
output_meta.update(
    {"driver": "GTiff",
        "height": mosaic.shape[1],
        "width": mosaic.shape[2],
        "transform": output,
    })

with rasterio.open(outpath, "w", **output_meta) as m:
    m.write(mosaic)