description = "reads in a posterior samples file, greedyBins by pixel, and creates corner plots for each pixel"
usage = "posteriorSamples2corner.py [--options] posterior_samples.dat"
author = "Reed Essick (reed.essick@ligo.org)"

import healpy as hp
import numpy as np

import matplotlib
matplotlib.use("Agg")
from matplotlib import pyplot as plt
import corner

from optparse import OptionParser

#=================================================

pi_2 = np.pi * 0.5

#=================================================

parser = OptionParser( description=description, usage=usage )

parser.add_option("-v", "--verbose", default=False, action="store_true")

parser.add_option("-n", "--nside", default=128, type="int")

parser.add_option("-o", "--output-dir", default=".", type="string")

opts, args = parser.parse_args()

if len(args) != 1:
    raise ValueError("please supply exactly one input argument")
postsamples_file = args[0]

if opts.nside%2:
    raise ValueError("--nside must be a multiple of 2")

#=================================================

if opts.verbose:
  print "reading posterior samples from : %s"%(postsamples_file)

postsamples = []
postsamples_obj = open( postsamples_file, "r" )
cols = postsamples_obj.readline().strip().split() ### assumes first line is column names
for line in postsamples_obj:
    postsamples.append( dict( zip( cols, [float(l) for l in line.strip().split()] ) ) )
postsamples_obj.close()

#=================================================

npix = hp.nside2npix( opts.nside )
if opts.verbose:
    print "binning by pixel : nside = %d -> npix = %d"%(opts.nside, npix)
pixpostsamples = [ []*npix ]
for sample in postsamples:
    theta = pi_2 - sample['dec']
    phi = sample['ra']
    pixpostsamples[ hp.ang2pix( opts.nside, theta, phi ) ].append( sample )

#=================================================

if opts.verbose:
    print "generating corner plots"
for pix in xrange( npix ):
    samples = pixpostsamples[pix]

    raise StandardError("WRITE CORNER PLOTTING")
    """
    only plot intrinsic parameters?
    plot everything except RA,Dec?
    """


