/**
 * jQuery Menu Editor
 * @author David Ticona Saravia https://github.com/davicotico
 * @version 1.1.0
 * */
( function( $ )
{

    /**
     * @desc Handles opening nested lists
     * @param setting
     */
    $.fn.iconOpen = function(setting){
        this.removeClass('sortableListsClosed').addClass('sortableListsOpen');
        this.children('ul').css('display', 'block');
        var opener = this.children('div').children('.sortableListsOpener').first();
        if (setting.opener.as === 'html'){
            opener.html(setting.opener.close);
        } else if (setting.opener.as === 'class') {
            opener.addClass(setting.opener.close).removeClass(setting.opener.open);
        }
    };
    /**
     * @desc Handles closing nested lists
     * @param setting
     */
    $.fn.iconClose = function(setting) {
        this.removeClass('sortableListsOpen').addClass('sortableListsClosed');
        this.children('ul').css('display', 'none');
        var opener = this.children('div').children('.sortableListsOpener').first();
        if (setting.opener.as === 'html') {
            opener.html(setting.opener.open);
        } else if (setting.opener.as === 'class') {
            opener.addClass(setting.opener.open).removeClass(setting.opener.close);
        }
    };
    
    /**
     * @author David Ticona Saravia
     * @desc Get the json from html list
     * @return {array} Array
     */
    $.fn.menuEditorToJson = function (){
        var arr = [];
        $(this).children('li').each(function () {
            var $li = $(this);
            // Preserve the original object on data
            var object = $.extend(true, {}, $li.data());
            arr.push(object);
            var ch = $li.children('ul,ol').menuEditorToJson();
            if (ch.length > 0) {
                object.children = ch;
            } else {
                delete object.children;
            }
        });
        return arr;
    };

    /**
     * @desc Get an flattened array version of the data from the html list
     *
     * @return {array} Array
     */
    $.fn.menuEditorToArray = function (arr, parentId){
        arr = arr || [];
        $(this).children('li').each(function () {
            var $li = $(this);
            // Preserve the original object on data
            var object = $.extend(true, {parentId: parentId}, $li.data());
            arr.push(object);
            var ch = $li.children('ul,ol').menuEditorToArray(arr, object.id);
            delete object.children;
        });
        return arr;
    };

    /**
     * Update levels on <ul> data attribute 
     */
    $.fn.updateLevels = function(depth){
        var level = (typeof depth === 'undefined') ? 0 : depth;
        $(this).children('li').each(function () {
            var li = $(this);
            var ch = li.children('ul');
            if (ch.length > 0) {
                ch.data("level", level + 1);
                ch.updateLevels(level + 1);
            }
        });
    };

    /**
     * @description Update the buttons at the nested list (the main <ul>).
     * the buttons are: up, down, item in, item out
     * @param {int} depth 
     */
    $.fn.updateButtons = function (depth){
        var level = (typeof depth === 'undefined') ? 0 : depth;
        var removefirst = ['Up', 'In'];
        var removelast = ['Down'];
        if (level===0){
            removefirst.push('Out');
            removelast.push('Out');
            $(this).children('li').hideButtons(['Out']);
        }
        $(this).children('li').each(function () {
            var $li = $(this);
            var $ul = $li.children('ul');
            if ($ul.length > 0) {
                $ul.updateButtons(level + 1);
            }
        }); 
        $(this).children('li:first').hideButtons(removefirst);
        $(this).children('li:last').hideButtons(removelast);
    };
    /**
     * @description Hide the buttons at the item <li>
     * @param {Array} buttons 
     */
    $.fn.hideButtons = function(buttons){
        for(var i = 0; i<buttons.length; i++){
            $(this).find('.btn-group:first').children(".btn"+buttons[i]).hide();
        }
    };
}(jQuery));
/**
 * @version 1.1.0
 * @author David Ticona Saravia
 * @param {string} idSelector Attr ID
 * @param {object} options Options editor
 * */
