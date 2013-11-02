/** Store JS*/
(function($) {
    'use strict';
    var onAjaxSuccess,
        getData,
        processData;
    /**
     * Defines the store for the grid.
     * @constructor
     * @param {object} model - A model instance created by using new Model
     * @param {object} options - An object containing a list of options
     * @returns {object} store - Returns the current store instance
     */

    function Store(model, options) {
        var defaults,
            settings,
            proxy,
            me = this;


        defaults = {
            autoLoad: true,
            /**
             * Store's load event
             * @event
             * @param {object} store - A reference to the current instance of the store
             * @param {array} data - An array of the store's records
             */
            load: function(store, data) {}
        };
        me.settings = settings = $.extend(defaults, options);
        this.model = model;


        /**
         * @method
         * @private
         */

        function init() {
            if (!(model instanceof Model)) {
                throw new Error('First parameter should be an instance of Model');
            }
            if (!settings.proxy) {
                throw new Error('Proxy is required. Example usage : proxy:{type:"ajax",url:"sample/url",root:"data"}');
            }

            proxy = settings.proxy;
            me.isStoreLoaded = false;
            me.eventMap = {};
            if (proxy.type === 'ajax') {
                if (!proxy.url) {
                    throw new Error('url is required for ajax proxy.');
                }
                me.proxy = {};
                me.proxy.type = proxy.type;
                me.proxy.url = proxy.url;
                me.proxy.root = proxy.root ? proxy.root : '';
                me.proxy.record = proxy.record ? proxy.record : '';
                me.proxy.extraParams = proxy.extraParams || {};
                me.proxy.params = proxy.params;

            } else {

                if (!proxy.data) {
                    throw new Error('data is required for memory proxy');
                }

                me.proxy = {};
                me.proxy.type = proxy.type;
                me.proxy.url = '';
                me.proxy.root = proxy.root ? proxy.root : '';
                me.proxy.record = proxy.record ? proxy.record : '';
                me.proxy.data = proxy.data;
            }

            me.id = settings.id || '_store' + new Date().getTime();
            if (settings.name) {
                me.name = settings.name;
            }

        }
        init();
        if (me.settings.autoLoad) {
            getData.call(me);
        }
    }

    /**
     * @method
     * @protected
     */

    getData = function () {
        var me = this;
        me.isStoreLoading = true;
        if (me.proxy.type === 'ajax') {
            $.ajax(me.proxy.url, {
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: $.extend(me.proxy.extraParams, me.proxy.params),
                success: function(data) {
                    if (typeof data === 'string'){
                        data = JSON.parse(data);
                    }
                    me.isStoreLoaded = true;
                    me.isStoreLoading = false;
                    onAjaxSuccess.call(me, data);
                },
                failure: onAjaxFailure
            });
        } else {
            me.isStoreLoaded = true;
            me.isStoreLoading = false;
            processData.call(me, me.proxy.data);
        }

    };

    /**
     * @method
     * @protected
     * @param {object} data - The response data if XHR succeeds
     */

    onAjaxSuccess = function (data) {
        var rootData = $.extend({}, data),
            recordData,
            root,
            idx = -1,
            me = this;

        root = me.proxy.root;
        if (root.indexOf('[') >= 0) {
            idx = root.substring(root.indexOf('[') + 1, root.indexOf(']'));
            idx = parseInt(idx,110);
            root = root.substring(0, root.indexOf('['));
        }
        rootData = root ? data[root] : data;
        if (idx >= 0) {
            rootData = rootData[idx];
        }

        if ($.isEmptyObject(rootData)) {
            throw new Error('Invalid root');
        } else if (me.proxy.record) {
            recordData = rootData[me.proxy.record];
            if ($.isEmptyObject(recordData)) {
                throw new Error('Invalid record object');
            }
        } else {
            recordData = rootData;
        }
        me.rawData = data;

        processData.call(me, recordData);
    };

    /**
     * @method
     * @protected
     * @param {object} resp - The response data on XHR failure
     */

    function onAjaxFailure(resp) {
        throw new Error(resp);

    }

    /**
     * @method
     * @protected
     * @param {object} data - The data retrieved from the AJAX request
     */

    processData = function (data) {
        var me = this,
            model = me.model,
            rawData = data,
            fields = model.fields,
            i, j, k, l,
            dataObj,
            tmpObj,
            storeData = [],
            sorters;

        l = fields.length;

        for (i = 0, j = rawData.length; i < j; i++) {
            dataObj = rawData[i];
            tmpObj = model.create(dataObj);
            tmpObj.recordId = 'Record-' + model.modelId.replace('_model', '') + '-' + i;

            if (model.hasMany && tmpObj.data[model.hasMany.mapping]) {
                tmpObj[model.hasMany.mapping + 'Store'] = new Store(model.hasMany.model || model, {
                    proxy: {
                        type: 'memory',
                        data: tmpObj.data[model.hasMany.mapping]
                    }
                });
            }
            storeData.push(tmpObj);
        }
        me.data = storeData;
        me.count = j;
        if (me.settings.sorters) {
            sorters = me.settings.sorters;
            for (k = 0, l = sorters.length; k < l; k++) {
                me.sort(sorters[k].field, sorters[k].dir);
            }
        }
        me.settings.load.call(me, me, me.data);
        me.trigger('load', [me, me.data]);
    };
    /*
     * Store extends EventListener
     */
    Store.prototype = new EventListener();
    Store.prototype.constructor = Store;

    /**
     * This method can be used to reload the store by making a new request to the server, optionally providing a new url and params
     * @method
     * @public
     * @param {string} url - The new url for loading the store
     * @param {object} params - The new set of paramaters to be sent along with the request for loading the store
     */
    Store.prototype.load = function(url, params) {
        var args = Array.prototype.slice.call(arguments);
        this.isStoreLoading = true;
        if (args.length === 1 && typeof args[0] !== 'string' && args[0].constructor.toString().match(/^Object$/g) && args[0].constructor.toString().match(/^Object$/g)[0] === 'Object') {
            this.proxy.params = params;
            getData.call(this);
            return;
        }
        if (url) {
            this.proxy.url = url;
        }
        if (params) {
            this.proxy.params = params;
        }
        this.isStoreLoaded = false;
        getData.call(this);
    };

    /**
     * This method can be used to sort the store
     * @method
     * @public
     * @param {string} field - The field name with respect to which the sorting needs to be done
     * @param {string} direction - The direction of sorting 'ASC' or 'DESC'
     */

    Store.prototype.sort = function(field, direction) {
        if (!field) {
            throw new Error('Fieldname is required.');
        }
        if (!this.data || this.data.length === 0) {
            return;
        }
        if (direction === 'DESC') {
            this.data.sort(function(a, b) {
                if (a[field] < b[field]) {
                    return 1;
                } else if (a[field] > b[field]) {
                    return -1;
                } else {
                    return 0;
                }
            });
        } else {
            this.data.sort(function(a, b) {
                if (a[field] > b[field]) {
                    return 1;
                } else if (a[field] < b[field]) {
                    return -1;
                } else {
                    return 0;
                }
            });
        }

    };

    /**
     * This method returns the proxy object used by the store.
     * @returns {object} proxy - The proxy object
     */

    Store.prototype.getProxy = function() {
        return this.settings.proxy;
    };

    /**
     * This method can be used to add a row to the store. Only one row can be added at a time.
     * @method
     * @public
     * @param {object} row - The row to be inserted
     */
    Store.prototype.add = function(row) {
        var _row = this.model.create(row),
            model = this.model;
        this.count++;
        this.data.push(_row);
        _row.recordId = 'Record-' + model.modelId.replace('_model', '') + '-' + this.count;

        if (model.hasMany && _row.data[model.hasMany.mapping]) {
            _row[model.hasMany.mapping + 'Store'] = new Store(model.hasMany.model || model, {
                proxy: {
                    type: 'memory',
                    data: row[model.hasMany.mapping]
                }
            });
        }

        return _row;
    };

    /**
     * This method can be used to add a row to the store at a given index. Only one row can be added at a time.
     * @method
     * @public
     * @param {object} row - The row to be inserted
     * @param {integer} index - The position at which to be inserted
     */
    Store.prototype.insertAt = function(row, index) {
        var numIdx = parseInt(index, 10),
            _row = this.model.create(row),
            model = this.model;
        if (isNaN(numIdx) || numIdx > this.count) {
            return false;
        }
        this.data.splice(index, 0, this.model.create(row));
        this.count++;
        _row.recordId = 'Record-' + model.modelId.replace('_model', '') + '-' + index;

        if (model.hasMany && _row.data[model.hasMany.mapping]) {
            _row[model.hasMany.mapping + 'Store'] = new Store(model.hasMany.model || model, {
                proxy: {
                    type: 'memory',
                    data: row[model.hasMany.mapping]
                }
            });
        }
        return row;
    };

    /**
     * This method can be used to add a row to the store at a given index. Only one row can be added at a time.
     * @method
     * @public
     * @param {function} fn - The value of each row is passed to this function. The first row to return true is removed
     */
    Store.prototype.remove = function(fn) {
        var data, i, j, target;
        data = this.data;
        if (this.data.length === 0) {
            return false;
        }
        for (i = 0, j = data.length; i < j; i++) {
            if (fn(data[i])) {
                this.count--;
                return this.data.splice(i, 1);
            }
        }
    };

    /**
     * This method can be used to remove a row from the store at a given index. Only one row can be removed at a time.
     * @method
     * @public
     * @param {integer} index - Index of the row to be removed
     */
    Store.prototype.removeAt = function(index) {
        var tmp;
        if (this.data.length === 0) {
            return false;
        }
        tmp = this.data.splice(index, 1);
        if (tmp.length > 0) {
            this.count--;
        }
        return tmp;

    };

    /**
     * This method can be used to remove all rows from the store.
     * @method
     * @public
     * @returns {array} rows - The rows removed
     */
    Store.prototype.removeAll = function() {
        var data = this.data;
        this.count = 0;
        return data.splice(0, data.length);
    };

    /**
     * This method returns the object at a given index
     * @method
     * @public
     * @param {integer} index - Index of the row to be retrieved
     */
    Store.prototype.getAt = function(index) {
        return this.data[index];

    };

    /**
     * This method is used to iterate through a store
     * @method
     * @public
     * @param {function} iterator - The iterator function
     */
    Store.prototype.each = function(iterator) {
        var data = this.data,
            i, j;
        for (i = 0, j = data.length; i < j; i++) {
            if (iterator.call(this, i, data[i]) === false) {
                break;
            }
        }
    };

    /**
     * This method is used to find a record within a store
     * @method
     * @public
     * @param {string} field - The name of the field to search with
     * @param {string} value - The value of the field to search with
     * @param {boolean} caseSensitive - If set to true performs a case sensitive match, defaults to false
     * @param {boolean} anyMatch - If set to true finds a string even if a substring match is true, defaults to false
     * @returns {object} record - The record instance or null
     */
    Store.prototype.find = function(field, value, caseSensitive, anyMatch) {
        var row = null,
            isCaseSensitive = (caseSensitive === true) || false,
            isAnyMatch = (anyMatch === true) || false,
            regEx,
            _val;

        if (typeof value !== 'string' || value.constructor.toString().match(/String/g)[0] !== 'String') {
            throw new Error('Only fields containing a string can be used for searching.');
        }
        if (isCaseSensitive && !isAnyMatch) {
            regEx = new RegExp('^' + value + '$');
        } else if (!isCaseSensitive && isAnyMatch) {
            regEx = new RegExp(value, 'i');
        } else if (isCaseSensitive && isAnyMatch) {
            regEx = new RegExp(value);
        } else {
            regEx = new RegExp('^' + value + '$', 'i');
        }
        this.each(function(i, val) {
            _val = val.get(field);
            if (regEx.test(_val)) {
                row = val;
                return false;
            }
        });
        return row;
    };

    /**
     * This method is used to find a record within a store using the record id
     * @method
     * @public
     * @param {string} id - The id of the field to search with
     * @returns {object} record - The record instance or null
     */
    Store.prototype.findById = function(id) {
        var row = null;
        this.each(function(i, val) {
            if (val.recordId === id) {
                row = val;
                return false;
            }
        });
        return row;
    };



    window.Store = Store;
}(jQuery));