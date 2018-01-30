/*eslint-env node, es6*/

/* Module Description */

/* Put dependencies here */
const canvas = require('canvas-wrapper');
const asyncLib = require('async');

module.exports = (course, stepCallback) => {

    function getManifestItems(callback) {
        var manifest = course.content.find(file => file.name === 'imsmanifest.xml');
        var toUnpublish = [];
        manifest.dom('[isvisible="False"] > title').each(function (i) {
            toUnpublish.push(manifest.dom(this).text());
        });
        callback(null, toUnpublish);
    }

    function getCanvasModules(toUnpublish, callback) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules`, (err, modules) => {
            callback(err, toUnpublish, modules);
        });
    }

    function unpublishModules(toUnpublish, modules, callback) {
        asyncLib.eachSeries(modules, (module, moduleCb) => {
            if (toUnpublish.includes(module.name)) {
                /* Unpublish the module */
                canvas.put(
                    `/api/v1/courses/${course.info.canvasOU}/modules/${module.id}`, {
                        'module[published]': false
                    },
                    (err, res) => {
                        if (err) {
                            moduleCb(err);
                            return;
                        }
                        course.log('Modules set to unpublished', {
                            'Module Name': module.name
                        });
                        moduleCb(null);
                    }
                );
            } else {
                moduleCb(null);
            }
        }, (moduleErr) => {
            if (moduleErr) {
                callback(moduleErr);
            } else {
                callback(null, toUnpublish, modules);
            }
        });
    }

    function unpublishModuleItems(toUnpublish, modules, callback) {
        /* For each module */
        asyncLib.eachSeries(modules, (module, moduleCb) => {
            /* Get the module's items */
            canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${module.id}/items`, (moduleErr,
                moduleItems) => {
                if (moduleErr) moduleCb(moduleErr);
                /* For each module item */
                asyncLib.eachSeries(moduleItems, (item, itemsCb) => {
                    /* If it is marked for unpublishing */
                    if (toUnpublish.includes(item.title) || /(general)?\s*lesson\s*\d{0,2}\s*notes/i.test(item.title)) {
                        /* Unpublish the module item */
                        canvas.put(
                            `/api/v1/courses/${course.info.canvasOU}/modules/${module.id}/items/${item.id}`, {
                                'module_item[published]': false
                            },
                            (err, res) => {
                                if (err) {
                                    itemsCb(err);
                                    return;
                                }
                                course.log('Unpublished Module Items', {
                                    'Item Title': item.title
                                });
                                itemsCb(null);
                            }
                        );
                    } else if (item.type == 'ExternalUrl') {
                        /* If it is an external link, and it isn't something marked to be unpublished, then publish it */
                        /* Canvas unpublishes external links when importing, for some reason */
                        canvas.put(
                            `/api/v1/courses/${course.info.canvasOU}/modules/${module.id}/items/${item.id}`, {
                                'module_item[published]': true
                            },
                            (err, res) => {
                                if (err) {
                                    itemsCb(err);
                                    return;
                                }
                                course.log('Unpublished Module Items', {
                                    'Item Title': item.title
                                });
                                itemsCb(null);
                            }
                        );
                    } else {
                        itemsCb(null);
                    }
                }, itemsErr => {
                    if (itemsErr) {
                        moduleCb(itemsErr);
                        return;
                    }
                    moduleCb(null);
                });
            });
        }, (err, results) => {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    }

    setTimeout(() => {
        asyncLib.waterfall([
            getManifestItems,
            getCanvasModules,
            unpublishModules,
            unpublishModuleItems
        ], (err) => {
            if (err) course.error(err);
            else {
                stepCallback(null, course);
            }
        });
    }, 10000);
};