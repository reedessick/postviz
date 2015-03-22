// library of functions to plot data


/*************************************************
                 GLOBAL VARIABLES
*************************************************/

var svgns = "http://www.w3.org/2000/svg" ;

var skymap_width = 100
var skymap_height = skymap_width * 0.5

var magic_number = 8 ; // has to do with where the image is rendered on the html page...

/*************************************************
                  TEST FUNCTIONS
*************************************************/
function color_pixel(color, pix) {
	var dot = document.getElementById(pix) ;	
	dot.setAttributeNS(null, 'fill', color) ;
	dot.setAttributeNS(null, 'stroke', color) ;
/*
	if (dot.getAttributeNS(null, 'fill') == 'rgb(0, 0, 0)') {
		dot.setAttributeNS(null, 'fill', 'rgb(255,255,255)') ;
		document.getElementById('svgbutton').innerHTML = 'find pixel' ;
	}
	else {
		dot.setAttributeNS(null, 'fill', 'rgb(0,0,0)') ;
		document.getElementById('svgbutton').innerHTML = 'hide pixel' ;
	}
*/
}

/*************************************************
              PRODUCTION FUNCTIONS
*************************************************/

/************************
    pixel positioning
************************/
function pixel_pos(ang, params) {
	var width = params.width || 100 ;
	var height = params.height || 50 ;

	switch(params.projection) {
		case 'mollweide':
			var pos = mollweide_pos(ang);
			return [pos[0]*width, pos[1]*height] ;
			break;
		default:
			return [ang[1]*0.5/Math.PI * width, ang[0]/Math.PI * height ] ;
	}
}

function mollweide_pos(ang) {
	var longitude = ang[1] ;
	var latitude = 0.5*Math.PI - ang[0] ;

	var theta = auxangle( latitude ) ;

	var x = 0.5*(1+(longitude/Math.PI - 1) * Math.cos(theta)) ;
	var y = 0.5*(1+Math.sin(theta)) ;

	return [x, y] ;
}

function auxangle( latitude ) {
	if (Math.abs(latitude) == 0.5*Math.PI){
		return latitude;
	}
	else {
		return recursive_auxangle( latitude, Math.PI*Math.sin(latitude), 0.000001, 0, 101 );
	}
}

function recursive_auxangle( theta, PIsinlatitude, err, depth, maxdepth ) {
	if (depth > maxdepth) {
		throw "exceeded maxdepth="+maxdepth+" in recursive_auxangle" ;
		return theta ;
	}
	var twotheta = 2*theta ;
	var dtheta = -(twotheta + Math.sin(twotheta) - PIsinlatitude)/(2 + 2*Math.cos(twotheta)) ;

	if (Math.abs(dtheta) < err) {
		return theta + dtheta;
	}
	else {
		return recursive_auxangle( theta+dtheta, PIsinlatitude, err, depth+1, maxdepth);
	}
}

function pixel_ang(pos, params) {
        var width = params.width || 100 ;
        var height = params.height || 50 ;

	var fy = pos[1]/height ;
	var fx = pos[0]/width ;

	if ( fy>=0 && fy<=1 && fx>=0 && fx<=1 ) {
	        switch(params.projection) {
       		        case 'mollweide':
                	        return mollweide_ang([fx, fy]) ;
	       	                break ;
        	       	default:
		                return [fy*Math.PI, fx*2*Math.PI ];
		}
        }
	else {
		return [-1, -1] ;
	}
}

function mollweide_ang(pos) {
	var x = 2*pos[0]-1 ;
	var y = 2*pos[1]-1 ;

	var theta = Math.asin(y) ;
	var twotheta = 2*theta ;

	var longitude = Math.PI + Math.PI*x / Math.cos(theta) ;
	if (longitude<0 || longitude>2*Math.PI) {
		return [-1, -1];
	}
	else {
		var latitude = Math.asin( (twotheta + Math.sin(twotheta))/Math.PI) ;
		return [0.5*Math.PI - latitude , longitude]
	}
}

/************************
     svg management
************************/
function nside2npix(nside) {
	return 12 * Math.pow( 4 , Math.log(nside)/Math.LN2 )
}

function npix2nside(npix) {
	return Math.pow( npix/12, 0.5 )
}

