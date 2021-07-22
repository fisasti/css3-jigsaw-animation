var Puzzle = {
	// Object that store all information about the graphic source
	source : {
		type   : null, // 'image' or 'video'
		url    : null, // The URL to access the graphic source
		node   : null, // A reference to the DOM node of the graphic source, HTMLImgElement ou HTMLVideoElement
		width  : 0, 
		height : 0  
	},
	
	// Object that store all information about the Puzzle context
	context : {
		marginX  : 0, // Distance in pixel between the window left border and the Puzzle's zone left border before the zone had an explicit width
		marginY  : 0, // Distance in pixel between the window top border and the Puzzle's zone top border before the zone had an explicit height
		paddingX : 0, // Distance in pixel between the window left border and the Puzzle's zone left border after the zone had an explicit width
		paddingy : 0, // Distance in pixel between the window top border and the Puzzle's zone top border after the zone had an explicit height
		allowFilter : false // Variable which determine if the SVG filters should be applied or not
	},
	
	canvasSrc : document.createElement('canvas'), // Canvas element where the graphic source will be painted
	canvasCtx : null, // 2D Context for the previous canvas element
	
	wLength   : 8, // Number of columns for the puzzle
	hLength   : 5, // Number of lines for the puzzle
	
	sizeRatio : 0, // Which rule to applied to resize the graphic source
	pieces    : new Array(),
	globalZ   : 1, // global z-index value for the piece which is draged to be sure that it's always on top of the others
	savedData : null, // Object that store all the datas that must be saved to be able to resume the game
	
   /**
	* Public method to initialize the puzzle
	*
	* @param url STRING The valide URL of the graphic source
	* @param w INT The total number of columns for the Puzzle
	* @param h INT The total number of lines for the Puzzle
	* @param size INT The size ratio for the graphic source (0 => automatic ; 1 => original size ; 2 => window size)
	*/
	Init : function(url, w, h, size) {
		this.wLength   = w;
		this.hLength   = h;
		this.sizeRatio = size;
		this.canvasCtx = this.canvasSrc.getContext('2d');
		
		// We assume that the graphic source is an image
		var img = new Image();
        
        console.log(this);
		// If it is, we initialize the source when it's loaded
		img.addEventListener('load', function()
		{
			Puzzle.source = {
				type   : 'image',
				url    : this.src,
				node   : this,
				width  : this.width,
				height : this.height
			}
			
			Puzzle.initSrc();
        }, false);
        
		img.src = url;
	},

   /**
	* Sort the puzzle
	*/
	Resolve : function() {
		for(i in this.pieces){
			this.pieces[i].setPosition();
			this.pieces[i].setLock();
		}
		
		this.Save();
	},
	
   /**
	* Method that randomly place the puzzle's pieces
	*/
	Blend : function() {
		var maxX = window.innerWidth  - this.context.marginX*2 - Math.ceil(this.canvasSrc.width *1.5/this.wLength);
		var maxY = window.innerHeight - this.context.marginY*2 - Math.ceil(this.canvasSrc.height*1.5/this.hLength);

		for(i in this.pieces){
			var x = Math.round(Math.random()*maxX) - this.context.paddingX + this.context.marginX;
			var y = Math.round(Math.random()*maxY) - this.context.paddingY + this.context.marginY;
			
			this.pieces[i].setPosition(x, y);
			this.pieces[i].setLock();
		}
        
        this.Save();
        
        setTimeout(function() {console.log('time');Puzzle.Resolve();}, 100)
	},
	
	/**
	 * Method to save the puzzle's current state (graphic source + pieces positions)
	 *
	 * @param piece Piece
	 */
	Save : function(piece) {
		// If there are no datas to be saved, we initilized the object dedicat to saving
		if(this.savedData == null){
			this.savedData = {
				URL    : this.source.url,
				W      : this.wLength,
				H      : this.hLength,
				SIZE   : this.sizeRatio,
				PIECES : new Array()
			}
		}
		
		// If the 'piece' argument is not defined, we saved the position of all pieces
		if(piece == undefined){
			for(i in this.pieces){
				var x = parseInt(this.pieces[i].mainNode.style.left) + this.pieces[i].shadowMargin.left;
				var y = parseInt(this.pieces[i].mainNode.style.top) + this.pieces[i].shadowMargin.top;
					
				this.savedData.PIECES[i] = {
					x : x,
					y : y
				}
			}
		} else {
			var p = piece.mainNode.piece;
			var x = parseInt(piece.mainNode.style.left) + piece.shadowMargin.left;
			var y = parseInt(piece.mainNode.style.top) + piece.shadowMargin.top;
			
			this.savedData.PIECES[p] = {
				x : x,
				y : y
			}
		}
		
		// We convert the object that store all the datas that must be saved into a string
		var data = JSON.stringify(this.savedData);
		
		// Now it is that string which is actually saved
		// window.localStorage.setItem('currentPuzzle', data);
	},
	
   /**
	* Methode that end initialization when the graphic source is set
	*/
	
	initSrc : function() {
		// Cleaning the #zone element, thanks jQuery
		// $('#zone').empty();
		
		// "zone" is the place where the puzzle will stand and it's an HTML div
		var zone = document.getElementById('zone');
		
		// document.getElementById('toolbar').style.display = 'block';
		
		// Setting the UI context
		this.context.marginX = zone.offsetLeft + zone.clientLeft;
		this.context.marginY = zone.offsetTop + zone.clientTop;
		
		// Setting the puzzle size
		var w = this.source.width;
		var h = this.source.height;
		
		// Depending on the user choice, the graphic source is resized
		if(this.sizeRatio != 1){
			// Maximum available size for the puzzle in the current window
			var sw = window.innerWidth  - this.context.marginX*2;
			var sh = window.innerHeight - this.context.marginX*2;
			
			// Computing the ratio size to preserve it if we have to resized the graphic source
			// If h = sh then w = w * wx : wx = sh/h
			// If w = wh then h = h * hx : hx = sw/w
			var wx = sh / h;
			var hx = sw / w;
			
			// Resizing the source
			if(this.sizeRatio == 2 || (this.sizeRatio == 0 && (w > sw || h > sh))){
				if(h * hx > sh){
					h = sh;
					w = w * wx;
				} else {
					h = h * hx;
					w = sw;
				}
			}
		}
		
		zone.style.width  = w + "px";
		zone.style.height = h + "px";
		
		this.context.paddingX = zone.offsetLeft + zone.clientLeft;
		this.context.paddingY = zone.offsetTop + zone.clientTop;
		
		this.canvasSrc.width  = w;
		this.canvasSrc.height = h;
		
		// The first canvas will be used to provide a hint to the user
		zone.appendChild(this.canvasSrc);
		
		// Workaround to prevent Firefox's bug 577824
		// setTimeout('Puzzle.canvasSrc.setAttribute("style","filter : url(#greyed);")',1);
		
		// Bulding pieces
		for(var j=1; j<=this.hLength;j++){
			for(var i=1; i<=this.wLength;i++){
				var pData = {
					column : i,
					line   : j,
					nbrColumns : this.wLength,
					nbrLines   : this.hLength
				};
				
				// Each pieces are references by the main Puzzle object
				this.pieces.push(new Piece(this.canvasSrc, pData));
				
				// We store the reference number of the piece to it's main DOM node
				var p = this.pieces.length - 1;
				this.pieces[p].mainNode.piece = p;
			}
		}
		
		//The puzzle is redraw periodicaly to handle animations
		setInterval("Puzzle.paintSrc("+w+","+h+")", 33); //!\ 33ms is more or less 30 image per seconds, perfect for 60Hz monitor

		// If the graphic source is a video, we display some more UI controls
		if(this.source.type == 'video'){
			document.getElementById('videoControl').style.display = 'inline';
		}
		
		// We get back the previous saved puzzle
		// var data = window.localStorage.getItem('currentPuzzle');
		data = null;
		// If there are datas available, we set each piece to its previous position.
		if(data != null)
		{
			data = JSON.parse(data);
			var length = this.pieces.length
			for(var i = 0; i < length; i++) {

				var x = data.PIECES[i].x;
				var y = data.PIECES[i].y;
				
				this.pieces[i].setPosition(x, y);
				this.pieces[i].setLock();
			}
		// If there are no datas, pieces are randomly positioned
		} else {
            this.Blend();
		}
	},
	
	/**
	 * Method that redraw all necessary canvas elements
	 *
	 * @param w INT width of the zone to be painted
	 * @param h INT height of the zone to be painted
	 */
	paintSrc : function(w, h) {
		this.canvasCtx.clearRect(0, 0, w, h);
		this.canvasCtx.drawImage(this.source.node, 0, 0, w, h);
		
		for(i in this.pieces){
			this.pieces[i].drawSrc(this.canvasSrc);
		}
		
		// Warkaround to the missing support for the "loop" attribut on video element with FF
		if(this.source.type == 'video'){
			if(this.source.node.currentTime == this.source.node.duration){
				this.source.node.currentTime = 0;
			}
		}
	}
}

