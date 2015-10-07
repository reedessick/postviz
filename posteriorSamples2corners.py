description = "reads in a posterior samples file, greedyBins by pixel, and creates corner plots for each pixel"
usage = "posteriorSamples2corner.py [--options] posterior_samples.dat"
author = "Reed Essick (reed.essick@ligo.org)"

import healpy as hp
import numpy as np

import os

import matplotlib
matplotlib.use("Agg")
from matplotlib import pyplot as plt
import corner

from optparse import OptionParser

#=================================================

pi_2 = np.pi * 0.5

#=================================================
# LIB
#=================================================

#plotparams = 'loghrss quality frequency polar_eccentricity alpha time ra dec'.split()
#labels = ["$\log h_{rss}$", "$q$", "$f$", "$\epsilon$", "$\\alpha$", "$t_{geocent}$", "$RA$", "$Dec$"]

plotparams = 'loghrss quality frequency time'.split()
labels = ["$\log h_{rss}$", "$q$", "$f$", "$t_{geocent}$"]

#=================================================
# LALInference
#=================================================

#plotparams = "mtotal chi m1 ra m2 psi costheta_jn a1 a2 distance mc phi_orb q eta time dec".split()
#labels = ["$M_{T}$", "$\xi$", "$m_{1}$", "$RA$", "$m_{2}$", "$\psi$", "$\cos\\theta_{jn}$", "$a_{1}$", "$a_{2}$", "$D$", "$M_{c}$", "$\phi_{orb}$", "$q$", "$\eta$", "$t_{geocent}$", "$Dec$"]

#plotparams = "a1 a2 distance costheta_jn mc eta time".split()
#labels = ["$a_{1}$", "$a_{2}$", "$D$", "$\cos\\theta_{jn}$", "$M_{c}$", "$\eta$", "$t_{geocent}$"]

#=================================================

Ndim = len(plotparams)

#=================================================

parser = OptionParser( description=description, usage=usage )

parser.add_option("-v", "--verbose", default=False, action="store_true")

parser.add_option("-n", "--nside", default=128, type="int")

parser.add_option("-o", "--output-dir", default=".", type="string")

opts, args = parser.parse_args()

if len(args) != 1:
    raise ValueError("please supply exactly one input argument")
postsamples_file = args[0]

if not hp.isnsideok( opts.nside ):
    raise ValueError("--nside must be a power of 2")

if not os.path.exists(opts.output_dir):
    os.makedirs(opts.output_dir)

#=================================================

if opts.verbose:
  print "reading posterior samples from : %s"%(postsamples_file)

postsamples = []
postsamples_obj = open( postsamples_file, "r" )
cols = postsamples_obj.readline().strip().split() ### assumes first line is column names
for c in plotparams:
    if c not in cols:
        raise ValueError( "could find column %s in %s"%(c, postsamples_file) )
for line in postsamples_obj:
    postsamples.append( dict( zip( cols, [float(l) for l in line.strip().split()] ) ) )
postsamples_obj.close()

Nsmp = len(postsamples)

if "time" in plotparams:
    mtime = np.mean( [sample['time'] for sample in postsamples] )
    for sample in postsamples:
        sample['time'] -= mtime

#=================================================

npix = hp.nside2npix( opts.nside )
if opts.verbose:
    print "binning by pixel : nside = %d -> npix = %d"%(opts.nside, npix)
pixpostsamples = [ [] for pix in xrange(npix) ]
for sample in postsamples:
    theta = pi_2 - sample['dec']
    phi = sample['ra']

    pixpostsamples[ hp.ang2pix( opts.nside, theta, phi ) ].append( sample )

#=================================================

if opts.verbose:
    print "generating corner plots:"
    for c in plotparams:
        print "\t", c

for pix in xrange( npix ):
    samples = pixpostsamples[pix]
    nsmp = len(samples)

    if nsmp > Ndim:

        data = np.array( [ [sample[c] for c in plotparams ] for sample in samples ] )

        fig = corner.corner( data, 
                             labels = labels, 
                             truths = [0.0]*Ndim, 
                             quantiles = [0.10, 0.50, 0.90], 
                             show_titles = True, 
                             title_args = {"fontsize":12} 
                           )
  
        fig.text( 0.9, 0.9, "pix %d"%(pix) , ha='center', va='center' )
        fig.text( 0.9, 0.8, "%d / %d = %.3f"%(nsmp, Nsmp, 1.0*nsmp/Nsmp) , ha='center', va='center' )

    else:
        fig = plt.figure()
        fig.text( 0.9, 0.9, "pix %d"%(pix) , ha='center', va='center' )
        fig.text( 0.9, 0.8, "%d / %d = %.3f"%(nsmp, Nsmp, 1.0*nsmp/Nsmp) , ha='center', va='center' )
        
    figname = "%s/%d.png"%(opts.output_dir, pix)
    if opts.verbose:
        print figname
    fig.savefig( figname )
    plt.close( fig )
    
if opts.verbose:
    print "generating corner plot for the entire sample distribution"
data = np.array( [ [sample[c] for c in plotparams ] for sample in postsamples ] )

fig = corner.corner( data,
                     labels = labels,
                     truths = [0.0]*Ndim,
                     quantiles = [0.10, 0.50, 0.90],
                     show_titles = True,
                     title_args = {"fontsize":12}
                   )

#    fig.text( 0.9, 0.9, "%d / %d = %.3f"%(Nsmp, Nsmp, 1.0*Nsmp/Nsmp) , ha='center', va='center' )

figname = "%s/allsky.png"%(opts.output_dir)
if opts.verbose:
    print figname
fig.savefig( figname )
plt.close( fig )