function create_pixels(pix_params) {

	// parse pix_paras object and fall back to default values if needed
	var nside = pix_params.nside || 1;
	var buffer = pix_params.buffer || 0;
	var parent_id = pix_params.parent_id || "skymap";
	var r = pix_params.r || 1;

	var projection = pix_params.projection ;

	var par_id = 'par1';

	var twobuffer = 2*buffer ;

	// find parent svg and pull out it's size
	var parent = document.getElementById(parent_id)
	var width = parent.width.animVal.value - twobuffer;
	var height = parent.height.animVal.value - twobuffer;

	// iterate over pixels and draw one per point
	var hp = new HEALPix();
	var npix = nside2npix(nside);
	var pos_params = {width:width, height:height, projection:projection};
	for (var pix = 0 ; pix < npix ; pix ++ ) {
		var iang = hp.pix2ang_ring(nside, pix);

		// re-normalize so this fits within parent svg
		var pos = pixel_pos(iang, pos_params );
		var y = buffer + pos[1] ;
		var x = buffer + pos[0] ;

		// instantiate/set the child svg
		var dot = document.createElementNS(svgns, 'circle');
		dot.setAttributeNS(null, 'id', pix);
		dot.setAttributeNS(null, 'cx', x);
		dot.setAttributeNS(null, 'cy', y);
		dot.setAttributeNS(null, 'r', r);
//		dot.setAttributeNS(null, 'stroke', 'rgb(255, 255, 255)');
		dot.setAttributeNS(null, 'stroke', 'rgb(0, 0, 0)');
		dot.setAttributeNS(null, 'fill', 'rgb(255, 255, 255)');

		dot.setAttributeNS(null, 'onclick', 'pixel_click('+pix+')' );
		dot.setAttributeNS(null, 'onmouseenter', 'pixel_mouseenter('+pix+', '+par_id+')' );
		dot.setAttributeNS(null, 'onmouseleave', 'pixel_mouseleave('+par_id+')' );

		parent.appendChild(dot);
	}

	// draw graticule
	var linestr = "" ;
	var linecolor = 'rgb(100,100,100)';

	var pos ;
	var count=0 ;
	var dtheta = 30;
	var x;
	var y;
	for (var theta=dtheta; theta <= 180; theta+=dtheta) {
		pos = pixel_pos( [theta*Math.PI/180, 0], pos_params ); 
		x = buffer + pos[0];
		y = buffer + pos[1];
		linestr = x+","+y;
		pos = pixel_pos( [theta*Math.PI/180, 2*Math.PI], pos_params ); 
		x = buffer + pos[0];
		y = buffer + pos[1];
		linestr += " "+x+","+y;

		var polyline = document.createElementNS(svgns, 'polyline');
		polyline.setAttributeNS(null, 'id', 'graticule'+count);
		count ++ ;
		polyline.setAttributeNS(null, 'points', linestr);
		polyline.setAttributeNS(null, 'stroke', linecolor);

		parent.appendChild( polyline );
	}

	var dtheta = 1;
	var dphi = 45;
	for (var phi=0; phi <=360; phi+=dphi) {
		linestr = " " ;
		for (theta=0 ; theta<=180; theta+=dtheta) {
	                pos = pixel_pos( [theta*Math.PI/180, phi*Math.PI/180], pos_params ); 
			x = buffer + pos[0];
			y = buffer + pos[1];
        	        linestr += " "+x+","+y;
		}

                var polyline = document.createElementNS(svgns, 'polyline');
                polyline.setAttributeNS(null, 'id', 'graticule'+count);
                count ++ ;
                polyline.setAttributeNS(null, 'points', linestr);
                polyline.setAttributeNS(null, 'stroke', linecolor ) ;
                polyline.setAttributeNS(null, 'fill', 'none' );

                parent.appendChild( polyline );
	}	
}

