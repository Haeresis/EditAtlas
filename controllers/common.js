var website = {};

// Loading modules for this website.
(function (publics) {
	"use strict";

	var privates = {};

	publics.loadModules = function (NA) {
		var modulePath = (NA.webconfig._needModulePath) ? NA.nodeModulesPath : '';
		
		NA.modules.fs = require('fs');
		NA.modules.socketio = require(modulePath + 'socket.io');
		NA.modules.cookie = require(modulePath + 'cookie');

		NA.modules.ejs = privates.setFilters(NA.modules.ejs, NA);

		return NA;
	};

	privates.setFilters = function (templateEngine, NA) {
		templateEngine.filters.et = templateEngine.filters.editText = function (obj, arr) {
			var markup = "span",
        		file,
        		claimSource = " ";

        	if (typeof obj === 'string') {
	        	if (arr[0].split(".")[0] === "specific") {
	        		file = arr[1];
	        	} else {
	        		file = NA.webconfig.commonVariation;
	        	}
        	} else {
        		file = arr[1];
        		obj = publics.getLookup(obj, arr[0]);
        		if (file === NA.webconfig.commonVariation) {
        			arr[0] = 'common.' + arr[0];
        		} else {
        			arr[0] = 'specific.' + arr[0];
        		}
        	}

        	if (!obj) { obj = " "; }

        	//if (arr[2]) { markup = "div"; }
        	
        	if (arr[2]) {
    			claimSource = ' data-edit-source="' + arr[2] + '" ';
        	}

            if (arr[1]) {
                return '<' + markup + claimSource + 'data-edit="true" data-edit-type="text" data-edit-file="' + file + '" data-edit-path="' + arr[0] + '">' +  obj + "</" + markup + ">";
            } else {
                return '<' + markup + ' data-edit-path="' + arr[0] + '">' +  obj + "</" + markup + ">";
            }
        };

        templateEngine.filters.eh = templateEngine.filters.editHtml = function (obj, arr) {
        	var markup = "div",
        		file,
        		claimSource = " ";

        	if (typeof obj === 'string') {
	        	if (arr[0].split(".")[0] === "specific") {
	        		file = arr[1];
	        	} else {
	        		file = NA.webconfig.commonVariation;
	        	}
        	} else {
        		file = arr[1];
        		obj = publics.getLookup(obj, arr[0]);
        		if (file === NA.webconfig.commonVariation) {
        			arr[0] = 'common.' + arr[0];
        		} else {
        			arr[0] = 'specific.' + arr[0];
        		}
        	}

        	if (!obj) { obj = " "; }

        	//if (arr[2]) { markup = "span"; }

        	if (arr[2]) {
    			claimSource = ' data-edit-source="' + arr[2] + '" ';
        	}

            if (arr[1]) {
                return '<' + markup + claimSource  + ' data-edit="true" data-edit-type="html" data-edit-file="' + file + '" data-edit-path="' + arr[0] + '">' +  obj + "</" + markup + ">";
            } else {
                return '<' + markup + ' data-edit-path="' + arr[0] + '">' +  obj + "</" + markup + ">";
            }
        };

        templateEngine.filters.ea = templateEngine.filters.editAttr = function (obj, arr) {
        	var file,
        		claimSource = " ";

        	if (typeof obj === 'string') {
	        	if (arr[0].split(".")[0] === "specific") {
	        		file = arr[1];
	        	} else {
	        		file = NA.webconfig.commonVariation;
	        	}
        	} else {
        		file = arr[1];
        		obj = publics.getLookup(obj, arr[0]);
        		if (file === NA.webconfig.commonVariation) {
        			arr[0] = 'common.' + arr[0];
        		} else {
        			arr[0] = 'specific.' + arr[0];
        		}
        	}

        	if (!obj) { obj = " "; }

        	if (arr[3]) {
    			claimSource = ' data-edit-attr-source-' + arr[2] + '="' + arr[3] + '" ';
        	}

            if (arr[1]) {
                return obj + '" data-edit="true"' + claimSource + 'data-edit-attr="true" data-edit-attr-name-' + arr[2] + '="true" data-edit-attr-path-' + arr[2] + '="' + arr[0] + '" data-edit-attr-file-' + arr[2] + '="' + file;
            } else {
                return obj + '" data-edit-attr-path-' + arr[2] + '="' + arr[0];
            }
        };

		return templateEngine;
	};

}(website));



