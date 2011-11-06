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
    var mvcFixup = true;
    var nameStack;
    var mappingArray = {};


    //     var OptionStructure = {
    //        elementType: 'select',
    //        cssClass: 'className',
    //        inputType: 'input type'    // this is a short cut for using elementType, attrName & attrValue for <input type='xxx'>
    //        atrrName: 'atrrName',      // required
    //        attrValue: 'attrValue',          // optional.  If not present checks if attribute defined
    //        bindingType: 'datePicker', // bindingType or noBindToThisValue is required
    //        noBindToThisValue : 1   // If both are present, bindingType takes precedence
    //     }

    // Any edits to this will be applied to ALL bindings in the web site
    var defaultoptionsArray = [{
        inputType: 'checkbox',
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
            // by not putting any type here, it will automatically
            // add a text binding to anything element with a name attribute
            // if this doesn't meet your needs, the
            //elementType: 'xxx',
            bindingType: 'text'
        }];

    var mvc3Specials = [{
        inputType: 'hidden',
        attrName: 'name',
        attrValue: '__RequestVerificationToken',
        noBindToThisValue: true
    }, {
        inputType: 'hidden',
        check4MvcCheckboxHidden: true,
        noBindToThisValue: true
    }];
    var localTypeOf = function (value) {
        var s = typeof value;
        if (s === 'object') {
            if (value) {
                if (value instanceof Array) {
                    s = 'array';
                }
            } else {
                s = 'null';
            }
        }
        return s;
    };


    function isObject(x) {
        var t = localTypeOf(x);
        return t === 'object';
    }

    function isArray(x) {
        var t = localTypeOf(x);
        return t === 'array';
    }

    function createBinding(element, nameContents, singleOption) {
        if (singleOption.noBindToThisValue) {
            return;
        }
        var bindingType = singleOption.bindingType;
        var databindContents = $(element).attr('data-bind');
        var localDataBinding = bindingType + ': ' + localModelPrefix + nameContents;
        if (databindContents) {

            // look for binding type already present
            // reg-ex pattern is <bindingType> + <0 or more spaces> + <:>
            // Generated regex example = "value(\s*):"
            var testPattern = bindingType + '(\s*)';
            var patternPresent = databindContents.search(testPattern);

            // binding type already present, so skip step
            if (patternPresent >= 0)
                return;
            databindContents = localDataBinding + ', ' + databindContents;
        } else {
            databindContents = localDataBinding;
        }

        $(element).attr('data-bind', databindContents);
    }

    var checkIfBindable = function (elementJquery, singleOption, elementAttr) {

        var elementType, typeOfInput
        if (singleOption.inputType) {
            elementType = 'input';
            typeOfInput = singleOption.inputType;
        } else {
            elementType = singleOption.elementType;
        }

        var testAttr = singleOption.attrName;
        var testAttrValue = singleOption.attrValue;

        var elementTypeMatch = elementType === elementJquery.get(0).tagName.toLowerCase();
        // check type of input
        if (elementTypeMatch && typeOfInput) {
            elementTypeMatch = elementJquery.attr('type').toLowerCase() === typeOfInput;
        }

        //
        // see if we should do MVC3 fixup for hidden fields with checkbox
        //
        if (mvcFixup) {
            if (elementAttr.hiddenInput) {
                ///--------------------------------------------------------------------------
                // asp.net mvc fix 
                //
                //  asp.net/mvc will automatically add a hidden field to each checkbox
                //  so if there is a checkbox with the same name as this hidden field,
                //  don't add a binding to this hidden field.
                //
                var testName = elementAttr.elementName;
                for (var findCb = 0; findCb < basicSearch.length; findCb++) {
                    var localCb = $(basicSearch[findCb]).attr('type');
                    if ('checkbox' === localCb) {
                        if (testName === $(basicSearch[findCb]).attr('name')) {
                            return undefined != singleOption.check4MvcCheckboxHidden;
                        }
                    }
                }
            }
        }

        var attrFound;
        if (testAttr) {
            // check if attribute = class
            if ('class' === testAttr) {
                attrFound = elementJquery.hasClass(testAttrValue);
            } else {
                // check for while card match
                if ('*' !== testAttrValue) {
                    attrFound = testAttrValue === elementJquery.attr(testAttr);
                } else {
                    attrFound = undefined !== elementJquery.attr(testAttr);
                }
            }
        }

        var classFound;
        var testClass = singleOption.cssClass;
        if (testClass) {
            classFound = elementJquery.hasClass(testClass);
        }

        var debugVar = (undefined === elementType) || elementTypeMatch;
        debugVar = debugVar && ((undefined === testAttr) || attrFound);
        var found = debugVar && ((undefined === testClass) || classFound);

        return found;

    };
    var checkElementOptions = {
        isInput: {},
        elementName: {},
        elementType: {},
        inputType: {},
        hiddenInput: {},
        init: function (elementJquery) {
            this.isInput = elementJquery.is('input');
            this.elementName = elementJquery.attr('name');
            this.elementType = elementJquery.get(0).tagName.toLowerCase(),
            this.inputType = elementJquery.attr('type');
            this.hiddenInput = this.isInput && 'hidden' === this.inputType;
            return this;
        }
    };

    function scanOptionsForBinding(options, checkOnlyHidden) {
        var l = basicSearch.length;
        for (var iOuter = 0; iOuter < l; iOuter++) {
            if (!elementBound[iOuter]) {
                var elementType = basicSearch[iOuter];
                var elementJquery = $(elementType);
                var elementAttr = checkElementOptions.init(elementJquery);
                if (!checkOnlyHidden || elementAttr.hiddenInput) {

                    var l1 = options.length;
                    for (var i = 0; i < l1; i++) {
                        var singleOption = options[i];
                        var isBindable = checkIfBindable(elementJquery, singleOption, elementAttr);
                        if (isBindable) {
                            createBinding(elementJquery, elementAttr.elementName, singleOption);
                            elementBound[iOuter] = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    //    function createBindingViewModel(element, nameContents, singleOption, viewModelName) {
    //        if (singleOption.noBindToThisValue)
    //            return;
    //        var bindingType = singleOption.noBindToThisValue;
    //        var databindContents = $(element).attr('data-bind');
    //        var localDataBinding = bindingType + ': ' + viewModelName;
    //        if (databindContents) {

    //            // look for binding type already present
    //            // reg-ex pattern is <bindingType> + <0 or more spaces> + <:>
    //            // Generated regex example = "value(\s*):"

    //            var testPattern = bindingType + '(\s*)';
    //            var patternPresent = databindContents.search(testPattern);

    //            // binding type already present, so skip step
    //            if (patternPresent >= 0)
    //                return;
    //            databindContents = localDataBinding + ', ' + databindContents;
    //        } else {
    //            databindContents = localDataBinding;
    //        }

    //        $(element).attr('data-bind', databindContents);
    //    }

    function lookupNameInDictionary(elementName) {
        var d = mappingArray[elementName];
        return d;

    }

    function scanOptionsForBindingViewModel(options) {
        var l = basicSearch.length;
        for (var iOuter = 0; iOuter < l; iOuter++) {
            if (!elementBound[iOuter]) {

                var elementType = basicSearch[iOuter];
                var elementJquery = $(elementType);
                var elementAttr = checkElementOptions.init(elementJquery);

                var l1 = options.length;
                for (var i = 0; i < l1; i++) {
                    var singleOption = options[i];
                    var isBindable = checkIfBindable(elementJquery, singleOption, elementAttr);
                    if (isBindable) {
                        var fndName = lookupNameInDictionary(elementAttr.elementName);
                        createBinding(elementType, fndName, singleOption);
                        elementBound[iOuter] = true;
                        break;
                    }
                }
            };
        }
    }

    var currentLevel = undefined;
    var totalSearch = undefined;
    var listItem = function (bindingLevelText) {
        this.bindingLevelText = bindingLevelText;
        this.propList = undefined;
        this.addChild = function (newLevelText) {
            if (!this.propList)
                this.propList = new Array();
            var newItem = new listItem(newLevelText);
            this.propList.push(newItem);
            return newItem;
        };
    };
    var vmPropNames = new listItem('root');
    var buildPropertyList = function (viewModel, propNameList, recursive) {
        if (!recursive) {
            currentLevel = 0;
            totalSearch = 0;
        }
        // check level of recursion.  If too far, exit just to prevent infinite loop
        if (currentLevel > 10)
            return;
        currentLevel = currentLevel + 1;
        for (var property in viewModel) {
            if (property.indexOf('__') < 0 && viewModel.hasOwnProperty(property)) {
                totalSearch = totalSearch + 1;
                var isObserable = ko.isObservable(viewModel[property]);
                var newItem;
                if (isObserable) {
                    // unwrap the observable and see if anything 
                    var unWrapped = viewModel[property]();
                    if (ko.isObservable(unWrapped)) {
                        // this is an observable, so unwrap it
                        unWrapped = unWrapped();
                        if (!isObject(unWrapped)) {
                            propNameList.addChild(property + '()');
                        } else {
                            newItem = propNameList.addChild(property + '()');
                            buildPropertyList(unWrapped, newItem, true);
                        }
                    } else if (!isArray(viewModel[property])) {
                        if (isObject(unWrapped)) {
                            newItem = propNameList.addChild(property + '()');
                            buildPropertyList(unWrapped, newItem, true);
                        } else {
                            propNameList.addChild(property);
                        }
                    }
                } else {
                    if (isObject(viewModel[property]) && !isArray(viewModel[property])) {
                        newItem = propNameList.addChild(property);
                        buildPropertyList(viewModel[property], newItem, true);
                    }
                }
            }
        }
        currentLevel = currentLevel - 1;
    };

    var buildNameDictionary = function (itemList, reCursive) {
        if (!reCursive) nameStack = new Array();
        var i;

        var l = itemList.propList.length;
        for (i = 0; i < l; i++) {
            var v = itemList.propList[i]; //.bindingLevelText;
            if (v.propList) {
                nameStack.push(v.bindingLevelText);
                buildNameDictionary(v, true);
                //console.log(v + ' --- ' + nameStack);
                nameStack.pop();
            } else {

                var outputName = v.bindingLevelText;
                var i1;
                for (i1 = nameStack.length - 1; i1 >= 0; i1--) {
                    outputName = nameStack[i1] + '.' + outputName;
                }
                var checkName = v.bindingLevelText;

                if (i1 >= 0) {
                    checkName = nameStack[i1] + '.' + checkName;
                }
                checkName = checkName.replace('()', '');
                mappingArray[checkName] = outputName;
                for (i1 = nameStack.length - 1; i1 >= 0; i1--) {
                    checkName = nameStack[i1] + '.' + checkName;
                    checkName = checkName.replace('()', '');
                    if (mappingArray[checkName])
                        throw 'Duplicate name definition.  Name = [' + checkName + '].  Existing mapped value = ['
                            + mappingArray[checkName] + '].  New mapping value = [' + outputName + ']';
                    mappingArray[checkName] = outputName;
                    //console.log(checkName + '  --  ' + outputName);
                }
            }
        }

    };


    ko.autoBind.byName = function (selector, modelPrefix, optionsArray) {

        /// <summary>
        /// this performs the basic auto-binding functionality.
        /// it will look for all elements contained inside of selector that have a name attribute.
        ///  --------------------------------------------------------------------------------------------
        ///  Warning - While this code is very fast in it's operation, it will generate a binding for every element,
        ///            even if there is not a property in the viewModel.  But as most viewModels and Views have a 
        ///            one-to-one correspondence between form elements and viewModel properties, this is not 
        ///            normally an issue.
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
        ///  </summary>
        ///  <param name="selector" type="String">
        ///     A string containing a jQuery selector expression
        /// </param>
        /// <param name="modelPrefix" type="String">
        ///   string representing any prefix to add to element name attribute to generate
        ///   data-binding parameter.
        /// </param>
        /// <param name="optionsArray" type="array of OptionStructure">
        ///  array of personalized custom options for controlling binding.
        /// </param>
        //  --------------------------------------------------------------------------------------------
        //  --------------------------------------------------------------------------------------------
        //  --------------------------------------------------------------------------------------------

        localModelPrefix = modelPrefix;

        //                                     
        // initial search.
        // look for elements that have a 'name' attribute and not any with 'data-bind-noauto' attribute

        basicSearch = $(selector + ' *[name]');

        var l = basicSearch.length;
        for (var i = 0; i < l; i++) {
            elementBound[i] = false;
        }
        if (mvcFixup)
            scanOptionsForBinding(mvc3Specials, true);

        if (optionsArray) {
            if (undefined !== optionsArray && undefined === optionsArray.length)
                throw "'optionsArray' must be an array";
            scanOptionsForBinding(optionsArray);
        }
        // use the built in bindings
        scanOptionsForBinding(defaultoptionsArray);
    };
    ko.autoBind.byViewModel = function (selector, viewModel, optionsArray) {

        /// <summary>
        /// this performs the basic auto-binding functionality.
        /// it will look for all elements contained inside of selector that have a name attribute and see if
        /// a correspondingly named element exists in the viewModel.
        ///  --------------------------------------------------------------------------------------------
        ///  Warning - While this code is is always slower than the byName function because 
        ///            the viewModel has to be scanned first.  This function is useful if 
        ///            there are problems with doing data-binding byName
        ///  --------------------------------------------------------------------------------------------
        /// this routine will generate a binding by 
        ///    1 - Scan viewModel for binable properties.
        ///    2 - Looking at the html element type for correct ko binding type
        ///    3- Check to make sure that data-binding of this type doesn't already exist on this element.  If a data-binding
        ///       does exist, then this element is skipped.
        ///    4- Create name to bind to by "prepending" modelPrefix with element's name attribute value.  
        ///    5 - add data-bind attribute.
        /// -----------------------------------------------------
        ///  Example  for using  viewmodel.editData.myModel
        ///  ko.autoBind.basic('#container', viewModel');
        ///    for element <input type='text' name='important' value='42' />
        ///    This function would generate <input type='text' name='important' value='42' data-bind = ' value: editData.myModel.important />
        /// </summary>
        ///  <param name="selector" type="String">
        ///     A string containing a jQuery selector expression
        /// </param>
        /// <param name="viewModel" type="object">
        ///   string representing any prefix to add to element name attribute to generate
        ///   data-binding parameter.
        /// </param>
        /// <param name="optionsArray" type="array of OptionStructure">
        ///  array of personalized custom options for controlling binding.
        /// </param>
        //  --------------------------------------------------------------------------------------------
        //  --------------------------------------------------------------------------------------------
        //  --------------------------------------------------------------------------------------------


        localModelPrefix = ' ';
        if (!isObject(viewModel))
            throw 'ko.autoBind.byViewModel -- viewModel is not type object';

        //buildPropertyListConcept(viewModel);
        buildPropertyList(viewModel, vmPropNames);
        console.log('total searches ' + totalSearch);
        console.log(vmPropNames);
        buildNameDictionary(vmPropNames);
        for (var property in mappingArray) {
            if (property.indexOf('__') < 0 && mappingArray.hasOwnProperty(property)) {
                console.log(property + ' ... ' + mappingArray[property]);
            }
        }
        //        return;
        //                                     
        // initial search.
        // look for elements that have a 'name' attribute and not any with 'data-bind-noauto' attribute

        basicSearch = $(selector + ' *[name]');
        var l = basicSearch.length;
        for (var i = 0; i < l; i++) {
            elementBound[i] = false;
        }
        if (mvcFixup)
            scanOptionsForBindingViewModel(mvc3Specials, true);

        if (optionsArray) {
            if (undefined !== optionsArray && undefined === optionsArray.length)
                throw "'optionsArray' must be an array";
            scanOptionsForBindingViewModel(optionsArray);
        }

        scanOptionsForBindingViewModel(defaultoptionsArray);

    }; // this is on by default to fix problem with ASP.Net BVC
    ko.autoBind.MvcFixup = function (setValue) {
        mvcFixup = setValue;
    };
})();