function pixel_click(pix) {
	var element = document.getElementById(pix) ;
	var zoom_element = document.getElementById('zoom'+pix) ;

	var fill = element.getAttributeNS(null, 'fill');

	switch(fill) {
		case "rgb(0, 0, 255)":
			element.setAttributeNS(null, 'fill', 'rgb(255, 0, 0)') ;
			zoom_element.setAttributeNS(null, 'fill', 'rgb(255, 0, 0)' );
			break ;
		case "rgb(0, 255, 0)":
			element.setAttributeNS(null, 'fill','rgb(0, 0, 255)') ;
			zoom_element.setAttributeNS(null, 'fill', 'rgb(0, 0, 255)') ;
			break ;
		case "rgb(255, 0, 0)":
			element.setAttributeNS(null, 'fill','rgb(0, 255, 0)') ;
			zoom_element.setAttributeNS(null, 'fill', 'rgb(0, 255, 0)') ;
			break ;
		default:
			element.setAttributeNS(null, 'fill', 'rgb(255, 0, 0)') ;
			zoom_element.setAttributeNS(null, 'fill', 'rgb(255, 0, 0)') ;
	}

	switch(element.style.stroke) {
		case fill:
			element.setAttributeNS(null, 'stroke','rgb(0, 0, 0)') ;
//			zoom_element.setAttributeNS(null, 'stroke','rgb(0, 0, 0)') ;
			break ;
		default:
			var new_fill = element.getAttributeNS(null, 'fill');
			element.setAttributeNS(null, 'stroke', new_fill)  ;
//			zoom_element.setAttributeNS(null, 'stroke', new_fill)  ;
	}
}		

function pixel_mouseenter( pix, par_element ) {
	par_element.innerHTML = "pix_id : "+pix;
}

function pixel_mouseleave( par_element ) {
	par_element.innerHTML = "mouse over a pixel to learn it's pix_id" ;
}

function update_zoom( e, pix_params ) {
        // parse pix_params object and fall back to default values if needed
        var zoom_id = pix_params.zoom_id || 'svgzoom' ;
        var nside = pix_params.nside || 1;
        var buffer = pix_params.buffer || 0;
        var parent_id = pix_params.parent_id || "skymap";
        var r = pix_params.r || 1;

        var projection = pix_params.projection ;

        var twobuffer = 2*buffer ;

        // find parent svg and pull out it's size
        var parent = document.getElementById(parent_id)
        var width = parent.width.animVal.value - twobuffer;
        var height = parent.height.animVal.value - twobuffer;

	// extract position from client
	var pos = [e.clientX-buffer-magic_number, e.clientY-buffer-magic_number] ;

	// map into angles
	var ang = pixel_ang( pos, {width:width, height:height, projection:projection} );

	if (ang[0] < 0) { // not allowed physically, so we must be out of bounds
		document.getElementById('coord').innerHTML = "mouse over image to get coords" ;
		// clear zoom element ?
		document.getElementById(zoom_id).innerHTML = "" ;
		
	}
	else {
		document.getElementById('coord').innerHTML = "theta: "+ang[0]+" phi  : "+ang[1] ;
		// update zoom element !
		render_zoom( ang, pix_params ) ;
	}

}

function clearCoor() {
	document.getElementById('coord').innerHTML = 'mouse over image to get coords' ;
}

