# jQuery Menu Editor 1.1.0
# >>> [DEMO](https://davicotico.github.io/jQuery-Menu-Editor/)
### Features
* Add, Update & Remove items from Menu
* Multilevel Drag & Drop
* Form Item Editor
* Include IconPicker Plugin (https://victor-valencia.github.com/bootstrap-iconpicker)
* Support to mobile devices
* Load data from JSON string 
* The output is a Json string

This project is based on jQuery-Sortable-lists (v1.4.0) http://camohub.github.io/jquery-sortable-lists/index.html and added many features.

# Documentation

## Requirements
* Bootstrap 4.x
* jQuery >= 3.x
* Fontawesome 5.3.1
* Bootstrap Iconpicker 1.10.0

## How to use
### Include the Css and scripts
```html
<!-- the css in the <head> -->
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"/>
<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css"/>
<link rel="stylesheet" href="bootstrap-iconpicker/css/bootstrap-iconpicker.min.css">

<!-- (Recommended) Just before the closing body tag </body> -->
<script type="text/javascript" src='https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js'></script>
<script type="text/javascript" src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.bundle.min.js"></script>
<script type="text/javascript" src="bootstrap-iconpicker/js/iconset/fontawesome5-3-1.min.js"></script>
<script type="text/javascript" src="bootstrap-iconpicker/js/bootstrap-iconpicker.min.js"></script>
<script type="text/javascript" src="jquery-menu-editor.min.js"></script>
```

### Creating the Drag & Drop list
```html
<ul id="myEditor" class="sortableLists list-group">
</ul>
```
### Creating the form
* The inputs for items should be have the class="item-menu"
* The icon picker should be have the id=[LIST_ID]+"_icon"
```html
<div class="card border-primary mb-3">
    <div class="card-header bg-primary text-white">Edit item</div>
        <div class="card-body">
        <form id="frmEdit" class="form-horizontal">
        <div class="form-group">
        <label for="text">Text</label>
        <div class="input-group">
        <input type="text" class="form-control item-menu" name="text" id="text" placeholder="Text">
        <div class="input-group-append">
        <button type="button" id="myEditor_icon" class="btn btn-outline-secondary"></button>
        </div>
        </div>
        <input type="hidden" name="icon" class="item-menu">
        </div>
        <div class="form-group">
        <label for="href">URL</label>
        <input type="text" class="form-control item-menu" id="href" name="href" placeholder="URL">
        </div>
        <div class="form-group">
        <label for="target">Target</label>
        <select name="target" id="target" class="form-control item-menu">
        <option value="_self">Self</option>
        <option value="_blank">Blank</option>
        <option value="_top">Top</option>
        </select>
        </div>
        <div class="form-group">
        <label for="title">Tooltip</label>
        <input type="text" name="title" class="form-control item-menu" id="title" placeholder="Tooltip">
        </div>
        </form>
        </div>
    <div class="card-footer">
        <button type="button" id="btnUpdate" class="btn btn-primary" disabled><i class="fas fa-sync-alt"></i> Update</button>
        <button type="button" id="btnAdd" class="btn btn-success"><i class="fas fa-plus"></i> Add</button>
    </div>
</div>
```

### Create and Setting the MenuEditor object
```javascript
// icon picker options
var iconPickerOptions = {searchText: "Buscar...", labelHeader: "{0}/{1}"};
// sortable list options
var sortableListOptions = {
    placeholderCss: {'background-color': "#cccccc"}
};
var editor = new MenuEditor('myEditor', 
            { 
            listOptions: sortableListOptions, 
            iconPicker: iconPickerOptions,
            maxLevel: 2 // (Optional) Default is -1 (no level limit)
            // Valid levels are from [0, 1, 2, 3,...N]
            });
editor.setForm($('#frmEdit'));
editor.setUpdateButton($('#btnUpdate'));
//Calling the update method
$("#btnUpdate").click(function(){
    editor.update();
});
// Calling the add method
$('#btnAdd').click(function(){
    editor.add();
});
```

### Load data from a Json
We have the method setData:
```javascript
var arrayjson = [{"href":"http://home.com","icon":"fas fa-home","text":"Home", "target": "_top", "title": "My Home"},{"icon":"fas fa-chart-bar","text":"Opcion2"},{"icon":"fas fa-bell","text":"Opcion3"},{"icon":"fas fa-crop","text":"Opcion4"},{"icon":"fas fa-flask","text":"Opcion5"},{"icon":"fas fa-map-marker","text":"Opcion6"},{"icon":"fas fa-search","text":"Opcion7","children":[{"icon":"fas fa-plug","text":"Opcion7-1","children":[{"icon":"fas fa-filter","text":"Opcion7-1-1"}]}]}];
editor.setData(arrayJson);
```
### Output
We have the function getString
```javascript
var str = editor.getString();
$("#myTextarea").text(str);
```