/**
 * Public method to create a puzzle's piece
 * 
 * @param src CanvasElement
 * @param position OBJECT an object with the following structure : {
 *     column : INT
 *     line   : INT
 *     nbrColumns : INT
 *     nbrLines   : INT
 * }
 */
function Piece(src, position) {
	this.position = position;
	
	// Defining the basic size of that particular piece. The basic saie représente the size of the smallest surface available for a piece
	this.basicSize = {
		width   : Math.round(src.width  / this.position.nbrColumns),
		height  : Math.round(src.height / this.position.nbrLines)
	};
	
	// Defining the margin necessary to make a piece able to get a part of an adjacent piece
	this.margin = {
		width  : Math.round(this.basicSize.width / 4),
		height : Math.round(this.basicSize.height/ 4)
	};
	
	// Defining the true size of the piece
	this.width = this.basicSize.width + 2*this.margin.width ;
	this.height = this.basicSize.height + 2*this.margin.height;
	
	// Setting the x and y position of the piece relative to the Puzzle's zone
	this.x = (this.position.column - 1) * this.basicSize.width - this.margin.width;
	this.y = (this.position.line - 1) * this.basicSize.height - this.margin.height;
	
	// Adjust the width and x position of the piece if it's position on the first or last column
	if(this.position.column == 1){
		this.width = this.basicSize.width + this.margin.width;
		this.x = 0;
	}
	else if(this.position.column == this.position.nbrColumns){
		this.width = src.width - (this.basicSize.width*(this.position.column-1)) + this.margin.width;
		this.x = src.width - this.width;
	}
	
	// Adjust the height and the y position of the piece if it's position on the first or last line
	if(this.position.line == 1){
		this.height = this.basicSize.height + this.margin.height;
		this.y = 0;
	}
	else if(this.position.line == this.position.nbrLines){
		this.height = src.height - (this.basicSize.height*(this.position.line-1)) + this.margin.height;
		this.y = src.height - this.height;
	}
	
	// The SVG object will be a bit bigger to handle drop shadows
	var svgWidth = this.width + this.shadowMargin.left + this.shadowMargin.right;
	var svgHeight = this.height + this.shadowMargin.top + this.shadowMargin.bottom;
	
	// The mouse adjustement to handle the position of the piece (centered to the mouse) when it's drag.
	/*this.mouse = {
		x : Math.round(svgWidth/2 + Puzzle.context.paddingX - (this.x==0?svgWidth/5 - 10:0) + (this.x == Puzzle.canvasSrc.width - this.width ? svgWidth/5 - 20:0) - this.shadowMargin.left),
		y : Math.round(svgHeight/2+ Puzzle.context.paddingY - (this.y==0?svgHeight/5 - 10:0)+ (this.y == Puzzle.canvasSrc.height- this.height? svgHeight/5- 20:0) - this.shadowMargin.top)
	}*/
	
	// Building the piece DOM tree by cloning the referenced tree.
	this.mainNode = document.getElementById('reference').cloneNode(true);
	with(this.mainNode){
		// ID attribut must be removed to avoid ID conflict
		removeAttribute('id');
		setAttribute('width',  svgWidth);
		setAttribute('height', svgHeight);
		setAttribute('x', this.x);
		setAttribute('y', this.y);
		style.top  = this.y + "px";
		style.left = this.x + "px";
		// The first defs element should be removed some ID conflict and because it's unnecessary to keep it
		removeChild(getElementsByTagName('defs')[0]);
	}
	
	// Building the custom path of the piece
	var path = this.mainNode.getElementsByTagName('path')[0];
	with(path){
		setAttribute('id', 'p'+this.position.line+'_'+this.position.column);
		setAttribute('d', this.buildD());
	}
	
	// Handeling the 'use' element
	var use = this.mainNode.getElementsByTagName('use')
	var lp = use.length;
	for( var i = 0; i < lp; i++){
		// The use of the XLINK namespace is required
		// The HTML 5 Parser allow to use an alternative coding: use[i].setAttribute('xlink:href', '#p'+this.position.line+'_'+this.position.column);
		use[i].setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#p'+this.position.line+'_'+this.position.column);
	}
	
	// Defining the clipPath ID
	var clipPath = this.mainNode.getElementsByTagName('clipPath')[0];
	with(clipPath){
		setAttribute('id', 'c'+this.position.line+'_'+this.position.column);
	}
	
	// Defining the drawing zone
	var canvas = this.mainNode.getElementsByTagName('canvas')[0];
	with(canvas){
		width  = this.width;
		height = this.height;
	}
	
	var foreignObject = this.mainNode.getElementsByTagName('foreignObject')[0];
	with(foreignObject){
		setAttribute('x', this.shadowMargin.left);
		setAttribute('y', this.shadowMargin.top);
		setAttribute('width',  this.width);
		setAttribute('height', this.height);
	}
	
	// Setting the use of the clipPath
	var g = this.mainNode.getElementsByTagName('g')[1];
	with(g){
		setAttribute('clip-path', 'url(#c'+this.position.line+'_'+this.position.column+')');
	}

	// Creating the piece's canvas context
	this.ctx = canvas.getContext('2d');
	
	// Appending the piece's main node to the main document DOM tree
	document.getElementById('zone').appendChild(this.mainNode);
}

