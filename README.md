# jQuery Menu Editor
# See the [DEMO](http://codeignitertutoriales.com/demos/jqmenueditor/)
# Features
* Add, Update & Remove items from Menu
* Multilevel Drag & Drop
* Form Item Editor
* Include IconPicker Plugin (https://victor-valencia.github.com/bootstrap-iconpicker)
* Load data from JSON string 
* The output is a Json string

This project was inspirated and based in jQuery-Sortable-lists http://camohub.github.io/jquery-sortable-lists/index.html and added many features.

### The Form item editor
![menu-multilevel](http://codeignitertutoriales.com/wp-content/uploads/2017/01/jquery-menu-editor-form.jpg)
### The Multilevel Drag & Drop
![multilevel-menu](http://codeignitertutoriales.com/wp-content/uploads/2017/01/jquery-menu-editor-dragdrop.jpg)

# Documentation

## Requirements
* Bootstrap 3.x
* jQuery
* Bootstrap IconPicker 1.7
* Fontawesome (or another iconset)

## How to use
### Include the Css and scripts
```html
<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css">
<link rel="stylesheet" href="bs-iconpicker/css/bootstrap-iconpicker.min.css">

<script src='https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js'></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
<script src='jquery-menu-editor.js'></script>
<script src='bs-iconpicker/js/iconset/iconset-fontawesome-4.2.0.min.js'></script>
<script src='bs-iconpicker/js/bootstrap-iconpicker.js'></script>
```

### Creating the Drag & Drop list
```html
<div class="panel-body" id="cont">
    <ul id="myList" class="sortableLists list-group">
    </ul>
</div>
```
### Creating the form
Is important to preserve the prefix 'mnu_' at the input elements
```html
<form id="frmEdit" class="form-horizontal">
    <input type="hidden" name="mnu_icon" id="mnu_icon">
    <div class="form-group">
        <label for="mnu_text" class="col-sm-2 control-label">Text</label>
        <div class="col-sm-10">
            <div class="input-group">
                <input type="text" class="form-control" id="mnu_text" name="mnu_text" placeholder="Text">
                <div class="input-group-btn">
                    <button id="mnu_iconpicker" class="btn btn-default" data-iconset="fontawesome" data-icon="" type="button"></button>
                </div>
            </div>
        </div>
    </div>
    <div class="form-group">
        <label for="mnu_href" class="col-sm-2 control-label">URL</label>
        <div class="col-sm-10">
            <input type="text" class="form-control" id="mnu_href" name="mnu_href" placeholder="URL">
        </div>
    </div>
    <div class="form-group">
        <label for="mnu_target" class="col-sm-2 control-label">Target</label>
        <div class="col-sm-10">
            <select id="mnu_target" name="mnu_target" class="form-control">
                <option value="_self">Self</option>
                <option value="_blank">Blank</option>
                <option value="_top">Top</option>
            </select>
        </div>
    </div>
    <div class="form-group">
        <label for="mnu_title" class="col-sm-2 control-label">Tooltip</label>
        <div class="col-sm-10">
            <input type="text" class="form-control" id="mnu_title" name="mnu_title" placeholder="Text">
        </div>
    </div>
</form>
```

### Create and Setting the MenuEditor object
```javascript
var iconPickerOpt = {cols: 5, searchText: "Buscar...", labelHeader: '{0} de {1} Pags.', footer: false};
var options = {
    hintCss: {'border': '1px dashed #13981D'},
    placeholderCss: {'background-color': 'gray'},
    ignoreClass: 'btn',
    opener: {
        active: true,
        as: 'html',
        close: '<i class="fa fa-minus"></i>',
        open: '<i class="fa fa-plus"></i>',
        openerCss: {'margin-right': '10px'},
        openerClass: 'btn btn-success btn-xs'
    }
};
var editor = new MenuEditor('myList', {listOptions: options, iconPicker: iconPickerOpt, labelEdit: 'Edit', labelRemove: 'Remove'});
```

### Load data from a Json string
We have the method setData:
```javascript
var strjson = '[{"href":"http://home.com","icon":"fa fa-home","text":"Home"},{"icon":"fa fa-bar-chart-o","text":"Opcion2"},{"icon":"fa fa-cloud-upload","text":"Opcion3"},{"icon":"fa fa-crop","text":"Opcion4"},{"icon":"fa fa-flask","text":"Opcion5"},{"icon":"fa fa-search","text":"Opcion7","children":[{"icon":"fa fa-plug","text":"Opcion7-1","children":[{"icon":"fa fa-filter","text":"Opcion7-2","children":[{"icon":"fa fa-map-marker","text":"Opcion6"}]}]}]}]';
editor.setData(strjson);
```
### Output
We have the function getString
```javascript
var str = editor.getString();
$("#yourTextarea").text(str);
```

## En español: http://codeignitertutoriales.com/jquery-menu-editor-multinivel/
*El tutorial en español corresponde a la primera versión. Proximamente actualizo el tutorial.
