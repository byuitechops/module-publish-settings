/*eslint-env node, es6*/

/* Module Description */

/* Put dependencies here */
const canvas = require('canvas-wrapper');
const asyncLib = require('async');

module.exports = (course, stepCallback) => {
	course.addModuleReport('modulePublishSettings');

	// Get the manifest
	var manifest = course.content.find(file => {
		return file.path.includes('imsmanifest.xml');
	});

	// Get all unpublished items
	var unpubs = manifest.dom('[isvisible]>title').map((i, el) => {
		return manifest.dom(el).html();
	}).get();

	console.log('UNPUBS');
	console.log(unpubs);

	// Get the new Canvas Course's Modules
	canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules`, (getModsErr, modules) => {
		if (getModsErr) course.throwErr('modulePublishSettings', getModsErr);
		else {
			// Go through each module, look for items that need to be unpublished
			asyncLib.each(modules, (module, callback) => {
				console.log('MODULE', module.name);
				// Go through this module's items for ones that need to be unpublished
				canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${module.id}/items`, (getItemsErr, items) => {
					if (getItemsErr) course.throwErr('modulePublishSettings', getItemsErr);
					else {
						items.forEach(item => {
							console.log('SEARCHING', item);
							if (unpubs.includes(item.title)) {
								// Update module item to be unpublished
								console.log('FOUND', item.title);
							}
						});
					}
				});

			}, err => {
				if (err) course.throwErr('modulePublishSettings', err);
				else {
					console.log('Done');
					stepCallback(null, course);
				}
			});
		}
	});
};
