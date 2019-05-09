import sys
import json

import numpy as np
import healpy as hp

#-------------------------------------------------

nside = int(sys.argv[1])

#-------------------------------------------------

skymap = [0 for _ in range(hp.nside2npix(nside))]

samples = np.genfromtxt(sys.argv[2], names=True)
for phi, theta in zip(samples['ra'], 0.5*np.pi-samples['dec']):
    skymap[hp.ang2pix(nside, theta, phi)] += 1
prefact = 1./(hp.nside2pixarea(nside, degrees=False)*len(samples))
skymap = [i*prefact for i in skymap]

#-------------------------------------------------

json_obj = open( 'samples.js', "w" )
print >> json_obj, "sample=[%s];"%(", ".join( "%.9e"%p for p in skymap ))
print >> json_obj, "min = %.9e;"%(np.min(skymap))
print >> json_obj, "max = %.9e;"%( np.max(skymap))
json_obj.close()