function render_zoom( ang, pix_params ) {
	t = ang[0];
	p = ang[1];

	// parser pix_params
	var zoom_id = pix_params.zoom_id || 'svgzoom' ;
        var nside = pix_params.nside || 1;
        var buffer = pix_params.buffer || 0;
	var zoom_radius = pix_params.zoom_radius || 10 ;

	var twobuffer = 2*buffer ;

        // find parent svg and pull out it's size
        var zoom = document.getElementById( zoom_id ) ;	
        var width = zoom.width.animVal.value - twobuffer;
        var height = zoom.height.animVal.value - twobuffer;
	var Rx = 0.5*width ;
	var Ry = 0.5*height ;
	var cx = buffer + Rx ;
	var cy = buffer + Ry ;

	// empty the zoom element!
	zoom.innerHTML = "" ;

	// figure out zoom scale via pixarea
        var hp = new HEALPix();
        var npix = nside2npix(nside);
	var pixarea = 4*Math.PI / npix ;
	var angres = Math.pow( pixarea, 0.5 ); 

	var radius = zoom_radius * angres

	if (radius < Math.PI/18) {
		raidus = Math.PI/18 ;
	}

	// size of dots
	var dotsize = 0.25 * Math.min(Rx, Ry) / zoom_radius ;

        // iterate over pixels
	var iang;
	var new_t;
	var r;
	var new_p;
	var x;
	var y;
	var dot;
	var fill;

        for (var pix = 0 ; pix < npix ; pix ++ ) {
                iang = hp.pix2ang_ring(nside, pix);

		new_t = dtheta( t, p, iang[0], iang[1] ); // angular separation
		if (new_t <= radius){ // point is close enough to plot!
			r = new_t / radius ;

			new_p = get_new_p( iang[0], iang[1], t, p, new_t) ;

			// compute new_p
			x = cx + r*Rx*new_p[1] ;
			y = cy + r*Ry*new_p[0] ;
	
			dot = document.createElementNS(svgns, 'circle') ;
			dot.setAttributeNS(null, 'id', 'zoom'+pix);
			dot.setAttributeNS(null, 'cx', x);
			dot.setAttributeNS(null, 'cy', y);
			dot.setAttributeNS(null, 'r', dotsize);

			fill =  document.getElementById(pix).getAttributeNS(null, 'fill') ;
			if (fill != '' ) {
				dot.setAttributeNS(null, 'fill', fill );
			}
			else {
				dot.setAttributeNS(null, 'fill', 'rgb(255,255,255)');
			}

			dot.setAttributeNS(null, 'stroke', 'rgb(100,100,100');
//			dot.setAttributeNS(null, 'stroke', 'rgb(0,0,0');

			zoom.appendChild( dot )
		}
        }

        // put cross-hairs on zoom
        // horizontal line
        var line = document.createElementNS(svgns, 'line');
        line.setAttributeNS(null, 'id', 'hcrosshair');
        line.setAttributeNS(null, 'x1', cx-Rx);
        line.setAttributeNS(null, 'x2', cx+Rx);
        line.setAttributeNS(null, 'y1', cy);
        line.setAttributeNS(null, 'y2', cy);
        line.setAttributeNS(null, 'stroke', 'rgb(0, 0, 0)');
        zoom.appendChild( line );

        // vertical line
        var line = document.createElementNS(svgns, 'line');
        line.setAttributeNS(null, 'id', 'vcrosshair');
        line.setAttributeNS(null, 'x1', cx);
        line.setAttributeNS(null, 'x2', cx);
        line.setAttributeNS(null, 'y1', cy-Ry);
        line.setAttributeNS(null, 'y2', cy+Ry);
        line.setAttributeNS(null, 'stroke', 'rgb(0, 0, 0)');
        zoom.appendChild( line );

}

function dtheta( t1, p1, t2, p2) {
	cosdtheta = Math.cos(t1)*Math.cos(t2) + Math.sin(t1)*Math.sin(t2)*Math.cos(p1-p2) ;
	return Math.acos( cosdtheta );
}

function get_new_p( t, p, to, po, cosTheta) {
	var y = Math.sin(t)*Math.sin(p-po) ;
	var x = Math.cos(t)*Math.sin(to) - Math.sin(t)*Math.cos(to)*Math.cos(p-po) ;

	var norm = Math.pow( Math.pow(x, 2) + Math.pow(y,2) , 0.5)

	x /= norm ;
	y /= norm ;

	return [x, y] ;
}

function fillin_pixels() {

	npix = sample.length ;

	var color;
	var p;
	for (var pix = 0; pix < npix ; pix++) {
		p = sample[pix] ;
		if (p == 0) {
			color = 'rgb(255, 255, 255)' ;
		}
		else {
			color = Math.ceil( 255 *(1 -  Math.pow( p/max, 0.5 ) ) ) ;
			color = 'rgb(255,'+color+',255)' ;
		}

		dot = document.getElementById(pix) ; 
		dot.setAttributeNS(null, 'fill', color) ;
		dot.setAttributeNS(null, 'stroke', color) ;
//		dot.setAttributeNS(null, 'stroke', 'rgb(0, 0, 0)') ;
	}
}

/*************************************************
                FITs processing
*************************************************/
// Define a callback function for when the FITS file is received
var callback = function() {

	// Get the first header-dataunit containing a dataunit
	var hdu = this.getHDU();

	// Get the first header
	var header = this.getHeader();
	// or we can do
	var header = hdu.header;

	// Read a card from the header
	var bitpix = header.get('BITPIX');

	// Get the dataunit object
	var dataunit = hdu.data;
	// or we can do
	var dataunit = this.getDataUnit();

	// Do some wicked client side processing ...
}
