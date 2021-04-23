/**
 * jQuery Menu Editor
 * @author David Ticona Saravia https://github.com/davicotico
 * @version 1.1.0
 * */
( function( $ )
{    
    /**
     * @desc jQuery plugin to sort html list also the tree structures
     * @version 1.4.0
     * @author Vladimír Čamaj
     * @license MIT
     * @desc jQuery plugin
     * @param options
     * @returns this to unsure chaining
     */
    $.fn.sortableLists = function( options )
    {
        // Local variables. This scope is available for all the functions in this closure.
        var jQBody = $( 'body' ).css( 'position', 'relative' ),

            defaults = {
                currElClass: '',
                placeholderClass: '',
                placeholderCss: {
                    'position': 'relative',
                    'padding': 0
                },
                hintClass: '',
                hintCss: {
                    'display': 'none',
                    'position': 'relative',
                    'padding': 0
                },
                hintWrapperClass: '',
                hintWrapperCss: { /* Description is below the defaults in this var section */ },
                baseClass: '',
                baseCss: {
                    'position': 'absolute',
                    'top': 0 - parseInt( jQBody.css( 'margin-top' ) ),
                    'left': 0 - parseInt( jQBody.css( 'margin-left' ) ),
                    'margin': 0,
                    'padding': 0,
                    'z-index': 2500
                },
                opener: {
                    active: false,
                    open: '',
                    close: '',
                    openerCss: {
                        'float': 'left',
                        'display': 'inline-block',
                        'background-position': 'center center',
                        'background-repeat': 'no-repeat'
                    },
                    openerClass: ''
                },
                listSelector: 'ul',
                listsClass: '', // Used for hintWrapper and baseElement
                listsCss: {},
                insertZone: 50,
                insertZonePlus: false,
                scroll: 20,
                ignoreClass: '',
                isAllowed: function( cEl, hint, target ) { return true; },  // Params: current el., hint el.
                onDragStart: function( e, cEl ) { return true; },  // Params: e jQ. event obj., current el.
                onChange: function( cEl ) { return true; },  // Params: current el.
                complete: function( cEl ) { return true; }  // Params: current el.
            },

            setting = $.extend( true, {}, defaults, options ),

            // base element from which is counted position of draged element
            base = $( '<' + setting.listSelector + ' />' )
                .prependTo( jQBody )
                .attr( 'id', 'sortableListsBase' )
                .css( setting.baseCss )
                .addClass( setting.listsClass + ' ' + setting.baseClass ),

            // placeholder != state.placeholderNode
            // placeholder is document fragment and state.placeholderNode is document node
            placeholder = $( '<li />' )
                .attr( 'id', 'sortableListsPlaceholder' )
                .css( setting.placeholderCss )
                .addClass( setting.placeholderClass ),

            // hint is document fragment
            hint = $( '<li />' )
                .attr( 'id', 'sortableListsHint' )
                .css( setting.hintCss )
                .addClass( setting.hintClass ),

            // Is document fragment used as wrapper if hint is inserted to the empty li
            hintWrapper = $( '<' + setting.listSelector + ' />' )
                .attr( 'id', 'sortableListsHintWrapper' )
                .addClass( setting.listsClass + ' ' + setting.hintWrapperClass )
                .css( setting.listsCss )
                .css( setting.hintWrapperCss ),

            // Is +/- ikon to open/close nested lists
            opener = $( '<span />' )
                .addClass( 'sortableListsOpener ' + setting.opener.openerClass )
                .css( setting.opener.openerCss )
                .on( 'mousedown touchstart', function( e )
                {
                    var li = $( this ).closest( 'li' );

                    if ( li.hasClass( 'sortableListsClosed' ) )
                    {
                        open( li );
                    }
                    else
                    {
                        close( li );
                    }

                    return false; // Prevent default
                } );

        if ( setting.opener.as == 'class' )
        {
            opener.addClass( setting.opener.close );
        }
        else if ( setting.opener.as == 'html' )
        {
            opener.html( setting.opener.close );
        }
        else
        {
            console.error('Invalid setting for opener.as');
        }

        // Container with all actual elements and parameters
        var state = {
            isDragged: false,
            isRelEFP: null,  // How browser counts elementFromPoint() position (relative to window/document)
            oEl: null, // overElement is element which returns elementFromPoint() method
            rootEl: null,
            cEl: null, // currentElement is currently dragged element
            upScroll: false,
            downScroll: false,
            pX: 0,
            pY: 0,
            cX: 0,
            cY: 0,
            isAllowed: true, // The function is defined in setting
            e: { pageX: 0, pageY: 0, clientX: 0, clientY: 0 }, // TODO: unused??
            doc: $( document ),
            win: $( window )
        };

        if ( setting.opener.active )
        {
            if ( ! setting.opener.open ) throw 'Opener.open value is not defined. It should be valid url, html or css class.';
            if ( ! setting.opener.close ) throw 'Opener.close value is not defined. It should be valid url, html or css class.';

            $( this ).find( 'li' ).each( function()
            {
                var li = $( this );

                if ( li.children( setting.listSelector ).length )
                {
                    opener.clone( true ).prependTo( li.children( 'div' ).first() );

                    if ( ! li.hasClass( 'sortableListsOpen' ) )
                    {
                        close( li );
                    }
                    else
                    {
                        open( li );
                    }
                }
            } );
        }

        // Return this ensures chaining
        return this.on( 'mousedown touchstart', function( e )
            {
                var target = $( e.target );

                if ( state.isDragged !== false || ( setting.ignoreClass && target.hasClass( setting.ignoreClass ) ) ) return; // setting.ignoreClass is checked cause hasClass('') returns true

                // Solves selection/range highlighting
                e.preventDefault();

                if ( e.type === 'touchstart' )
                {
                    setTouchEvent( e );
                }

                // El must be li in jQuery object
                var el = target.closest( 'li' ),
                    rEl = $( this );

                // Check if el is not empty
                if ( el[ 0 ] )
                {
                    setting.onDragStart( e, el );
                    startDrag( e, el, rEl );
                }
            }
        );

        /**
         * @desc Binds events dragging and endDrag, sets some init. values
         * @param e event obj.
         * @param el curr. dragged element
         * @param rEl root element
         */
        function startDrag( e, el, rEl )
        {
            state.isDragged = true;

            var elMT = parseInt( el.css( 'margin-top' ) ), // parseInt is necesary cause value has px at the end
                elMB = parseInt( el.css( 'margin-bottom' ) ),
                elML = parseInt( el.css( 'margin-left' ) ),
                elMR = parseInt( el.css( 'margin-right' ) ),
                elXY = el.offset(),
                elIH = el.innerHeight();

            state.rootEl = {
                el: rEl,
                offset: rEl.offset(),
                rootElClass: rEl.attr( 'class' )
            };

            state.cEl = {
                el: el,
                mT: elMT, mL: elML, mB: elMB, mR: elMR,
                offset: elXY
            };

            state.cEl.xyOffsetDiff = { X: e.pageX - state.cEl.offset.left, Y: e.pageY - state.cEl.offset.top };
            state.cEl.el.addClass( 'sortableListsCurrent' + ' ' + setting.currElClass );

            el.before( placeholder );  // Now document has node placeholder

            var placeholderNode = state.placeholderNode = $( '#sortableListsPlaceholder' );  // jQuery object && document node

            el.css( {
                'width': el.width(),
                'position': 'absolute',
                'top': elXY.top - elMT,
                'left': elXY.left - elML
            } ).prependTo( base );

            placeholderNode.css( {
                'display': 'block',
                'height': elIH
            } );

            hint.css( 'height', elIH );

            state.doc
                .on( 'mousemove touchmove', dragging )
                .on( 'mouseup touchend touchcancel', endDrag );

        }

        /**
         * @desc Start dragging
         * @param e event obj.
         */
        function dragging( e )
        {
            if ( state.isDragged )
            {
                var cEl = state.cEl,
                    doc = state.doc,
                    win = state.win;

                if ( e.type === 'touchmove' )
                {
                    setTouchEvent( e );
                }

                // event triggered by trigger() from setInterval does not have XY properties
                if ( ! e.pageX )
                {
                    setEventPos( e );
                }

                // Scrolling up
                if ( doc.scrollTop() > state.rootEl.offset.top - 10 && e.clientY < 50 )
                {
                    if ( ! state.upScroll ) // Has to be here after cond. e.clientY < 50 cause else unsets the interval
                    {
                        setScrollUp( e );
                    }
                    else
                    {
                        e.pageY = e.pageY - setting.scroll;
                        $( 'html, body' ).each( function( i )
                        {
                            $( this ).scrollTop( $( this ).scrollTop() - setting.scroll );
                        } );
                        setCursorPos( e );
                    }
                }
                // Scrolling down
                else if ( doc.scrollTop() + win.height() < state.rootEl.offset.top + state.rootEl.el.outerHeight( false ) + 10 && win.height() - e.clientY < 50 )
                {
                    if ( ! state.downScroll )
                    {
                        setScrollDown( e );
                    }
                    else
                    {
                        e.pageY = e.pageY + setting.scroll;
                        $( 'html, body' ).each( function( i )
                        {
                            $( this ).scrollTop( $( this ).scrollTop() + setting.scroll );
                        } );
                        setCursorPos( e );
                    }
                }
                else
                {
                    scrollStop( state );
                }

                // Script needs to know old oEl
                state.oElOld = state.oEl;

                cEl.el[ 0 ].style.visibility = 'hidden';  // This is important for the next row
                state.oEl = oEl = elFromPoint( e.pageX, e.pageY );
                cEl.el[ 0 ].style.visibility = 'visible';

                showHint( e, state );

                setCElPos( e, state );

            }
        }

        /**
         * @desc endDrag unbinds events mousemove/mouseup and removes redundant elements
         * @param e
         */
        function endDrag( e )
        {
            var cEl = state.cEl,
                hintNode = $( '#sortableListsHint', state.rootEl.el ),
                hintStyle = hint[ 0 ].style,
                targetEl = null, // hintNode/placeholderNode
                isHintTarget = false, // if cEl will be placed to the hintNode
                hintWrapperNode = $( '#sortableListsHintWrapper' );

            if ( e.type === 'touchend' || e.type === 'touchcancel' )
            {
                setTouchEvent( e );
            }

            if ( hintStyle.display == 'block' && hintNode.length && state.isAllowed )
            {
                targetEl = hintNode;
                isHintTarget = true;
            }
            else
            {
                targetEl = state.placeholderNode;
                isHintTarget = false;
            }

            offset = targetEl.offset();

            cEl.el.animate( { left: offset.left - state.cEl.mL, top: offset.top - state.cEl.mT }, 250,
                function()  // complete callback
                {
                    tidyCurrEl( cEl );

                    targetEl.after( cEl.el[ 0 ] );
                    targetEl[ 0 ].style.display = 'none';
                    hintStyle.display = 'none';
                    // This have to be document node, not hint as a part of documentFragment.
                    hintNode.remove();

                    hintWrapperNode
                        .removeAttr( 'id' )
                        .removeClass( setting.hintWrapperClass );

                    if ( hintWrapperNode.length )
                    {
                        //hintWrapperNode.prev( 'div' ).append( opener.clone( true ) ); // original
                        hintWrapperNode.prev( 'div' ).prepend( opener.clone( true ) ); //david
                    }

                    // Directly removed placeholder looks bad. It jumps up if the hint is below.
                    if ( isHintTarget )
                    {
                        state.placeholderNode.slideUp( 150, function()
                        {
                            state.placeholderNode.remove();
                            tidyEmptyLists();
                            setting.onChange( cEl.el );
                            setting.complete( cEl.el ); // Have to be here cause is necessary to remove placeholder before complete call.
                            state.isDragged = false;
                        } );
                    }
                    else
                    {
                        state.placeholderNode.remove();
                        tidyEmptyLists();
                        setting.complete( cEl.el );
                        state.isDragged = false;
                    }

                } );

            scrollStop( state );

            state.doc
                .unbind( "mousemove touchmove", dragging )
                .unbind( "mouseup touchend touchcancel", endDrag );


        }

        //////// Helpers /////////////////////////////////////////////////////////////////////////////////////

        //////// Scroll handlers /////////////////////////////////////////////////////////////////////////////

        /**
         * @desc Ensures autoscroll up.
         * @param e
         * @return No value
         */
        function setScrollUp( e )
        {
            if ( state.upScroll ) return;

            state.upScroll = setInterval( function()
            {
                state.doc.trigger( 'mousemove' );
            }, 50 );

        }

        /**
         * @desc Ensures autoscroll down.
         * @param e
         * @return No value
         */
        function setScrollDown( e )
        {
            if ( state.downScroll ) return;

            state.downScroll = setInterval( function()
            {
                state.doc.trigger( 'mousemove' );
            }, 50 );

        }

        /**
         * @desc This properties are used when setScrollUp()/Down() calls trigger('mousemove'), cause trigger() produce event object without pageY/Y and clientX/Y.
         * @param e
         * @return No value
         */
        function setCursorPos( e )
        {
            state.pY = e.pageY;
            state.pX = e.pageX;
            state.cY = e.clientY;
            state.cX = e.clientX;
        }

        /**
         * @desc Necessary while scrolling, cause trigger('mousemove') does not set cursor XY values in event object
         * @param e
         * @return No value
         */
        function setEventPos( e )
        {
            e.pageY = state.pY;
            e.pageX = state.pX;
            e.clientY = state.cY;
            e.clientX = state.cX;
        }

        /**
         * @desc Stops scrolling and sets variables
         * @param state
         * @return No value
         */
        function scrollStop( state )
        {
            clearInterval( state.upScroll );
            clearInterval( state.downScroll );
            // clearInterval have to be before upScroll/downScroll is set to false
            state.upScroll = state.downScroll = false;
        }

        /////// End of Scroll handlers //////////////////////////////////////////////////////////////
        /////// Current element handlers //////////////////////////////////////////////////////////////

        /**
         * Sets the e.page/e.screen properties
         * @param e
         */
        function setTouchEvent( e )
        {
            e.pageX = e.originalEvent.changedTouches[ 0 ].pageX;
            e.pageY = e.originalEvent.changedTouches[ 0 ].pageY;
            e.screenX = e.originalEvent.changedTouches[ 0 ].screenX;
            e.screenY = e.originalEvent.changedTouches[ 0 ].screenY;
        }

        /**
         * @desc Sets the position of dragged element
         * @param e event object
         * @param state state object
         * @return No value
         */
        function setCElPos( e, state )
        {
            var cEl = state.cEl;

            cEl.el.css( {
                'top': e.pageY - cEl.xyOffsetDiff.Y - cEl.mT,
                'left': e.pageX - cEl.xyOffsetDiff.X - cEl.mL
            } )

        }

        /**
         * @desc Return elementFromPoint() result as jQuery object
         * @param x e.pageX
         * @param y e.pageY
         * @return null|jQuery object
         */
        function elFromPoint( x, y )
        {
            if ( ! document.elementFromPoint ) return null;

            // FF/IE/CH needs coordinates relative to the window, unlike
            // Opera/Safari which needs absolute coordinates of document in elementFromPoint()
            var isRelEFP = state.isRelEFP;

            // isRelative === null means it is not checked yet
            if ( isRelEFP === null )
            {
                var s, res;
                if ( (s = state.doc.scrollTop()) > 0 )
                {
                    isRelEFP = ( (res = document.elementFromPoint( 0, s + $( window ).height() - 1 ) ) == null
                    || res.tagName.toUpperCase() == 'HTML');  // IE8 returns html
                }
                if ( (s = state.doc.scrollLeft()) > 0 )
                {
                    isRelEFP = ( (res = document.elementFromPoint( s + $( window ).width() - 1, 0 ) ) == null
                    || res.tagName.toUpperCase() == 'HTML');  // IE8 returns html
                }
            }

            if ( isRelEFP )
            {
                x -= state.doc.scrollLeft();
                y -= state.doc.scrollTop();
            }

            // Returns jQuery object
            var el = $( document.elementFromPoint( x, y ) );

            if ( ! state.rootEl.el.find( el ).length ) // el is outside the rootEl
            {
                return null;
            }
            else if ( el.is( '#sortableListsPlaceholder' ) || el.is( '#sortableListsHint' ) ) // el is #placeholder/#hint
            {
                return null;
            }
            else if ( ! el.is( 'li' ) ) // el is ul or div or something else in li elem.
            {
                el = el.closest( 'li' );
                return el[ 0 ] ? el : null;
            }
            else if ( el.is( 'li' ) ) // el is most wanted li
            {
                return el;
            }

        }
        //////// End of current element handlers //////////////////////////////////////////////////////
        //////// Show hint handlers //////////////////////////////////////////////////////

        /**
         * @desc Shows or hides or does not show hint element
         * @param e event
         * @param state
         * @return No value
         */
        function showHint( e, state )
        {
            var oEl = state.oEl;

            // If oEl is null or if this is the first call in dragging
            if ( ! oEl || ! state.oElOld )  return;

            var oElH = oEl.outerHeight( false ),
                relY = e.pageY - oEl.offset().top;

            if ( setting.insertZonePlus )
            {
                if ( 14 > relY )  // Inserting on top
                {
                    showOnTopPlus( e, oEl, 7 > relY );  // Last bool param express if hint insert outside/inside
                }
                else if ( oElH - 14 < relY )  // Inserting on bottom
                {
                    showOnBottomPlus( e, oEl, oElH - 7 < relY );
                }
            }
            else
            {
                if ( 5 > relY )  // Inserting on top
                {
                    showOnTop( e, oEl );
                }
                else if ( oElH - 5 < relY )  // Inserting on bottom
                {
                    showOnBottom( e, oEl );
                }
            }
        }

        /**
         * @desc Called from showHint method. Displays or hides hint element
         * @param e event
         * @param oEl oElement
         * @return No value
         */
        function showOnTop( e, oEl )
        {
            if ( $( '#sortableListsHintWrapper', state.rootEl.el ).length )
            {
                hint.unwrap();  // If hint is wrapped by ul/ol #sortableListsHintWrapper
            }

            // Hint outside the oEl
            if ( e.pageX - oEl.offset().left < setting.insertZone )
            {
                // Ensure display:none if hint will be next to the placeholder
                if ( oEl.prev( '#sortableListsPlaceholder' ).length )
                {
                    hint.css( 'display', 'none' );
                    return;
                }
                oEl.before( hint );
            }
            // Hint inside the oEl
            else
            {
                var children = oEl.children(),
                    list = oEl.children( setting.listSelector ).first();

                if ( list.children().first().is( '#sortableListsPlaceholder' ) )
                {
                    hint.css( 'display', 'none' );
                    return;
                }

                // Find out if is necessary to wrap hint by hintWrapper
                if ( ! list.length )
                {
                    children.first().after( hint );
                    hint.wrap( hintWrapper );
                }
                else
                {
                    list.prepend( hint );
                }

                if ( state.oEl )
                {
                    open( oEl ); // TODO:animation??? .children('ul,ol').css('display', 'block');
                }

            }

            hint.css( 'display', 'block' );
            // Ensures posible formating of elements. Second call is in the endDrag method.
            state.isAllowed = setting.isAllowed( state.cEl.el, hint, hint.parents( 'li' ).first() );

        }

        /**
         * @desc Called from showHint method. Displays or hides hint element
         * @param e event
         * @param oEl oElement
         * @param outside bool
         * @return No value
         */
        function showOnTopPlus( e, oEl, outside )
        {
            if ( $( '#sortableListsHintWrapper', state.rootEl.el ).length )
            {
                hint.unwrap();  // If hint is wrapped by ul/ol #sortableListsHintWrapper
            }

            // Hint inside the oEl
            if ( ! outside && e.pageX - oEl.offset().left > setting.insertZone )
            {
                var children = oEl.children(),
                    list = oEl.children( setting.listSelector ).first();

                if ( list.children().first().is( '#sortableListsPlaceholder' ) )
                {
                    hint.css( 'display', 'none' );
                    return;
                }

                // Find out if is necessary to wrap hint by hintWrapper
                if ( ! list.length )
                {
                    children.first().after( hint );
                    hint.wrap( hintWrapper );
                }
                else
                {
                    list.prepend( hint );
                }

                if ( state.oEl )
                {
                    open( oEl ); // TODO:animation??? .children('ul,ol').css('display', 'block');
                }
            }
            // Hint outside the oEl
            else
            {
                // Ensure display:none if hint will be next to the placeholder
                if ( oEl.prev( '#sortableListsPlaceholder' ).length )
                {
                    hint.css( 'display', 'none' );
                    return;
                }
                oEl.before( hint );

            }

            hint.css( 'display', 'block' );
            // Ensures posible formating of elements. Second call is in the endDrag method.
            state.isAllowed = setting.isAllowed( state.cEl.el, hint, hint.parents( 'li' ).first() );

        }

        /**
         * @desc Called from showHint function. Displays or hides hint element.
         * @param e event
         * @param oEl oElement
         * @return No value
         */
        function showOnBottom( e, oEl )
        {
            if ( $( '#sortableListsHintWrapper', state.rootEl.el ).length )
            {
                hint.unwrap();  // If hint is wrapped by ul/ol sortableListsHintWrapper
            }

            // Hint outside the oEl
            if ( e.pageX - oEl.offset().left < setting.insertZone )
            {
                // Ensure display:none if hint will be next to the placeholder
                if ( oEl.next( '#sortableListsPlaceholder' ).length )
                {
                    hint.css( 'display', 'none' );
                    return;
                }
                oEl.after( hint );
            }
            // Hint inside the oEl
            else
            {
                var children = oEl.children(),
                    list = oEl.children( setting.listSelector ).last();  // ul/ol || empty jQuery obj

                if ( list.children().last().is( '#sortableListsPlaceholder' ) )
                {
                    hint.css( 'display', 'none' );
                    return;
                }

                // Find out if is necessary to wrap hint by hintWrapper
                if ( list.length )
                {
                    children.last().append( hint );
                }
                else
                {
                    oEl.append( hint );
                    hint.wrap( hintWrapper );
                }

                if ( state.oEl )
                {
                    open( oEl ); // TODO: animation???
                }

            }

            hint.css( 'display', 'block' );
            // Ensures posible formating of elements. Second call is in the endDrag method.
            state.isAllowed = setting.isAllowed( state.cEl.el, hint, hint.parents( 'li' ).first() );

        }

        /**
         * @desc Called from showHint function. Displays or hides hint element.
         * @param e event
         * @param oEl oElement
         * @param outside bool
         * @return No value
         */
        function showOnBottomPlus( e, oEl, outside )
        {
            if ( $( '#sortableListsHintWrapper', state.rootEl.el ).length )
            {
                hint.unwrap();  // If hint is wrapped by ul/ol sortableListsHintWrapper
            }

            // Hint inside the oEl
            if ( ! outside && e.pageX - oEl.offset().left > setting.insertZone )
            {
                var children = oEl.children(),
                    list = oEl.children( setting.listSelector ).last();  // ul/ol || empty jQuery obj

                if ( list.children().last().is( '#sortableListsPlaceholder' ) )
                {
                    hint.css( 'display', 'none' );
                    return;
                }

                // Find out if is necessary to wrap hint by hintWrapper
                if ( list.length )
                {
                    children.last().append( hint );
                }
                else
                {
                    oEl.append( hint );
                    hint.wrap( hintWrapper );
                }

                if ( state.oEl )
                {
                    open( oEl ); // TODO: animation???
                }

            }
            // Hint outside the oEl
            else
            {
                // Ensure display:none if hint will be next to the placeholder
                if ( oEl.next( '#sortableListsPlaceholder' ).length )
                {
                    hint.css( 'display', 'none' );
                    return;
                }
                oEl.after( hint );

            }

            hint.css( 'display', 'block' );
            // Ensures posible formating of elements. Second call is in the endDrag method.
            state.isAllowed = setting.isAllowed( state.cEl.el, hint, hint.parents( 'li' ).first() );

        }

        //////// End of show hint handlers ////////////////////////////////////////////////////
        //////// Open/close handlers //////////////////////////////////////////////////////////

        /**
         * @desc Handles opening nested lists
         * @param li
         */
        function open( li )
        {
            li.removeClass( 'sortableListsClosed' ).addClass( 'sortableListsOpen' );
            li.children( setting.listSelector ).css( 'display', 'block' );

            var opener = li.children( 'div' ).children( '.sortableListsOpener' ).first();

            if ( setting.opener.as == 'html' )
            {
                opener.html( setting.opener.close );
            }
            else if ( setting.opener.as == 'class' )
            {
                opener.addClass( setting.opener.close ).removeClass( setting.opener.open );
            }
            else
            {
                opener.css( 'background-image', 'url(' + setting.opener.close + ')' );
            }
        }

        /**
         * @desc Handles opening nested lists
         * @param li
         */
        function close( li )
        {
            li.removeClass( 'sortableListsOpen' ).addClass( 'sortableListsClosed' );
            li.children( setting.listSelector ).css( 'display', 'none' );

            var opener = li.children( 'div' ).children( '.sortableListsOpener' ).first();

            if ( setting.opener.as == 'html' )
            {
                opener.html( setting.opener.open );
            }
            else if ( setting.opener.as == 'class' )
            {
                opener.addClass( setting.opener.open ).removeClass( setting.opener.close );
            }
            else
            {
                opener.css( 'background-image', 'url(' + setting.opener.open + ')' );
            }

        }

        /////// Enf of open/close handlers //////////////////////////////////////////////

        /**
         * @desc Places the currEl to the target place
         * @param cEl
         */
        function tidyCurrEl( cEl )
        {
            var cElStyle = cEl.el[ 0 ].style;

            cEl.el.removeClass( setting.currElClass + ' ' + 'sortableListsCurrent' );
            cElStyle.top = '0';
            cElStyle.left = '0';
            cElStyle.position = 'relative';
            cElStyle.width = 'auto';

        }

        /**
         * @desc Removes empty lists and redundant openers
         */
        function tidyEmptyLists()
        {
            // Remove every empty ul/ol from root and also with .sortableListsOpener
            // hintWrapper can not be removed before the hint
            $( setting.listSelector, state.rootEl.el ).each( function( i )
                {
                    if ( ! $( this ).children().length )
                    {
                        $( this ).prev( 'div' ).children( '.sortableListsOpener' ).first().remove();
                        $( this ).remove();
                    }
                }
            );

        }

    };

    /** END PLUGIN sortableLists */

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
    $.fn.sortableListsToJson = function (){
        var arr = [];
        $(this).children('li').each(function () {
            var li = $(this);
            var object = li.data();
            arr.push(object);
            var ch = li.children('ul,ol').sortableListsToJson();
            if (ch.length > 0) {
                object.children = ch;
            } else {
                delete object.children;
            }
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
    var $main = $("#" + idSelector).data("level", "0");
    var settings = {
        labelEdit: '<i class="fas fa-edit clickable"></i>',
        labelRemove: '<i class="fas fa-trash-alt clickable"></i>',
        textConfirmDelete: 'This item will be deleted. Are you sure?',
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
            complete: function (cEl) {
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
    var itemEditing = null;
    var sortableReady = true;
    var $form = null;
    var $updateButton = null;
    var iconPickerOpt = settings.iconPicker;
    var options = settings.listOptions;
    var iconPicker = $('#'+idSelector+'_icon').iconpicker(iconPickerOpt);
    $main.sortableLists(settings.listOptions);

    /* EVENTS */
    iconPicker.on('change', function (e) {
        $form.find("[name=icon]").val(e.icon);
    });

    $main.on('click', '.btnRemove', function (e) {
        e.preventDefault();
        if (confirm(settings.textConfirmDelete)) {
            var list = $(this).closest('ul');
            $(this).closest('li').remove();
            var isMainContainer = false;
            if (typeof list.attr('id') !== 'undefined') {
                isMainContainer = (list.attr('id').toString() === idSelector);
            }
            if ((!list.children().length) && (!isMainContainer)) {
                list.prev('div').children('.sortableListsOpener').first().remove();
                list.remove();
            }
            MenuEditor.updateButtons($main);
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
        $liParent.after($li);
        if (list.children().length <= 0) {
            list.prev('div').children('.sortableListsOpener').first().remove();
            list.remove();
        }
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
        MenuEditor.updateButtons($main);
        $main.updateLevels();
    });

    /* PRIVATE METHODS */
    function editItem($item) {
        var data = $item.data();
        $.each(data, function (p, v) {
            $form.find("[name=" + p + "]").val(v);
        });
        $form.find(".item-menu").first().focus();
        if (data.hasOwnProperty('icon')) {
            iconPicker.iconpicker('setIcon', data.icon);
        } else{
            iconPicker.iconpicker('setIcon', 'empty');
        }
        $updateButton.removeAttr('disabled');
    }

    function resetForm() {
        $form[0].reset();
        iconPicker = iconPicker.iconpicker(iconPickerOpt);
        iconPicker.iconpicker('setIcon', 'empty');
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
        var $btnUp = TButton({classCss: 'btn btn-secondary btn-sm btnUp btnMove', text: '<i class="fas fa-angle-up clickable"></i>'});
        var $btnDown = TButton({classCss: 'btn btn-secondary btn-sm btnDown btnMove', text: '<i class="fas fa-angle-down clickable"></i>'});
        var $btnOut = TButton({classCss: 'btn btn-secondary btn-sm btnOut btnMove', text: '<i class="fas fa-level-down-alt clickable"></i>'});
        var $btnIn = TButton({classCss: 'btn btn-secondary btn-sm btnIn btnMove', text: '<i class="fas fa-level-up-alt clickable"></i>'});
        $divbtn.append($btnUp).append($btnDown).append($btnIn).append($btnOut).append($btnEdit).append($btnRemv);
        return $divbtn;
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
            var isParent = (typeof (v.children) !== "undefined") && ($.isArray(v.children));
            var itemObject = {text: "", href: "", icon: "empty", target: "_self", title: ""};
            var temp = $.extend({}, v);
            if (isParent){ 
                delete temp['children'];
            }
            $.extend(itemObject, temp);
            var $li = $('<li>').addClass('list-group-item pr-0');
            $li.data(itemObject);
            var $div = $('<div>').css('overflow', 'auto');
            var $i = $('<i>').addClass(v.icon);
            var $span = $('<span>').addClass('txt').append(v.text).css('margin-right', '5px');
            var $divbtn =  TButtonGroup();
            $div.append($i).append("&nbsp;").append($span).append($divbtn);
            $li.append($div);
            if (isParent) {
                $li.append(createMenu(v.children, level + 1));
            }
            $elem.append($li);
        });
        return $elem;
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
        $cEl.children().children('i').removeClass(oldIcon).addClass($cEl.data('icon'));
        $cEl.find('span.txt').first().text($cEl.data('text'));
        resetForm();
    };
   
    this.add = function(){
        var data = {};
        $form.find('.item-menu').each(function() {
            data[$(this).attr('name')] = $(this).val();
        });
        var btnGroup = TButtonGroup();
        var textItem = $('<span>').addClass('txt').text(data.text);
        var iconItem = $('<i>').addClass(data.icon);
        var div = $('<div>').css({"overflow": "auto"}).append(iconItem).append("&nbsp;").append(textItem).append(btnGroup);
        var $li = $("<li>").data(data);
        $li.addClass('list-group-item pr-0').append(div);
        $main.append($li);
        MenuEditor.updateButtons($main);
        resetForm();
    };
    /**
     * Data Output
     * @return String JSON menu scheme
     */
    this.getString = function () {
        var obj = $main.sortableListsToJson();
        return JSON.stringify(obj);
    };
    /**
     * Data Input
     * @param {Array} Object array. The nested menu scheme
     */
    this.setData = function (strJson) {
        var arrayItem = (Array.isArray(strJson)) ? strJson : stringToArray(strJson);
        if (arrayItem !== null) {
            $main.empty();
            var menu = createMenu(arrayItem);
            if (!sortableReady) {
                menu.sortableLists(settings.listOptions);
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
