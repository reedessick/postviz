description = "converts a fits file into your json format for html.index"
usage = "fits2json.py [--options] filename.fits filename.json"
author = "Reed Essick (reed.essick@ligo.org)"

import os
import healpy as hp
import numpy as np

from optparse import OptionParser

#=================================================

parser = OptionParser(usage=usage , description=description)

parser.add_option("-v", "--verbose", default=False, action="store_true")

parser.add_option("-n", "--nside", default=32, type="int", help="the maximum desired level of decomposition for the resulting json file")

opts, args = parser.parse_args()

if not hp.isnsideok( opts.nside ):
    raise ValueError("--nside must be a power of 2")

if len(args) != 2:
    raise ValueError("please supply exactly 2 argument")
fits, json = args

#=================================================

if opts.verbose:
    print "reading map : %s"%fits
skymap, header = hp.read_map( fits, h=True )
npix = len(skymap)
nside = hp.npix2nside( npix )

print "WARNING: assuming map is RING ordered"

if nside > opts.nside:
    if opts.verbose:
        print "downsampling : nside=%d -> %d"%(nside, opts.nside)
    skymap = hp.ud_grade( skymap, opts.nside, power=-2 )
    nside = opts.nside
    npix = len(skymap)

if opts.verbose:
    print "writing json : %s"%json
dirname = os.path.dirname( json )
if dirname and (not os.path.exists( dirname )):
    os.makedirs( dirname )
json_obj = open( json, "w" )
print >> json_obj, "sample=[%s];"%(", ".join( "%.9e"%p for p in skymap ))
print >> json_obj, "min = %.9e;"%(np.min(skymap))
print >> json_obj, "max = %.9e;"%( np.max(skymap))
json_obj.close()
