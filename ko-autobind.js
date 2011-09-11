// Knockout AutoBind V0.0.0
// (c) 2011  Tom Thorp https://github.com/phototom/ko-autobind
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

 (function(){
    ko.autoBind = {};
               
    function _createBinding(element, modelName, bindingType){
        var databindContents = $(element).attr('data-bind');
        if(databindContents){
            // look for binding type already present
            // reg-ex pattern is <bindingType> + <0 or more spaces> + <:>
            // Generated regex example = "value(\s*):"
            var testPattern = bindingType + '(\s*)';
            var patternPresent = databindContents.search(testPattern);
            // binding type already present, so skip step
            if(patternPresent >= 0)
                return;

        }
        
        var nameContents = $(element).attr('name');
        databindContents = bindingType + ': ' + modelName + nameContents + ' ';
        
        $(element).attr('data-bind', databindContents);
    };
    
    ko.autoBind.basic = function(searchElement, modelName){
        // initial search.
        // look for elements that have a 'name' attribute and not any with 'data-bind-noauto' attribute
        var basicSearch = $(searchElement + ' *[name]');
        // not:[data-bind-noauto]');
        
        $(basicSearch).each(function(){
            // test to see if user is requesting that this field not receive a binding
            if($(this).attr('data-bind-noauto'))
                return;
            
            if($(this).is('input')){
                var elementType = $(this).attr('type');
                elementType = elementType.toLowerCase();
                
                if('hidden' === elementType){
                    ///--------------------------------------------------------------------------
                    // asp.net mvc fix 
                    //
                    //  asp.net/mvc will automatically add a hidden field to each checkbox
                    //  so if there is a checkbox with the same name as this hidden field,
                    //  don't add a binding to this hidden field.
                    var cbFound = $(basicSearch).find('[type="checkBox"] [name="' + $(this).attr('name') + '"]')
                    ///--------------------------------------------------------------------------
                    if( ! cbFound)
                        _createBinding(this, modelName, 'value');
                }
                else if('checkbox' === elementType || 'radio' === elementType){
                    _createBinding(this, modelName, 'checked');
                }
                else{
                    _createBinding(this, modelName, 'value');
                }
            }
            else if($(this).is('select')){
                _createBinding(this, modelName, 'value');
            }
            else{
                _createBinding(this, modelName, 'text');
            }
            
        })
    }
    
})();