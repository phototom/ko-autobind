// Knockout AutoBind V0.0.0
// (c) 2011  Tom Thorp https://github.com/phototom/ko-autobind
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function () {
    ko.autoBind = {};
    //
    //  ko.autobind Global variables
    //

    var elementBound = [];
    var basicSearch = [];
    var localModelPrefix = {};

    //     var OptionStructure = {
    //        elementType: 'select',
    //        class: 'className',
    //        inputType: 'input type'    // this is a short cut for using elementType, attrName & attrValue for <input type='xxx'>
    //        atrrName: 'atrrName',      // required
    //        attrValue: 'attrValue',          // optional.  If not present checks if attribute defined
    //        bindingType: 'datePicker', // bindingType or noBindToThisValue is required
    //        noBindToThisValue : 1   // If both are present, bindingType takes precedence
    //     }

    // Any edits to this will be applied to ALL bindings in the web site
    var defaultoptionsArray = [{
        elementType: 'input',
        attrName: 'type',
        attrValue: 'checkbox',
        bindingType: 'checked'
    },
    {
        inputType: 'radio',
        bindingType: 'checked'
    },
    {
        inputType: 'submit',
        noBindToThisValue: '1'
    },
    {
        // any input type not previously specified will get value type
        elementType: 'input',
        bindingType: 'value'
    },
    {
        elementType: 'select',
        bindingType: 'value'
    },
    {
        elementType: 'textarea',
        bindingType: 'value'
    },
    {
        // by not putting any time here, it will automatically
        // add a text binding to anything element with a name attribute
        // if this doesn't meet your needs, the
        //elementType: 'xxx',
        bindingType: 'text'
    }];

    function createBinding(element, nameContents, bindingType) {
        var databindContents = $(element).attr('data-bind');
        if (databindContents) {

            // look for binding type already present
            // reg-ex pattern is <bindingType> + <0 or more spaces> + <:>
            // Generated regex example = "value(\s*):"
            var testPattern = bindingType + '(\s*)';
            var patternPresent = databindContents.search(testPattern);

            // binding type already present, so skip step
            if (patternPresent >= 0)
                return;

        }

        databindContents = bindingType + ': ' + localModelPrefix + nameContents + ' ';
        $(element).attr('data-bind', databindContents);
    };

    function getType(x) {
        if ((x) && (typeof (x) === "object") && (x.constructor == (new Date).constructor))
            return "date";
        return typeof x;
    }


    var checkIfBindable = function (element, singleOption) {

        var inputType = singleOption.inputType;

        if (inputType) {
            var testElement = 'input';
            var testAttr = 'type';
            var testAttrValue = inputType;
        }
        else {
            testElement = singleOption.elementType;
            testAttr = singleOption.attrName;
            testAttrValue = singleOption.attrValue;
        };

        if (testElement) {
            var elementTypeMatch = $(element).is(testElement);
        };
        if (testAttr) {
            var attrFound = testAttrValue === $(element).attr(testAttr);
        };

        var testClass = singleOption.className;
        if (testClass) {
            var classFound = $(element).hasClass(testClass);
        };

        var debugVar = (undefined === testElement) || elementTypeMatch;
        debugVar = debugVar && (undefined === testAttr) || attrFound;
        var found = debugVar && (undefined === testClass) || classFound;

        if (!found)
            return false;
        // found item we were looking for
        // check to see if requesting no-binding
        return undefined === singleOption.noBindToThisValue
    }


    function scanOptionsForBinding(options) {
        for (var iOuter = 0; iOuter < basicSearch.length; iOuter++) {
            if (!elementBound[iOuter]) {
                var testElement = basicSearch[iOuter];
                var elementName = $(testElement).attr('name');
                for (var i = 0; i < options.length; i++) {
                    var singleOption = options[i];
                    var isBindable = checkIfBindable(testElement, singleOption);
                    if (isBindable) {
                        createBinding(testElement, elementName, singleOption.bindingType);
                        elementBound[iOuter] = true;
                        break;
                    }

                }
            }
        };
    };
    ko.autoBind = function (selector, modelPrefix, optionsArray) {
        /// <summary>
        /// this performs the basic auto-binding functionality.
        /// it will look for all elements contained inside of selector that have a name attribute.
        ///  --------------------------------------------------------------------------------------------
        ///  Warning - this code is fairly simplistic in it's operation, it will generate a binding for every element,
        ///            even if there is not one in viewModel.  
        ///  --------------------------------------------------------------------------------------------
        /// this routine will generate a binding by 
        ///    1 - Looking at the html element type for correct ko binding type
        ///    2- Check to make sure that data-binding of this type doesn't already exist on this element.  If a data-binding
        ///       does exist, then this element is skipped.
        ///    3- Create name to bind to by "prepending" modelPrefix with element's name attribute value.  
        ///    4 - add data-bind attribute.
        /// -----------------------------------------------------
        ///  Example  for using  viewmodel.editData.myModel
        ///  ko.autoBind.basic('#container', 'editData.myModel');
        ///    for element <input type='text' name='important' value='42' />
        ///    This function would generate <input type='text' name='important' value='42' data-bind = ' value: editData.myModel.important />
        /// </summary>
        ///  <param name="selector" type="String">
        ///     A string containing a jQuery selector expression
        /// </param>
        /// <param name="modelPrefix" type="String">
        ///   string representing any prefix to add to element name attribute to generate
        ///   data-binding parameter.
        /// </param>
        /// <param name="optionsArray" type= array of OptionStructure>
        ///  array of personalized custom options for controlling binding.
        /// </param>
        /// <returns nothing />
        //  --------------------------------------------------------------------------------------------
        //  --------------------------------------------------------------------------------------------
        //  --------------------------------------------------------------------------------------------

        localModelPrefix = modelPrefix;

        //                                     
        // initial search.
        // look for elements that have a 'name' attribute and not any with 'data-bind-noauto' attribute

        basicSearch = $(selector + ' *[name]');

        for (var i = 0; i < basicSearch.length; i++) {
            elementBound[i] = false;
        }

        if (optionsArray) {
            if (undefined !== optionsArray && undefined === optionsArray.length)
                throw "'optionsArray' must be an array";
            scanOptionsForBinding(optionsArray);
        }
        scanOptionsForBinding(defaultoptionsArray);

    }

})();