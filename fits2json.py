description = "converts a fits file into your json format for html.index"
usage = "fits2json.py [--options] filename.fits filename.json"
author = "Reed Essick (reed.essick@ligo.org)"

import os
import healpy as hp

from optparse import OptionParser

#=================================================

parser = OptionParser(usage=usage , description=description)

parser.add_option("-v", "--verbose", default=False, action="store_true")

parser.add_option("-n", "--nside", default=32, type="int", help="the desired level of decomposition for the resulting json file")

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

raise StandardError("FIGURE OUT WHETHER MAP IS NEST OR RING -> TRANSFORM TO RING IF NEEDED")

if opts.verbose:
    print "writing json : %s"%json
if not os.path.exists( os.path.dirname( json ) ):
    os.makedirs( os.path.dirname( json ) )
json_obj = open( json, "w" )

raise StandardError("PRINT FITS DATA INTO json_obj WITH APPROPRIATE FORMAT")

json_obj.close()