// Handeling pieces' move
document.addEventListener('mousemove', function(e) {
	var node  = document.getElementById('drag');
	
	// If there is a node with the ID "drag", this node will follow the mouse
	if(node){
		var p = Puzzle.pieces[node.piece];
		
		var posX = e.pageX - p.mouse.x
		var posY = e.pageY - p.mouse.y
		
		var snapX = p.x - posX;
		var snapY = p.y - posY;
		
		// Handeling the "magnet" effet of the piece's original position. 12px is an arbitrary value but... well... it works!
		if((-12 < snapX && snapX < 12 ) && (snapY < 12 && snapY > -12)){
			posX = p.x;
			posY = p.y;
		}
		
		p.setPosition(posX, posY);
	}
}, false);

// Static definition for the necessary marging required to display drop shadows properly
Piece.prototype.shadowMargin = {
	top    : 10,
	left   : 10,
	bottom : 20,
	right  : 20
}

/**
 * Method that build the value of the SVG path for the piece
 * 
 * @return STRING
 */
Piece.prototype.buildD = function() {
	// Shape starting point relative to the top left corner of the svg element
	var dx = this.shadowMargin.left+ (this.x == 0 ? 0 : this.margin.width);
	var dy = this.shadowMargin.top + (this.y == 0 ? 0 : this.margin.height);
	
	// Variable to change treatement on odd or even columns and lines
	var pc2 = this.position.column%2 != 0;
	var pr2 = this.position.line%2 != 0;
	
	// Defining the size of the output and input part of the piece
	var h = this.basicSize.width / 4;
	var v = this.basicSize.height/ 4;
	var r = h;
	
	// It's the smallest radius of any vertical or horizontal part that will be used for both
	if (h > v) {
		r = v;
		h += h - r;
	} else if (v > h) {
		r = h;
		v += v - r;
	}
	
	// half of the pieces are 1 pixel wider than expected to avoid some aliasing and Math rounded issues
	var h0 = (pr2?0:1);
	var h1 = (pr2?1:0);
	var v0 = (pc2?0:1);
	var v1 = (pc2?1:0);
	
	// The pieces on the last columns and lines can be smaller so, here we count how much smaller they will be to adjust their shape.
	var modH = (this.position.column == this.position.nbrColumns) ? this.basicSize.width  + this.margin.width  - this.width  : 0;
	var modV = (this.position.line == this.position.nbrLines) ? this.basicSize.height + this.margin.height - this.height : 0;
	
	// Shape building	
	// With SVG : M move the starting point of the shape
	//          : v draw a vertical line
	//          : h draw an horizontal line
	//          : a draw an elliptical arc
	
	// starting the shape
	var d = 'M'+dx+' '+dy+' ';
	
	// drawing the top part of the shape
	if (this.position.line == 1) d += 'h' + (this.basicSize.width - modH) + ' ';
	else if (this.position.column%2 == 0) {
		d += 'h' + (h + h1)
		  + ' a' + (r - h1*2) + ',' + (r - h1*2) + ' 0 1,' + h0 + ' '+ (r*2 - h1*2) + ',0'
		  + ' h' + (h + h1 - modH) + ' ';
	}else{
		d += 'h' + (h + h0)
		  + ' a' + (r - h0*2) + ',' + (r - h0*2) + ' 0 1,' + h1 + ' ' + (r*2 - h0*2) + ',0'
		  + ' h' + (h + h0 - modH) + ' ';
	}
	
	// drawing the right part of the shape
	if(this.position.column == this.position.nbrColumns) d += 'v' + (this.basicSize.height - modV) + ' ';
	else if (this.position.line%2 == 0) {
		d += 'v' + (v + v0)
		  + ' a' + (r - v0*2) + ',' + (r - v0*2) + ' 0 1,' + v1 + ' 0,' + (r*2 - v0*2)
		  + ' v' + (v + v0 - modV) + ' ';
	} else {
		d += 'v' + (v + v1)
		  + ' a' + (r - v1*2) + ',' + (r - v1*2) + ' 0 1,' + v0 + ' 0,' + (r*2 - v1*2)
		  + ' v' + (v + v1 - modV) + ' ';
	}
	
	// drawing the bottom part of the shape
	if (this.position.line == this.position.nbrLines) d += 'h-' + (this.basicSize.width - modH) + ' ';
	else if (this.position.column%2 == 0) {
		d += 'h-' + (h + h1 - modH)
		  + ' a'  + (r - h1*2) + ',' + (r - h1*2) + ' 0 1,' + h0 + ' -' + (r*2 - h1*2) + ',0'
		  + ' h-' + (h + h1) + ' ';
	} else {
		d += 'h-' + (h + h0 - modH)
		  + ' a'  + (r - h0*2) + ',' + (r - h0*2) + ' 0 1,' + h1 + ' -' + (r*2 - h0*2) + ',0'
		  + ' h-' + (h + h0) + ' ';
	}
	
	// drawing the left part of the shape
	if (this.position.column == 1) d += 'Z';
	else if (this.position.line%2 == 0) {
		d += 'v-' + (v + v0 - modV)
		  + ' a'  + (r - v0*2) + ',' + (r - v0*2) + ' 0 1,' + v1 + ' 0,-' + (r*2-v0*2)
		  + ' Z';
	} else {
		d += 'v-' + (v + v1 - modV)
		  + ' a'  + (r - v1*2) + ',' + (r - v1*2) + ' 0 1,' + v0 + ' 0,-' + (r*2-v1*2)
		  + ' Z';
	}
	
	return d;
}

