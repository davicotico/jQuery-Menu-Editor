# jQuery Menu Editor
# >>> [DEMO](http://codeignitertutoriales.com/demos/jqmenueditor/)
### Features
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
* jQuery >= 1.10.2
* Fontawesome (or another iconset)

## How to use
### Include the Css and scripts
```html
<!-- the css in the <head> -->
<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css">
<link rel="stylesheet" href="bs-iconpicker/css/bootstrap-iconpicker.min.css">

<!-- (Recommended) Just before the closing body tag </body> -->
<script src='https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js'></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
<script src='bs-iconpicker/js/iconset/iconset-fontawesome-4.2.0.min.js'></script>
<script src='bs-iconpicker/js/bootstrap-iconpicker.js'></script>
<script src='jquery-menu-editor.min.js'></script> //is just 16KB !!!
```

### Creating the Drag & Drop list
```html
<div class="panel-body" id="cont">
    <ul id="myEditor" class="sortableLists list-group">
    </ul>
</div>
```
### Creating the form
* The inputs for items should be have the class="item-menu"
* The icon picker should be have the id=[LIST_ID]+"_icon"
```html
<form id="frmEdit" class="form-horizontal">
    <div class="form-group">
        <label for="text" class="col-sm-2 control-label">Text</label>
        <div class="col-sm-10">
            <div class="input-group">
                <input type="text" class="form-control item-menu" id="text" name="text" placeholder="Text">
                <div class="input-group-btn">
                    <button id="myEditor_icon" class="btn btn-default" data-iconset="fontawesome" data-icon="" type="button"></button>
                </div>
                <input type="hidden" name="icon" class="item-menu">
            </div>
        </div>
    </div>
    <div class="form-group">
        <label for="mnu_href" class="col-sm-2 control-label">URL</label>
        <div class="col-sm-10">
            <input type="text" class="form-control item-menu" id="href" name="href" placeholder="URL">
        </div>
    </div>
    <div class="form-group">
        <label for="target" class="col-sm-2 control-label">Target</label>
        <div class="col-sm-10">
            <select name="target" id="target" class="form-control item-menu">
                <option value="_self">Self</option>
                <option value="_blank">Blank</option>
                <option value="_top">Top</option>
            </select>
        </div>
    </div>
    <div class="form-group">
        <label for="title" class="col-sm-2 control-label">Tooltip</label>
        <div class="col-sm-10">
            <input type="text" class="form-control item-menu" id="title" name="title" placeholder="Text">
        </div>
    </div>
</form>
```

### Create and Setting the MenuEditor object
```javascript
//icon picker options
var iconPickerOptions = {searchText: 'Buscar...', labelHeader: '{0} de {1} Pags.'};
//sortable list options
var sortableListOptions = {
    placeholderCss: {'background-color': 'cyan'}
};
var editor = new MenuEditor('myEditor', {listOptions: sortableListOptions, iconPicker: iconPickerOptions, labelEdit: 'Edit'});
```

### Load data from a Json
We have the method setData:
```javascript
var arrayJson = [{"href":"http://home.com","icon":"fa fa-home","text":"Home"},{"icon":"fa fa-bar-chart-o","text":"Opcion2"},{"icon":"fa fa-cloud-upload","text":"Opcion3"},{"icon":"fa fa-crop","text":"Opcion4"},{"icon":"fa fa-flask","text":"Opcion5"},{"icon":"fa fa-search","text":"Opcion7","children":[{"icon":"fa fa-plug","text":"Opcion7-1","children":[{"icon":"fa fa-filter","text":"Opcion7-2","children":[{"icon":"fa fa-map-marker","text":"Opcion6"}]}]}]}];
editor.setData(arrayJson);
```
### Output
We have the function getString
```javascript
var str = editor.getString();
$("#myTextarea").text(str);
```

## En español: http://codeignitertutoriales.com/jquery-menu-editor-multinivel/