// Asynchrone
(function (publics) {
	"use strict";

	var privates = {};

	privates.setLookup = function (obj, key, val) {
		var fields,
			type = typeof key,
			result = obj;

		if (type == 'string' || type == "number") {
			fields = ("" + key).replace(/\[(.*?)\]/, function (m, key) {
				return '.' + key;
			}).split('.');
		}

	  	for (var i = 0, n = fields.length; i < n && result !== undefined; i++) {
	    	var field = fields[i];

	    	if (i === n - 1) {
  				result[field] = val;
	    	} else {
	      		if (typeof result[field] === 'undefined' || !((typeof result[field] == "object") && (result[field] !== null))) {
	        		result[field] = {};
	      		}
	      		result = result[field];
	    	}
	  	}
	};

	publics.getLookup = function (obj, key) {
		var type = typeof key;

		if (type == 'string' || type == "number") {
			key = ("" + key).replace(/\[(.*?)\]/, function (m, key) {
				return '.' + key;
			}).split('.');
		}
		for (var i = 0, l = key.length, currentkey; i < l; i++) {
		 	if (obj.hasOwnProperty(key[i])) {
		 		obj = obj[key[i]];
		 	} else { 
		 		return undefined;
	 		}
		}

		return obj;
	};

	privates.orderByFile = function (options) {
		var files = {},
			next;

		for (var i = 0, l = options.length; i < l; i++) {
			next = false;
			for (var file in files) {
				if (file === options[i].file) {
					files[options[i].file].push(options[i]);
					next = true;
				}
			}
			if (!next) {
				files[options[i].file] = [];
				files[options[i].file].push(options[i]);
			}
		}

		return files;
	};

	publics.asynchrone = function (params) {
		var io = params.io,
			NA = params.NA,
			fs = NA.modules.fs;

		io.sockets.on('connection', function (socket) {

			socket.on('update-variation', function (options) {
				var files, object, key;

				files = privates.orderByFile(options);
				
				for (var file in files) {
					try {
						object = require(NA.websitePhysicalPath + NA.webconfig.variationsRelativePath + file);
						if (object) {
							for (var i = 0, l = files[file].length; i < l; i++) {
								key = files[file][i].path.split('.').slice(1).join('.');

								if (publics.getLookup(object, key) || publics.getLookup(object, key) === "") {
									privates.setLookup(object, key, files[file][i].value);

									if (!files[file][i].source || typeof files[file][i].source === 'string') {
										socket.broadcast.emit('update-variation', {
											path: files[file][i].path,
											value: files[file][i].value,
											source: files[file][i].source,
											type: files[file][i].type,
											attrName: files[file][i].attrName
										});
									}
								}
							}
						}
						if (!NA.webconfig._demo) { // Adding part for avoid recording for demo mode.
							fs.writeFileSync(NA.websitePhysicalPath + NA.webconfig.variationsRelativePath + file, JSON.stringify(object, undefined, "    "));
						}
					} catch (exception) {
						console.log(exception);
					}
				}	
			});

			socket.on('source-variation', function (options) {
				var object, key;

				try {
					object = require(NA.websitePhysicalPath + NA.webconfig.variationsRelativePath + options.file);
					if (object) {
						key = options.path.split('.').slice(1).join('.');

						socket.emit('source-variation', {
							value: publics.getLookup(object, key),
							path: options.path
						});
					}
				} catch (exception) {
					console.log(exception);
				}
			});

		});
	};

}(website));



// Set configuration for this website.
(function (publics) {
	"use strict";

	var privates = {};

	publics.setConfigurations = function (NA, callback) {
		var mongoose = NA.modules.mongoose,
			socketio = NA.modules.socketio,
			connect = NA.modules.connect;

		privates.socketIoInitialisation(socketio, NA, function (io) {

			privates.socketIoEvents(io, NA);

			callback(NA);					
		});

	};			

	privates.socketIoInitialisation = function (socketio, NA, callback) {
		var optionIo = (NA.webconfig.urlRelativeSubPath) ? { resource: NA.webconfig.urlRelativeSubPath + '/socket.io' } : undefined,
			io = socketio.listen(NA.server, optionIo),
			connect = NA.modules.connect,
			cookie = NA.modules.cookie;

		io.enable('browser client minification');
		if (NA.webconfig._ioGzip) {
			io.enable('browser client gzip');
		}
		io.set('log level', 1);
		io.enable('browser client cache');
		io.set('browser client expires', 86400000 * 30);
		io.enable('browser client etag');
		io.set('authorization', function (data, accept) {

            // No cookie enable.
            if (!data.headers.cookie) {
                return accept('Session cookie required.', false);
            }

            // First parse the cookies into a half-formed object.
            data.cookie = cookie.parse(data.headers.cookie);

            // Next, verify the signature of the session cookie.
            data.cookie = connect.utils.parseSignedCookies(data.cookie, NA.webconfig.session.secret);
             
            // save ourselves a copy of the sessionID.
            data.sessionID = data.cookie[NA.webconfig.session.key];

			// Accept cookie.
            NA.sessionStore.load(data.sessionID, function (error, session) {
                if (error || !session) {
                    accept("Error", false);
                } else {
                    data.session = session;
                    accept(null, true);
                }
            });

        });

    	callback(io);		
	};

	privates.socketIoEvents = function (io, NA) {
		var params = {};

		params.io = io;
		params.NA = NA;

		website.asynchrone(params);
	};

}(website));

// PreRender
(function (publics) {
	"use strict";

	publics.preRender = function (params, mainCallback) {
		var variation = params.variation;

		variation.file = variation.pageParameters.variation;
		variation.fs = variation.pageParameters.variation;
		variation.fc = variation.webconfig.commonVariation;

		mainCallback(variation);
	};

}(website));

exports.preRender = website.preRender;
exports.loadModules = website.loadModules;
exports.setConfigurations = website.setConfigurations;