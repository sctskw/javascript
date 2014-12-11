  /**
   *  This is a wrapper class for a TextArea that provides more functionality
   *  than a standard text area.
   */
angular
  .module('app')
  .factory('SuperTextArea', function(GetCaretPosition, AppConfig){
    'use strict';

    //private constructor for prototyping
    function _SuperTextArea(el, cfg) {
      var me = this;

      if(typeof el === "undefined") {
        return;
      }

      this.el = el;

      //dummy fn's
      this.onNewLine;
      this.onPaste;

      this.opts = {
        disableEnterAfterBlank: true,
        inputEventEnabled: true,
        newLineChar: '\n',
        invalidKeyCodes: [32, 93, 9, 16, 17, 18, 224, 37, 38, 39, 40, 27, 20, 33, 34],
        preventedKeyCodes: [32]
      };

      //custom attributes
      this.ctrlKeyPressed = false;
      this.selectionStart = this.el.selectionStart;
      this.selectionEnd = this.el.selectionEnd;

      //configure default options
      //@TODO: accept configuration from constructor params
      function setOptions(obj) {}

      //handle enter key event
      function onEnterKey(evt) {
        if(typeof me.onNewLine !== "undefined"){
          var currentLine = me.getCurrentLineNo(),
            currentEmptyLine = (me.isEmptyLine(currentLine) && currentLine > 0);

          //don't go to next line unless current one has a value
          if(me.opts.disableEnterAfterBlank === true &&
              (currentEmptyLine === true || !me.hasValues(true, true))){

            evt.preventDefault();
            evt.stopPropagation();
            return false;
          }

          me.onNewLine.apply(me, [currentLine, currentLine + 1]);
        }
      }

      function onBackSpace(evt) {
        if(typeof me.onBackSpace !== "undefined") {
          me.onBackSpace.apply(me, [me.getCurrentLineNo()]);
        }
      }

      //handle user input by typing
      function onInput(evt) {
        if(typeof me.onInput !== "undefined") {
          if(me.ctrlKeyPressed === false && me.opts.inputEventEnabled === true) { //don't detect input on Ctrl+ events
            var currentLineNo = me.getCurrentLineNo(), //the line no
              currentLineText = me.readLine(currentLineNo), //current lines text
              currentSelectionText = me.getCurrentSelectionText(); //text up until the cursor

            me.onInput.apply(me, [currentLineText, currentSelectionText, currentLineNo]);
          }
        }
      }

      //handle paste event
      function onPaste(evt) {
        me.disableInputEvent(1); //disable onInput for 1 second

        if(typeof me.onPaste !== "undefined"){
          var data;

          //hijack: stop pasting event from continuing
          evt.preventDefault();
          evt.stopPropagation();

          //cross-browser clipboard grab
          if(evt.clipboardData && evt.clipboardData.getData) {
            data = evt.clipboardData.getData('text/plain');
          }else if (window.clipboardData && window.clipboardData.getData) {
            data = window.clipboardData.getData('Text');
          }

          //do event if data is valid
          if(data && !data.isBlank()) {
            me.onPaste.apply(me, [data]);
          }
        }
      }

      //check keycode to check if it's a keystroke we care to use
      function isValidKeyStroke(evt) {
        return !(me.opts.invalidKeyCodes.indexOf(evt.which) >= 0 || isCtrlV(evt));
      }

      //check keycode to see if it's the list of prevented keys
      function isPreventedKeyStroke(evt) {
        return (me.opts.preventedKeyCodes.indexOf(evt.which) >= 0);
      }

      //check if user copy/pasted with keyboard shortcut Ctrl+V
      function isCtrlV(evt) {
        return (evt.metaKey === true && evt.which === 86 ||
                  (me.ctrlKeyPressed === true && evt.which === 86));
      }

      //handle keydown events
      function handleKeyDown(evt) {

        if(!isValidKeyStroke(evt)){
          if(isPreventedKeyStroke(evt)){
            evt.preventDefault();
            evt.stopPropagation();
          }
          return false;
        }

        switch(evt.which) {
          case 13:
            onEnterKey(evt);
            break;
          case 17:
          case 224:
            me.ctrlKeyPressed = true; //detect ctrl key down
            break;
          default:
            break;
        }
      }

      //handle keyup events
      function handleKeyUp(evt) {
        if(!isValidKeyStroke(evt)) {
          return false;
        }

        //keep up to date for IE >:(
        me.selectionStart = me.el.selectionStart;
        me.selectionEnd = me.el.selectionEnd;

        switch(evt.which) {
          case 13: //enter key
            break;
          case 17:
          case 224:
            me.ctrlKeyPressed = false; //detect ctrl key up
            break;
          case 8:
            onBackSpace(evt); //don't break, let it continue
          default:
            onInput(evt);
            break;
        }
      }


      function handleMouseUp(evt) {
        //fix IE for pasting over highlighted text
        me.selectionStart = me.el.selectionStart;
        me.selectionEnd = me.el.selectionEnd;
      }

      this.el.addEventListener('mouseup', handleMouseUp, false);
      this.el.addEventListener('keydown', handleKeyDown, false);
      this.el.addEventListener('keyup', handleKeyUp, false);
      this.el.addEventListener('paste', onPaste, false);

    }//end constructor

    //add splice fn to String prototype
    //inserts text at a specific position in a string
    String.prototype.splice = function( idx, rem, s ) {
      return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
    };

    //add custom fn to String to check if string is a blank string
    String.prototype.isBlank = function() {
      var str = this;
      return str.replace(/(\r\n|\n|\r|\s)/g, '').length === 0;
    };

    _SuperTextArea.prototype.getLineHeight = function() {
      //return the lineheight of the text in the textarea
      //NOTE: should be cross-browser
      if (this.el.currentStyle) {
        return parseInt(this.el.currentStyle['line-height'], 10);
      } else if (window.getComputedStyle) {
        return parseInt(document.defaultView.getComputedStyle(this.el,null).getPropertyValue('line-height'));
      }
    };

    _SuperTextArea.prototype.getCursorPos = function(where) {
      //get the position of the cursor relative to the page
      //@see GetCaretPosition from services/getcaretposition.js
      var pos = this.getSelectionPosition(), //position of cursor in text area
          elPos = this.getElPos(), //position of textarea
          parentPos = this.getElParentPos(), //position of parent
          start= GetCaretPosition(this.el, pos.start), //the left of the line
          end = GetCaretPosition(this.el, pos.end); //the right of the line

      return {
        top: start.top + parentPos.top,
        left: start.left + elPos.left,
        right: end.left + parentPos.left,
        bottom: parentPos.bottom,
        height: this.getLineHeight()
      };
    };

    _SuperTextArea.prototype.getElPos = function() {
      //get the position of the textarea with respect to the page
      var range = document.createRange();
      range.selectNode(this.el);
      return range.getBoundingClientRect();
    };

    _SuperTextArea.prototype.getElParentPos = function() {
      //get the position of the parent of the textarea with respect to the page
      var range = document.createRange();
      range.selectNode(this.el.parentNode);
      return range.getBoundingClientRect();
    };

    _SuperTextArea.prototype.select = function(start, end) {
      //retrieve all text from a starting index to an ending index
      return this.getTextValue().substring(start, end);
    };

    _SuperTextArea.prototype.insertText = function(start, end, text, removeBlank) {
      //inserts text at a specific start/end position in the textarea

      if(removeBlank === true) {
        text = this._removeBlankLines(text);
      }

      this.el.value = this.el.value.splice(start, end, text);
    };

    _SuperTextArea.prototype.deleteText = function(start, end) {
      //delete text from a start/end index
      var value = this.el.value,
        length = value.length;

      this.el.value = value.substring(0, start) + value.substring(end, length);
    };

    _SuperTextArea.prototype.replaceCurrentLine = function(text) {
      //replace the current line of text with a new value
      var pos = this.getSelectionPosition(),
        currentText = this.readCurrentLine(),
        start = pos.start - currentText.length, //the cursor minus the length of the line
        end = pos.start;

      this.deleteText(start, end); //delete current line
      this.insertText(start, 0, text); //insert at beginning of line
      this.setCursor(start + text.length); //move the cursor to end of the line
    };

    _SuperTextArea.prototype.insertTextAtCurrentPosition = function(text, removeBlank) {
      //inserts text at the position of the cursor
      var pos = this.getSelectionPosition();

      if(this.hasHighlightedText()) {
        //remove selected text
        this.deleteText(pos.start, pos.end);
      }

      this.insertText(pos.start, 0, text, removeBlank);
      this.setCursor(pos.start + text.length);
    };

    _SuperTextArea.prototype.getSelectionPosition = function() {
      //return the position of the current selection
      if(AppConfig.detectedIE){
        return {start: this.selectionStart, end: this.selectionEnd};
      }
      return {start: this.el.selectionStart, end: this.el.selectionEnd};
    };

    _SuperTextArea.prototype.setCursor = function(idx) {
      //move the cursor to a specific index
      this.el.selectionStart = idx;
      this.el.selectionEnd = idx;
    };

    _SuperTextArea.prototype.hasHighlightedText = function() {
      //there is highlighted text if the current selection start/end are different
      var pos = this.getSelectionPosition();
      return (pos.start !== pos.end);
    };

    _SuperTextArea.prototype.getHighlightedText = function() {
      //get the text based on the selection start/end
      var pos = this.getSelectionPosition();
      return this.select(pos.start, pos.end);
    };

    _SuperTextArea.prototype.getCurrentLineNo = function() {
      //return the line number based on the current cursor position
      return this.select(0, this.getSelectionPosition().start).split(this.opts.newLineChar).length;
    };

    _SuperTextArea.prototype.getStartIdxOfCurrentLine = function() {
      //using the previous values, the length of the previous string will be the index of the current line
      return this.getPreviousValues(true).length;
    };

    _SuperTextArea.prototype.getEndIdxofCurrentLine = function() {
      //return the end index of the current line of text
      return this.getStartIdxOfCurrentLine() + this.readCurrentLine().length;
    };

    _SuperTextArea.prototype.getCurrentSelectionText = function() {
      //return the current text from the start of the current line to the cursor
      var start = this.getStartIdxOfCurrentLine(), //find the most recent occurrence of a new line
        pos = this.getSelectionPosition(); //current position of the cursor

      return this.select(start, pos.end).trim(); //make sure we don't include whitespace
    };

    _SuperTextArea.prototype.readLine = function(lineNo) {
      //read a specific line number
      try {
        return this.getValues()[lineNo - 1];
      }catch(err) {
        return undefined;
      }
    };

    _SuperTextArea.prototype.readCurrentLine = function() {
      //read the current line of text
      return this.readLine(this.getCurrentLineNo());
    };

    _SuperTextArea.prototype.isEmptyLine = function(lineNo) {
      //check specific line number to see if it's empty
      return this.readLine(lineNo) === undefined || this.readLine(lineNo) === '';
    };

    _SuperTextArea.prototype.isLastLine = function(lineNo) {
      //check if provided line number is the last line
      return this.getValues().length === lineNo;
    };

    _SuperTextArea.prototype.getValues = function(removeAllBlank, removeTrailingBlank) {
      //get all lines as an array

      var text = this.getTextValue(), //text value of textarea
        values;

      if(removeAllBlank === true) {
        //remove blank entries
        text = this._removeBlankLines(text);
      }

      values = text.split(this.opts.newLineChar); //convert to list

      //remove the last line if it's a blank line
      if(removeTrailingBlank === true) {
        var lastIdx = values.length - 1;

        if(values[lastIdx].isBlank()) {
          values = values.splice(0, lastIdx);
        }
      }

      return values;
    };

    _SuperTextArea.prototype.hasValues = function(removeBlank) {
      //whether or not there are values in the textarea
      return this.getValues(true, true).length > 0;
    };

    _SuperTextArea.prototype.getPreviousValues = function(asText) {
        //return all values before the current line
        var values = this.getValues().slice(0, this.getCurrentLineNo() - 1);
        return (asText === true ? values.join(this.opts.newLineChar) : values);
    },

    _SuperTextArea.prototype.getTextValue = function() {
      //return the current value of the textarea
      return this.el.value || '';
    };

    _SuperTextArea.prototype.setValues = function(values) {
      //set an array of values as the text value
      this.el.value = values.join(this.opts.newLineChar);
    };

    _SuperTextArea.prototype.each = function(applyFn) {
      var values = this.getValues(),
        val, idx;

      //loop through each line and make sure it's a value
      for(idx=0; idx<values.length; idx++) {
        val = values[idx];
        if(typeof applyFn === "function") {
          applyFn.apply(this, [val, idx]);
        }
      }
    };

    _SuperTextArea.prototype.cleanValues = function(fn, uniqueList, autoRefresh) {
      //accepts a function to clean the list of values in the textarea
      //uniqueList: boolean -- remove duplicate values
      //autoRefresh: boolean -- will update the values in the textarea after completion
      var clean = [];

      this.each(function(val) {
        if(typeof fn === "function" && fn.apply(this, [val])) {
          var newVal = fn(val);
          var indexDevice = clean.indexOf(newVal);

          if((uniqueList === true && (indexDevice < 0)) || uniqueList === false) {
            clean.push(newVal);
          }
        }
      });

      //update the UI
      if(autoRefresh === true) {
        this.setValues(clean);
      }

      return clean;
    };

    _SuperTextArea.prototype.sortValues = function(applyFn, alphaSort, autoRefresh, cleanValues, uniqueValues) {
      //sort the values by the given function
      //if cleanValues == true, getValues(true) removes blank spaces
      var values = this.getValues(cleanValues || false);

      //alpha sort
      if(alphaSort === true) {
        values = values.sort();
      }

      //apply sort fn
      if(typeof applyFn === "function") {
        values = values.sort(applyFn);
      }

      //repaint the text in the textarea
      if(autoRefresh === true) {
        this.setValues(values);
      }

      //return sorted values
      return values;
    };

    _SuperTextArea.prototype._removeBlankLines = function(text) {
      //remove blank lines from input
      var values = text.split(this.opts.newLineChar),
        clean = [], val, curr;

      //loop through each line and make sure it's a value
      for(curr=0; curr<values.length; curr++) {
        val = values[curr];
        if(val && val != '') {
          clean.push(val);
        }
      }

      return clean.join(this.opts.newLineChar);
    };

    _SuperTextArea.prototype.disableInputEvent = function(seconds) {
      //temporarily disable the input event for a particular amount of seconds
      //NOTE: useful for ignoring input event when pasting
      var me = this;
      me.opts.inputEventEnabled = false;
      setTimeout(function() {
        me.opts.inputEventEnabled = true;
      }, (seconds*1000));
      return this;
    };

    return( _SuperTextArea );
});
