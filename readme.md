# Module Publish Settings
### *Package Name*: module-publish-settings
### *Child Type*: Post import
### *Platform*: All
### *Required*: Required

This child module is built to be used by the Brigham Young University - Idaho D2L to Canvas Conversion Tool. It utilizes the standard `module.exports => (course, stepCallback)` signature and uses the Conversion Tool's standard logging functions. You can view extended documentation [Here](https://github.com/byuitechops/d2l-to-canvas-conversion-tool/tree/master/documentation).

## Purpose
Module items which were drafts in D2L are published by canvas. This child module unpublishes items which were drafts in D2L. 
It also unpublishes all Lesson Notes in the course and publishes any external links in the module items, since Canvas defaults external links to unpublished on import.

## How to Install

```
npm install module-publish-settings
```

## Run Requirements
This child module requires the following fields in the course.info object:
* `canvasOU`

This child module uses course.contents to know which items were drafts in D2L.

## Options
None

## Outputs
None

## Process
1. Get manifest items
2. GET modules from canvas
3. unpublish appropriate modules
4. unpublish appropriate module items

## Log Categories
Categories used in logging data in this module:
- Unpublished Module Items
- Modules set to unpublished

## Requirements
Ensure D2L draft items are unpublished in teh corresponding Canvas course.