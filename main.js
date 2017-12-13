/*eslint-env node, es6*/
/*eslint no-console:1*/

/* Module Description */

/* Put dependencies here */
const canvas = require('canvas-wrapper');
const asyncLib = require('async');

module.exports = (course, stepCallback) => {
    course.addModuleReport('module-publish-settings');

    function getManifestItems(callback) {
        var manifest = course.content.find(file => file.name === 'imsmanifest.xml');
        var toUnpublish = [];
        manifest.dom('[isvisible="False"] > title').each(function (i, ele) {
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
                        course.success('module-publish-settings', `Module: ${module.name} was successfully unpublished`);
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
                    if (toUnpublish.includes(item.title) || /(general)?\s*lesson\s*notes/i.test(item.title)) {
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
                                course.success('module-publish-settings', `Module Item: ${item.title} was successfully unpublished`);
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
        ], (err, results) => {
            if (err) course.throwErr('module-publish-settings', err);
            else {
                console.log('complete');
                stepCallback(null, course);
            }
        });
    }, 10000);
};
