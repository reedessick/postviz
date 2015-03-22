// library of functions to plot data


/*************************************************
                 GLOBAL VARIABLES
*************************************************/

var svgns = "http://www.w3.org/2000/svg" ;

var skymap_width = 100
var skymap_height = skymap_width * 0.5

/*************************************************
                  TEST FUNCTIONS
*************************************************/
function foo() {
	document.getElementById('button').innerHTML = 'ta-da!';
}


function mollweide_foo() {
        var projection = d3.geo.mollweide()
		.scale(165)
		.translate([width / 2, height / 2])
		.precision(.1);

	var path = d3.geo.path()
		.projection(projection);

	var graticule = d3.geo.graticule();

	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height);

	svg.append("defs").append("path")
		.datum({type: "Sphere"})
		.attr("id", "sphere")
		.attr("d", path);

	return svg
}

function color_pixel(color, pix) {
	
	if (document.getElementById(pix).style.fill == 'rgb(0, 0, 0)') {
		document.getElementById(pix).style.fill = 'rgb(255,255,255)' ;
		document.getElementById('svgbutton').innerHTML = 'find pixel' ;
	}
	else {
		document.getElementById(pix).style.fill = 'rgb(0,0,0)' ;
		document.getElementById('svgbutton').innerHTML = 'hide pixel' ;
	}
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
		                return [fx*2*Math.PI, fy*Math.PI ];
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
		return [latitude + 0.5*Math.PI, longitude]
	}
}

/************************
     svg management
************************/
function nside2npix(nside) {
	return 12 * Math.pow( 4 , Math.log(nside)/Math.LN2 )
}

function create_pixels(pix_params) {

	// parse pix_paras object and fall back to default values if needed
	var nside = pix_params.nside || 1;
	var buffer = pix_params.buffer || 50;
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
	for (var pix = 0 ; pix < npix ; pix ++ ) {
		var iang = hp.pix2ang_ring(nside, pix);

		// re-normalize so this fits within parent svg
		var pos = pixel_pos(iang, {width:width, height:height, projection:projection} );
		var y = buffer + pos[1] ;
		var x = buffer + pos[0] ;

		// instantiate/set the child svg
		var dot = document.createElementNS(svgns, 'circle');
		dot.setAttributeNS(null, 'id', pix);
		dot.setAttributeNS(null, 'cx', x);
		dot.setAttributeNS(null, 'cy', y);
		dot.setAttributeNS(null, 'r', r);
		dot.setAttributeNS(null, 'stroke', 'rgb(0, 0, 0)');
		dot.setAttributeNS(null, 'fill', 'rgb(255, 255, 255)');

		dot.setAttributeNS(null, 'onclick', 'pixel_click('+pix+')' );
		dot.setAttributeNS(null, 'onmouseenter', 'pixel_mouseenter('+pix+', '+par_id+')' );
		dot.setAttributeNS(null, 'onmouseleave', 'pixel_mouseleave('+par_id+')' );

		parent.appendChild(dot)
	}
}

function pixel_click(pix) {
	var element = document.getElementById(pix) ;
	var zoom_element = document.getElementById('zoom'+pix) ;

	switch(element.style.fill) {
		case "rgb(0, 0, 255)":
			element.style.fill = 'rgb(255, 0, 0)';
			zoom_element.style.fill = 'rgb(255, 0, 0)';
			break ;
		case "rgb(0, 255, 0)":
			element.style.fill = 'rgb(0, 0, 255)';
			zoom_element.style.fill = 'rgb(0, 0, 255)';
			break ;
		case "rgb(255, 0, 0)":
			element.style.fill = 'rgb(0, 255, 0)';
			zoom_element.style.fill = 'rgb(0, 255, 0)';
			break ;
		default:
			element.style.fill = 'rgb(255, 0, 0)';
			zoom_element.style.fill = 'rgb(255, 0, 0)';
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
        var buffer = pix_params.buffer || 50;
        var parent_id = pix_params.parent_id || "skymap";
        var r = pix_params.r || 1;

        var projection = pix_params.projection ;

        var twobuffer = 2*buffer ;

        // find parent svg and pull out it's size
        var parent = document.getElementById(parent_id)
        var width = parent.width.animVal.value - twobuffer;
        var height = parent.height.animVal.value - twobuffer;

	// extract position from client
	var pos = [(e.clientX-buffer), (e.clientY-buffer)] ;

	// map into angles
	var ang = pixel_ang( pos, {width:width, height:height, projection:projection} );

	if (ang[0] < 0) { // not allowed physically, so we must be out of bounds
		document.getElementById('coord').innerHTML = "mouse over image to get coords" ;
		// clear zoom element ?
		document.getElementById(zoom_id).innerHTML = "" ;
		
	}
	else {
		document.getElementById('coord').innerHTML = "theta: "+ang[0]+"\n phi  : "+ang[1] ;
		// update zoom element !
		render_zoom( ang, pix_params ) ;
	}

/*
need to get coordinates of the mouse (over svgskymap) and map this into (theta, phi)
then, need to get all pixels within "zoom window" of the specified position
	do this by rotating pixel positions into a new coordinate frame with (theta, phi) as the new north pole
we plot only those pixels.

Once this is up and running, we should start connecting static png figures with pixels. Then we can update those figures on mouseeneter, mouseleave events.

we should then look at "freezing" the figures when we click on a pixel. 
Expand upon this to over-lay data based on which pixels have been clicked. When you click on a pixel the second time, it removes the data...
*/
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
        var buffer = pix_params.buffer || 50;
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
			x = cx + r*Rx*new_p[0] ;
			y = cy + r*Ry*new_p[1] ;
	
			dot = document.createElementNS(svgns, 'circle') ;
			dot.setAttributeNS(null, 'id', 'zoom'+pix);
			dot.setAttributeNS(null, 'cx', x);
			dot.setAttributeNS(null, 'cy', y);
			dot.setAttributeNS(null, 'r', 3);
			dot.setAttributeNS(null, 'stroke', 'rgb(0,0,0');
			fill =  document.getElementById(pix).style.fill ;
			if (fill != '' ) {
				dot.setAttributeNS(null, 'fill', fill );
			}
			else {
				dot.setAttributeNS(null, 'fill', 'rgb(255,255,255)');
			}

			zoom.appendChild( dot )
		}
        }
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