/**
 * Method that will draw a graphic source inside the piece's canvas element
 *
 * @param src CanvasElement
 */
Piece.prototype.drawSrc = function(src) {
	this.ctx.clearRect(0, 0, this.width, this.height);
	this.ctx.drawImage(src, this.x, this.y, this.width, this.height, 0, 0, this.width, this.height)
}

/**
 * Method that define the postion of the piece in pixel, relative to the puzzle main area
 *
 * @param x INT x position of the top left corner of the piece in pixel
 * @param y INT y position of the top left corner of the piece in pixel
 */
Piece.prototype.setPosition = function(x, y) {
	if(x == undefined) x = this.x;
	if(y == undefined) y = this.y;
	
	this.mainNode.style.top  = (y - this.shadowMargin.top) + 'px';
	this.mainNode.style.left = (x - this.shadowMargin.left) + 'px';
}

/**
 * Method that check and mark the piece when its current position fit its original position
 */
Piece.prototype.setLock = function(forceLock){
	var x = parseInt(this.mainNode.style.left) + this.shadowMargin.left;
	var y = parseInt(this.mainNode.style.top) + this.shadowMargin.top;
	var classe = 'piece';
	
	if(forceLock == true || (this.x == x && this.y == y && forceLock != false)){
		classe += ' lock';
	}
	
	if(Puzzle.context.allowFilter){
		classe += ' shadow';
	}
	
	this.mainNode.setAttribute('class', classe);
}

// Document is loaded, we can start
document.addEventListener("DOMContentLoaded", function(event) {
    window.addEventListener("load", function(e) {
        var s = 'http://localhost/freelance/jigsaw/new/frankred.jpg';
        var w = 8;
        var h = 4;
        var r = 1;
    
        if(isNaN(r) && (r < 0 || r > 2)) r = 0;
        
        Puzzle.Init(s, w, h, r);
  }, false);
});