function MenuEditor(idSelector, options) {
    var $modal = null;
    var $main = $("#" + idSelector).data("level", "0");
    var settings = {
        labelEdit: '<i class="fas fa-edit clickable"></i>',
        labelRemove: '<i class="fas fa-trash-alt clickable"></i>',
        labelCancelDeletion: 'Cancel',
        labelConfirmDeletion: '<i class="fas fa-trash-alt clickable"></i>&nbsp;Yes, delete it',
        textConfirmDeletion: 'This item will be deleted. Are you sure?',
        useModalConfirmation: false,
        showIcons: true,
        iconPicker: { cols: 4, rows: 4, footer: false, iconset: "fontawesome5" },
        maxLevel: -1,
        listOptions: { 
            hintCss: { border: '1px dashed #13981D'}, 
            opener: {
                as: 'html',
                close: '<i class="fas fa-minus"></i>',
                open: '<i class="fas fa-plus"></i>',
                openerCss: {'margin-right': '10px', 'float': 'none'},
                openerClass: 'btn btn-success btn-sm',
            },
            placeholderCss: {'background-color': 'gray'},
            ignoreClass: 'clickable',
            listsClass: "pl-0",
            listsCss: {"padding-top": "10px"},
            onChange: function(cEl) {
                cEl.toggleClass('pr-0',         cEl.parent().get(0) != $main.get(0));
                cEl.toggleClass('pr-2 pr-sm-3', cEl.parent().get(0) == $main.get(0));
                MenuEditor.updateButtons($main);
                $main.updateLevels(0);
                return true;
            },
            isAllowed: function(currEl, hint, target) {
                return isValidLevel(currEl, target);
            }
        }
    };
    $.extend(true, settings, options);
    var baseIdCounters = {};
    var itemEditing = null;
    var sortableReady = true;
    var $form = null;
    var $updateButton = null;
    var $iconPicker = null;
    var iconPickerOpt = settings.iconPicker;
    var options = settings.listOptions;
    $main.sortableLists(settings.listOptions);

    if (settings.useModalConfirmation) {
        $modal = createModalDialog();
    }

    if (jQuery.fn.iconpicker) {
      $iconPicker = $('#'+idSelector+'_icon').iconpicker(iconPickerOpt);
    }

    // A mutation observer, used to make a tweak in the position of the nested
    // list opener button, which is generated and appended by the sortablelists
    // plugin. Should it ever change this DOM structure, this code will also
    // have to be adjusted.
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var openerWrapperObserver = new MutationObserver(function(mutations) {
      $.each(mutations, function(i, mutation) {
        if (mutation.addedNodes.length == 1) {
          var $target = $(mutation.target);
          var $el = $(mutation.addedNodes);
          if ($el.hasClass('sortableListsOpener') && !$el.is(':first-child')) {
            $target.prepend($el);
          }
        }
      });
    });
    var observerInitSettings = {
      subtree: false,
      attributes: false,
      childList: true
    };

    /* EVENTS */
    if ($iconPicker) {
        $iconPicker.on('change', function (e) {
            $form.find("[name=icon]").val(e.icon);
        });
    }

    $main.on('click', '.btnRemove', function (e) {
        e.preventDefault();
        if (!settings.useModalConfirmation && confirm(settings.textConfirmDeletion)) {
            removeItem($(this));
        }
    });

    $main.on('click', '.btnEdit', function (e) {
        e.preventDefault();
        itemEditing = $(this).closest('li');
        editItem(itemEditing);
    });

    $main.on('click', '.btnUp', function (e) {
        e.preventDefault();
        var $li = $(this).closest('li');
        $li.prev('li').before($li);
        MenuEditor.updateButtons($main);
    });
    $main.on('click', '.btnDown', function (e) {
        e.preventDefault();
        var $li = $(this).closest('li');
        $li.next('li').after($li);
        MenuEditor.updateButtons($main);
    });
    $main.on('click', '.btnOut', function (e) {
        e.preventDefault();
        var list = $(this).closest('ul');
        var $li = $(this).closest('li');
        var $liParent = $li.closest('ul').closest('li');
        var $ul = $liParent.parent();
        $liParent.after($li);
        if (list.children().length <= 0) {
            list.prev('div').children('.sortableListsOpener').first().remove();
            list.remove();
        }
        $li.toggleClass('pr-0',         $ul.get(0) != $main.get(0));
        $li.toggleClass('pr-2 pr-sm-3', $ul.get(0) == $main.get(0));
        MenuEditor.updateButtons($main);
        $main.updateLevels();
    });
    $main.on('click', '.btnIn', function (e) {
        e.preventDefault();
        var $li = $(this).closest('li');
        var $prev = $li.prev('li');
        if (! isValidLevel($li, $prev)) {
            return false;
        }
        if ($prev.length > 0) {
            var $ul = $prev.children('ul');
            if ($ul.length > 0)
                $ul.append($li);
            else {
                var $ul = $('<ul>').addClass('pl-0').css('padding-top', '10px');
                $prev.append($ul);
                $ul.append($li);
                $prev.addClass('sortableListsOpen');
                TOpener($prev);
            }
        }
        $li.toggleClass('pr-0',         $ul.get(0) != $main.get(0));
        $li.toggleClass('pr-2 pr-sm-3', $ul.get(0) == $main.get(0));
        MenuEditor.updateButtons($main);
        $main.updateLevels();
    });

    /* PRIVATE METHODS */
    function removeItem($deleteButton) {
        var $list = $deleteButton.closest('ul');
        $deleteButton.closest('li').remove();
        var isMainContainer = false;
        if (typeof $list.attr('id') !== 'undefined') {
            isMainContainer = ($list.attr('id').toString() === idSelector);
        }
        if ((!$list.children().length) && (!isMainContainer)) {
            $list.prev('div').children('.sortableListsOpener').first().remove();
            $list.remove();
        }
        MenuEditor.updateButtons($main);
    }

    function editItem($item) {
        var data = $item.data();
        $.each(data, function (p, v) {
            $form.find("[name=" + p + "]").val(v);
        });
        $form.find(".item-menu").first().focus();
        if ($iconPicker) {
            $iconPicker.iconpicker('setIcon',
                data.hasOwnProperty('icon') ? data.icon : ''
            );
        }
        $updateButton.removeAttr('disabled');
    }

    function resetForm() {
        $form[0].reset();
        if ($iconPicker) {
            $iconPicker = $iconPicker.iconpicker(iconPickerOpt);
            $iconPicker.iconpicker('setIcon', '');
        }
        $updateButton.attr('disabled', true);
        itemEditing = null;
    }

    function stringToArray(str) {
        try {
            var obj = JSON.parse(str);
        } catch (err) {
            console.log('The string is not a json valid.');
            return null;
        }
        return obj;
    }

    function TButton(attr) {
        return $("<a>").addClass(attr.classCss).addClass('clickable').attr("href", "#").html(attr.text);
    }

    function TButtonGroup() {
        var $divbtn = $('<div>').addClass('btn-group float-right');
        var $btnEdit = TButton({classCss: 'btn btn-primary btn-sm btnEdit', text: settings.labelEdit});
        var $btnRemv = TButton({classCss: 'btn btn-danger btn-sm btnRemove', text: settings.labelRemove});
        if ($modal && settings.useModalConfirmation) {
          // Add the attributes which allow the button to open the modal
          $btnRemv.attr({"data-toggle": "modal", "data-target": "#"+$modal.attr('id')});
        }
        var $btnUp = TButton({classCss: 'btn btn-secondary btn-sm btnUp btnMove', text: '<i class="fas fa-angle-up clickable"></i>'});
        var $btnDown = TButton({classCss: 'btn btn-secondary btn-sm btnDown btnMove', text: '<i class="fas fa-angle-down clickable"></i>'});
        var $btnOut = TButton({classCss: 'btn btn-secondary btn-sm btnOut btnMove', text: '<i class="fas fa-level-down-alt clickable"></i>'});
        var $btnIn = TButton({classCss: 'btn btn-secondary btn-sm btnIn btnMove', text: '<i class="fas fa-level-up-alt clickable"></i>'});
        $divbtn.append($btnUp).append($btnDown).append($btnIn).append($btnOut).append($btnEdit).append($btnRemv);
        return $divbtn;
    }

    function uniqueId(baseId, extraElements) {
      var id;
      var isUnique = !$('#'+baseId).length && !$(extraElements).find('#'+baseId).length;
      if (isUnique) {
        id = baseId;
      } else {
        if (baseIdCounters[baseId] === undefined) {
          baseIdCounters[baseId] = 0;
        }
        do {
          id = baseId + '_' + ++baseIdCounters[baseId];
          isUnique = !$('#'+id).length && !$(extraElements).find('#'+id).length;
        } while (!isUnique);
      }
      return id;
    }

    /**
     * @param {array} arrayItem Object Array
     * @param {int} depth Depth sub-menu
     * @return {object} jQuery Object
     **/
    function createMenu(arrayItem, depth) {
        var level = (typeof (depth) === 'undefined') ? 0 : depth;
        var $elem = (level === 0) ? $main : $('<ul>').addClass('pl-0').css('padding-top', '10px').data("level", level);
        $.each(arrayItem, function (k, v) {
            var hasId = (typeof (v.id) !== "undefined");
            var isParent = (typeof (v.children) !== "undefined") && ($.isArray(v.children));

            // Some properties are mandatory because they are used on the $li
            // element assembly, and should also the stored in it's data
            var itemObject = {text: ""};
            if (settings.showIcons) {
                itemObject.icon = "";
            }
            var temp = $.extend({}, v);
            if (isParent){ 
                delete temp['children'];
            }
            $.extend(itemObject, temp);
            var $li = $('<li>').addClass('list-group-item pl-2 pl-sm-3');
            // Remove right padding from items not on top level,
            // or else their buttons won't align with their parent's
            $li.toggleClass('pr-0',         $elem.get(0) != $main.get(0));
            $li.toggleClass('pr-2 pr-sm-3', $elem.get(0) == $main.get(0));
            $li.data(itemObject);
            var $div = $('<div>').css('overflow', 'auto');
            if (settings.showIcons) {
                var $i = $('<i>').addClass(v.icon);
                $div.append($i).append("&nbsp;");
            }
            var $span = $('<span>').addClass('txt').append(v.text).css('margin-right', '5px');
            var $divbtn =  TButtonGroup();
            $div.append($span).append($divbtn);
            $li.append($div);
            if (isParent) {
                $li.append(createMenu(v.children, level + 1));
            }
            $elem.append($li);

            $div.each(function () {
              openerWrapperObserver.observe(this, observerInitSettings);
            });

            // Setting element id. This has to be done after appending
            // it (and its descendants) in order to check whether its
            // potencial id is already taken.
            if (hasId) {
              // $elem might not yet be appended to DOM
              var id = uniqueId($main.attr('id') + '_li_' + v.id, $elem);
              $li.attr('id', id);
            }

        });
        return $elem;
    }

    /**
     * @return {object} jQuery Object
     **/
    function createModalDialog(){
      var modalId = uniqueId($main.attr('id') + '_modal');
      var titleId = uniqueId($main.attr('id') + '_modal_title');
      var $modal = $(
        "<div class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" aria-hidden=\"true\">" +
          "<div class=\"modal-dialog\" role=\"document\">" +
            "<div class=\"modal-content\">" +
              "<div class=\"modal-header border-bottom-0\">" +
                "<h5 class=\"modal-title\">" +
                  settings.textConfirmDeletion +
                "</h5>" +
              "</div>" +
              "<div class=\"modal-footer border-top-0\">" +
                "<button type=\"button\" class=\"btn btn-secondary\" data-dismiss=\"modal\">" +
                  settings.labelCancelDeletion +
                "</button>" +
                "<button type=\"button\" class=\"btn btn-danger btnConfirmRemoval\">" +
                  settings.labelConfirmDeletion +
                "</button>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>"
      )
      .attr('id', modalId)
      .attr('aria-labelledby', titleId)
      .on('show.bs.modal', function (event) {
        // $deleteButton is the button that triggered the modal
        // Throgh it we can retrieve the li item to be deleted
        var $deleteButton = $(event.relatedTarget);
        // Save $deleteButton for when the user clicks the confirmation button.
        $(this).find('.btnConfirmRemoval').data('deleteButton', $deleteButton);
      });

      $modal.find('.modal-title').attr('id', titleId);

      // Bind to the confirmation button the click event to actually remove current item
      $modal.find('.btnConfirmRemoval').on('click', function() {
        // Remove the current item ...
        removeItem($(this).data('deleteButton'));
        // ... and close the modal
        $(this).closest('.modal').modal('hide');
      });
      $('body').append($modal);
      return $modal;
    }

    function TOpener(li){
        var opener = $('<span>').addClass('sortableListsOpener ' + options.opener.openerClass).css(options.opener.openerCss)
                .on('mousedown touchstart', function (e){
                    var li = $(this).closest('li');
                    if (li.hasClass('sortableListsClosed')) {
                        li.iconOpen(options);
                    } else {
                        li.iconClose(options);
                    }
                    return false; // Prevent default
                });
        opener.prependTo(li.children('div').first());
        if ( !li.hasClass('sortableListsOpen') ) {
            li.iconClose(options);
        } else {
            li.iconOpen(options);
        }
    }

    function setOpeners() {
        $main.find('li').each(function () {
            var $li = $(this);
            if ($li.children('ul').length) {
                TOpener($li);
            }
        });
    }

    function isValidLevel($li, $liTarget) {
        if (settings.maxLevel < 0){
            return true;
        }
        var targetLevel = 0;
        var liCount = $li.find('ul').length;
        if ($liTarget.length==0) {
            targetLevel = 0;
        } else {
            targetLevel = parseInt($liTarget.parent().data("level")) + 1;
        }
        console.log((targetLevel + liCount));
        return ((targetLevel + liCount)<=settings.maxLevel)
    }

    /* PUBLIC METHODS */
    this.setForm = function(form){
        $form = form;
    };

    this.getForm = function(){
        return $form;
    };

    this.setUpdateButton = function($btn) {
        $updateButton = $btn;
        $updateButton.attr('disabled', true);
        itemEditing = null;
    };

    this.getUpdateButton = function(){
        return $updateButton;
    };

    this.getCurrentItem = function(){
        return itemEditing;
    };

    this.update = function(){
        var $cEl = this.getCurrentItem();
        if ($cEl===null){
            return;
        }
        var oldIcon = $cEl.data('icon');
        $form.find('.item-menu').each(function() {
            $cEl.data($(this).attr('name'), $(this).val());
        });
        if (settings.showIcons) {
            $cEl.children().children('i').removeClass(oldIcon).addClass($cEl.data('icon'));
        }
        $cEl.find('span.txt').first().text($cEl.data('text'));
        resetForm();
    };
   
    this.add = function($parentItem, index){
        var data = {};
        $form.find('.item-menu').each(function() {
            data[$(this).attr('name')] = $(this).val();
        });

        var $ul = $main;
        // Make sure $parentItem is a descendant of $main
        if ($ul.has($parentItem).length) {
            $ul = $parentItem.children('ul');
            if (!$ul.length) {
                var parentLevel = $parentItem.parent('ul').data('level');
                $ul = $('<ul>').addClass('pl-0').css('padding-top', '10px').data('level', parentLevel + 1);
                $parentItem.addClass('sortableListsOpen').append($ul);
                TOpener($parentItem);
            } else {
                $parentItem.iconOpen(options);
            }
        }

        var $li = $("<li>").addClass('list-group-item pl-2 pl-sm-3');
        // Remove right padding from items not on top level,
        // or else their buttons won't align with their parent's
        $li.toggleClass('pr-0',         $ul.get(0) != $main.get(0));
        $li.toggleClass('pr-2 pr-sm-3', $ul.get(0) == $main.get(0));
        $li.data(data);
        var $div = $('<div>').css({"overflow": "auto"});
        if (settings.showIcons) {
            var $i = $('<i>').addClass(data.icon);
            $div.append($i).append("&nbsp;")
        }
        var $span = $('<span>').addClass('txt').text(data.text);
        var $divbtn = TButtonGroup();
        $div.append($span).append($divbtn);
        $li.append($div);

        // Insert item at proper position
        if (index == undefined) {
          $ul.append($li);
        } else {
          $ul.children('li').eq(index).before($li);
        }

        $div.each(function () {
            openerWrapperObserver.observe(this, observerInitSettings);
        });

        MenuEditor.updateButtons($main);
        resetForm();
    };
    /**
     * Data Output
     * @return String JSON menu scheme
     */
    this.getJson = function () {
        return $main.menuEditorToJson();
    };
    this.getJsonString = function () {
        var obj = $main.menuEditorToJson();
        return JSON.stringify(obj);
    };
    this.getArray = function () {
        return $main.menuEditorToArray();
    };
    this.getArrayString = function () {
        var arr = $main.menuEditorToArray();
        return JSON.stringify(arr);
    };
    /**
     * Data Input
     * @param {Array} Object array. The nested menu scheme
     */
    this.setData = function (strJson) {
        var arrayItem = (Array.isArray(strJson)) ? strJson : stringToArray(strJson);
        if (arrayItem !== null) {
            $main.empty();
            var $menu = createMenu(arrayItem);
            if (!sortableReady) {
                $menu.sortableLists(settings.listOptions);
                sortableReady = true;
            } else {
                setOpeners();
            }
            MenuEditor.updateButtons($main);
        }
    };
};
/* STATIC METHOD */
/**
 * Update the buttons on the list. Only the buttons 'Up', 'Down', 'In', 'Out'
 * @param {jQuery} $mainList The unorder list 
 **/
MenuEditor.updateButtons = function($mainList) {
    $mainList.find('.btnMove').show();
    $mainList.updateButtons();
};
