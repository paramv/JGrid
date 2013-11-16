/** Store JS*/
(function($) {
    'use strict';
    var Utils,generateUUID,Class,EventListener,Store,Model;
    Utils = JGrid.Utils;
    generateUUID = Utils.generateUUID;
    Class = Utils.Class;
    EventListener = JGrid.EventListener;
    Model = JGrid.Model;


    /**
     * Defines the store for the grid.
     * @constructor
     * @param {object} model - A model instance created by using new Model
     * @param {object} options - An object containing a list of options
     * @returns {object} store - Returns the current store instance
     */

    Store = EventListener.extend({
        init: function(model, options) {
            var defaults,
                settings,
                proxy,
                me = this;


            defaults = {
                load: function(store, data) {}
            };
            me.settings = settings = $.extend(defaults, options);
            me.model = model;
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
                me.isStoreLoaded = true;
                me.isStoreLoading = false;
                me.__onAjaxSuccess( me.proxy.data);
            }

            me.id = settings.id || '_store' + generateUUID();
            if (settings.name) {
                me.name = settings.name;
            }
            me.sorters = settings.sorters;
            me.filter = settings.filter || {};

        },
        /**
         * @method
         * @protected
         */

        __getData: function() {
            var me = this;
            me.isStoreLoading = true;
            if (me.proxy.type === 'ajax') {
                $.ajax(me.proxy.url, {
                    type: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: $.extend(me.proxy.extraParams, me.proxy.params),
                    success: function(data) {
                        if (typeof data === 'string') {
                            data = JSON.parse(data);
                        }
                        me.isStoreLoaded = true;
                        me.isStoreLoading = false;
                        me.__onAjaxSuccess( data);
                    },
                    failure: me.__onAjaxFailure
                });
            } else {
                me.isStoreLoaded = true;
                me.isStoreLoading = false;
                me.__processData(me.proxy.data);
            }

        },
        /**
         * @method
         * @protected
         * @param {object} data - The response data if XHR succeeds
         */

        __onAjaxSuccess: function(data) {
            var rootData = $.extend({}, data),
                recordData,
                root,
                idx = -1,
                me = this;

            root = me.proxy.root;
            if (root.indexOf('[') >= 0) {
                idx = root.substring(root.indexOf('[') + 1, root.indexOf(']'));
                idx = parseInt(idx, 110);
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

            me.__processData(recordData);
        },
        /**
         * @method
         * @protected
         * @param {object} resp - The response data on XHR failure
         */

        __onAjaxFailure: function(resp) {
            throw new Error(resp);

        },
        /**
         * @method
         * @protected
         * @param {object} data - The data retrieved from the AJAX request
         */

        __processData: function(data) {
            var me = this,
                model = me.model,
                rawData = data,
                fields = model.fields,
                i, j, k, l,
                dataObj,
                tmpObj,
                storeData = [];

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
            if (me.sorters) {
                $.each(me.sorters, function(key, value) {
                    me.sort(key, value, true);
                });
            }
            me.settings.load.call(me, me, me.data);
            me.trigger('load', [me, me.data]);
        },
        /**
         * This method can be used to reload the store by making a new request to the server, optionally providing a new url and params
         * @method
         * @public
         * @param {string} url - The new url for loading the store
         * @param {object} params - The new set of paramaters to be sent along with the request for loading the store
         */
        load: function(url, params) {
            var args = Array.prototype.slice.call(arguments);
            this.isStoreLoading = true;
            if (args.length === 1 && typeof args[0] !== 'string' && args[0].constructor.toString().match(/^Object$/g) && args[0].constructor.toString().match(/^Object$/g)[0] === 'Object') {
                this.proxy.params = params;
                this.__getData();
                return;
            }
            if (url) {
                this.proxy.url = url;
            }
            if (params) {
                this.proxy.params = params;
            }
            this.isStoreLoaded = false;
            this.__getData();
            return this;
        },
        /**
         * This method can be used to sort the store
         * @method
         * @public
         * @param {string} field - The field name with respect to which the sorting needs to be done
         * @param {string} direction - The direction of sorting 'ASC' or 'DESC'
         * @param {boolean} doNotAddSorter Set to true when calling sort method while iterating through a list of sorters
         */

        sort: function(field, direction, doNotAddSorter) {
            var aVal, bVal;
            if (!field) {
                throw new Error('Fieldname is required.');
            }
            if (!this.data || this.data.length === 0) {
                return;
            }
            if (!this.sorters) {
                this.sorters = {};
            }
            if (!doNotAddSorter) {
                this.sorters[field] = direction;
            }

            if (direction && direction.toUpperCase() === 'DESC') {
                this.data.sort(function(a, b) {
                    aVal = a._transform(field);
                    bVal = b._transform(field);
                    if (aVal < bVal) {
                        return 1;
                    } else if (aVal > bVal) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
            } else {
                this.data.sort(function(a, b) {
                    aVal = a._transform(field);
                    bVal = b._transform(field);
                    if (aVal > bVal) {
                        return 1;
                    } else if (aVal < bVal) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
            }

        },
        /**
         * This method returns the proxy object used by the store.
         * @returns {object} proxy - The proxy object
         */

        getProxy: function() {
            return this.settings.proxy;
        },
        /**
         * This method can be used to add a row to the store. Only one row can be added at a time.
         * @method
         * @public
         * @param {object} row - The row to be inserted
         */
        add: function(row) {
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
        },
        /**
         * This method can be used to add a row to the store at a given index. Only one row can be added at a time.
         * @method
         * @public
         * @param {object} row - The row to be inserted
         * @param {integer} index - The position at which to be inserted
         */
        insertAt: function(row, index) {
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
        },
        /**
         * This method can be used to add a row to the store at a given index. Only one row can be added at a time.
         * @method
         * @public
         * @param {function} fn - The value of each row is passed to this function. The first row to return true is removed
         */
        remove: function(fn) {
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
        },
        /**
         * This method can be used to remove a row from the store at a given index. Only one row can be removed at a time.
         * @method
         * @public
         * @param {integer} index - Index of the row to be removed
         */
        removeAt: function(index) {
            var tmp;
            if (this.data.length === 0) {
                return false;
            }
            tmp = this.data.splice(index, 1);
            if (tmp.length > 0) {
                this.count--;
            }
            return tmp;

        },
        /**
         * This method can be used to remove all rows from the store.
         * @method
         * @public
         * @returns {array} rows - The rows removed
         */
        removeAll: function() {
            var data = this.data;
            this.count = 0;
            return data.splice(0, data.length);
        },
        /**
         * This method returns the object at a given index
         * @method
         * @public
         * @param {integer} index - Index of the row to be retrieved
         */
        getAt: function(index) {
            return this.data[index];

        },
        /**
         * This method is used to iterate through a store
         * @method
         * @public
         * @param {function} iterator - The iterator function
         */
        each: function(iterator) {
            var data = this.data,
                i, j;
            for (i = 0, j = data.length; i < j; i++) {
                if (iterator.call(this, i, data[i]) === false) {
                    break;
                }
            }
        },
        /**
         * This method is used to find a record within a store
         * @method
         * @public
         * @param {string} field - The name of the field to search with
         * @param {string} value - The value of the field to search with
         * @param {boolean} caseSensitive - If set to true performs a case sensitive match, defaults to false
         * @param {boolean} anyMatch - If set to true finds a string even if a substring match is true, defaults to false
         * @returns {object} record - The record instance(s) or null
         */
        find: function(field, value, caseSensitive, anyMatch) {
            var rows = [],
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
                    rows.push(val);
                }
            });
            return rows.length === 0 ? null : rows.length === 1 ? rows[0] : rows;
        },
        /**
         * This method is used to find a record within a store using the record id
         * @method
         * @public
         * @param {string} id - The id of the field to search with
         * @returns {object} record - The record instance or null
         */
        findById: function(id) {
            var row = null;
            this.each(function(i, val) {
                if (val.recordId === id) {
                    row = val;
                    return false;
                }
            });
            return row;
        }
    });
    JGrid.Store = Store;
}(jQuery));