/*! Copyright Parameswaran.V

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/

(function($) {
	/**
	 * Onservable class | interface
	 */

	function EventListener() {}

	/**
	 * Additional method to add event listeners
	 * @public
	 * @param  {string}   event - Name of the event
	 * @param  {Function} fn    - Callback function
	 * @param  {[type]}   scope - Optional scope to be used for the callback
	 */
	EventListener.prototype.on = function(event, fn, scope) {
		if(!event){
			throw new Error('Event name is required.');
		}
		if (this.eventMap[event] === undefined || this.eventMap[event] === null) {
			this.eventMap[event] = [];
		}
		this.eventMap[event].push({
			isPrivate: false,
			fn: fn,
			scope: scope
		});

	};

	/**
	 * Additional method to remove event listeners
	 * @public
	 * @param  {string}   event - Name of the event
	 * @param  {Function | string} fn    - Callback function
	 */
	EventListener.prototype.off = function(event, fn) {
		var eMap = this.eventMap[event],
			targetIndex,
			fnName;
		if (!eMap) {
			return;
		}
		if (typeof fn === 'function') {
			fnName = fn.name;
		} else {
			fnName = fn;
		}


		$.each(eMap, function(i, val) {
			if (fnName === val.fn.name) {
				targetIndex = i;
				return false;
			}
		});
		eMap.splice(targetIndex, 1);
	};

	/**
	 * Triggers a custom event on the Object passed
	 * @param  {string} event     - Name of the event
	 * @param  {array} eventArgs - Arguments to be passed to the event
	 */
	EventListener.prototype.trigger = function(event, eventArgs) {
		var eMap = this.eventMap[event],
			scope,
			retVal;
		if (!eMap) {
			return;
		}
		$.each(eMap, function(i, val) {
			scope = val.scope || eventArgs[0];
			retVal = val.fn.apply(scope, eventArgs);
		});
		return (retVal === false) ? retVal : true;
	};

	window.EventListener = EventListener;

}(jQuery));

/**
 * Grid JS
 */

(function($) {
	'use strict';

	var tableTemplate = '<table class="jgrid-table"><thead><tr>{{#.}}<td>{{header}}</td>{{/.}}</tr></thead>' +
		'<tbody class="jgrid-table-body"></tbody></table>',
		rowTemplate = '{{#.}}<tr class="jgrid-table-row">{{#columns}}<td>{{.}}</td>{{/columns}}</tr>{{/.}}',
		attachEvents;
	/**
	 * The Grid constructor. Used to create an instance of the grid.
	 * @param {object} store - The store instance that needs to be bound to the grid.
	 * @param {array} columns - An array of column configurations. Pass in the path to the columns object example "data.columns".
	 * @param {HTML element | string | object } target - The target element onto which the grid needs to be rendered
	 * @param {object} templates - An optional object of templates to be used to render the table
	 * @param {object} options - Additional set of options to be passed to the grid.
	 */

	function Grid(store, options) {
		var me = this;
		/**
		 * Constructor method
		 * @private
		 */

		function init() {
			var defaults = {
				'templates': {
					'tableTpl': tableTemplate,
					'rowTpl': rowTemplate
				}
			},
				defaultTemplates,
				settings,
				listeners,
				maskEl,
				loaderEl,
				loaderElLeft,
				loaderElTop,
				columns,
				target;

			me.settings = settings = $.extend(true, defaults, options);
			columns = settings.columns;
			target = settings.target;

			if (!(store instanceof Store)) {
				throw new Error('First argument should be an instance of Store');
			}
			if (typeof columns !== 'string' && !(columns instanceof Array)) {
				throw new Error('Columns should be an array of column configs or should be a path to the columns object in the store.');
			}
			if (!target) {
				throw new Error('Invalid target');
			}

			me.store = store;
			me.columns = columns;
			me.el = typeof target === 'string' ? $('#' + target) : $(target);
			me.templates = settings.templates;
			me.eventMap = {};

			// me.templates = $.extend(defaultTemplates, templates);

			/*Update the grid on init*/
			if (!settings.deferUpdate) {
				me.load();
			}
		}
		init();
	}

	/**
	 * @private
	 * @param  {string} str - A string indicating the path to the columns object
	 * @param {object} store - The store instance
	 * @return {array}  col - The columns object
	 */

	function getColumnsFromPath(str, store, gridColumns) {
		var rootData,
			root,
			idx = -1,
			data = store.rawData,
			columns,
			mergedColumns = [],
			i = 0,
			j;

		root = store.proxy.root;
		if (root.indexOf('[') >= 0) {
			idx = root.substring(root.indexOf('[') + 1, root.indexOf(']'));
			idx = parseInt(idx, 10);
			root = root.substring(0, root.indexOf('['));
		}
		rootData = root ? data[root] : data;
		if (idx >= 0) {
			rootData = rootData[idx];
		}

		if ($.isEmptyObject(rootData)) {
			throw new Error('Invalid root');
		}
		columns = rootData[str];
		if (!columns) {
			throw new Error('Invalid columns');
		}

		for (j = gridColumns.length; i < j; i++) {
			mergedColumns[i] = $.extend(true, gridColumns[i], columns[i]);
		}
		return mergedColumns;
	}
	/**
	 * Method used to attach events to the grid
	 * @protected
	 * @param  {string} eventName - Attaches the specified event to the grid.
	 */

	attachEvents = function(eventName) {
		var me = this,
			rows,
			onRowClickFn;

		onRowClickFn = function(e) {
			var $row = $(this),
				record,
				row;

			row = this;
			record = me.store.findById($row.attr('data-id'));
			me.trigger(eventName, [me, record, row]);
		};
		if (eventName === 'rowclick') {
			this.gridEl.on('click', 'tr.jgrid-table-row', onRowClickFn);

		}
	};

	/*
	 * Grid extends EventListener
	 */
	Grid.prototype = new EventListener();
	Grid.prototype.constructor = Grid;

	/**
	 * Used to render the grid
	 * @method
	 * @protected
	 */
	Grid.prototype._renderGrid = function() {
		var tableTemplate = this.templates.tableTpl,
			headerFragment,
			bodyFragment,
			columns = this.columns,
			store = this.store,
			i,
			j = columns.length,
			gridClassName,
			gridEl,
			beforeRenderBool = true;

		/**
		 * Remove any existing instances of the grid
		 */
		if (this.gridEl) {
			this.gridEl.remove();
		}

		/**
		 * Render the grid head
		 */
		headerFragment = Mustache.render(tableTemplate, this.columns);


		/**
		 * Render the grid body
		 */
		bodyFragment = this._createBodyFragment();


		/**
		 * Grid post processing - attaching classes, events etc
		 */
		gridEl = this.el.find('table');
		if (this.settings.className) {
			gridClassName = this.settings.className;
			if (gridClassName instanceof Array) {
				for (i = 0, j = gridClassName.length; i < j; i++) {
					gridEl.addClass(gridClassName[i]);
				}
			} else {
				gridEl.addClass(gridClassName);
			}
		}
		if (this.settings.id) {
			gridEl.attr('id', this.settings.id);

		}


		beforeRenderBool = this.trigger('beforerender', [this.el, [headerFragment, bodyFragment]]);
		if (beforeRenderBool === false) {
			return;
		}

		this.el.append(headerFragment);
		this.el.find('tbody.jgrid-table-body').append(bodyFragment);

		this.gridEl = this.el.find('table');
		attachEvents.call(this, 'rowclick');
		this.trigger('afterrender', [this.el, this.el.find('table')]);

	};

	/** 
	 * Creates the table body fragment
	 * @return {HTML DocumentFragment Object}
	 */
	Grid.prototype._createBodyFragment = function() {
		var bodyFragment,
			rowTemplate = this.templates.rowTpl,
			rows = [],
			columns = this.columns,
			groups,
			columnObject,
			rowObj,
			store,
			i,
			j = columns.length,
			k, l,
			colValue,
			colName,
			groupColName,
			renderer,
			filter;


			store = this.store;
			filter = store.filter;

			if(filter.field && filter.value){
				store = $(store.find(filter.field,filter.value));
			}
			
		/**
		 * Render the grid body
		 */
		store.each(function(idx, val) {
			rowObj = [];
			for (i = 0; i < j; i++) {
				/*
				Handle group logic.
				 */
				if (!columns[i].dataIndex && columns[i].groups.length > 0) {
					groups = columns[i].groups;
					colName = columns[i].header;
					colName = colName.replace(/\s/g, '').toLowerCase();
					rowObj[colName] = [];
					for (k = 0, l = groups.length; k < l; k++) {
						groupColName = groups[k].dataIndex;
						colValue = val.get(groupColName);
						if (groups[k].renderer) {
							renderer = groups[k].renderer;
						} else if (columns[i].renderer) {
							renderer = columns[i].renderer;
						} else {
							renderer = null;
						}
						if (renderer && typeof renderer === 'function') {
							colValue = renderer(colValue, val);
						}
						rowObj[colName][k] = colValue;
					}
				} else {
					colName = columns[i].dataIndex;
					colValue = val.get(colName);
					renderer = columns[i].renderer;
					if (renderer && typeof renderer === 'function') {
						colValue = renderer(colValue, val);
					}
					rowObj.push(colValue);
				}

			}
			rows.push({
				columns: rowObj,
				recordId: val.recordId
			});

		});
		return Mustache.render(rowTemplate, rows);
	};

	/**
	 * This method can be used to update the grid by calling the store's load method
	 * @method
	 * @public
	 * @param {string} url - The new url for loading the store
	 * @param {object} params - The new set of paramaters to be sent along with the request for loading the store
	 */
	Grid.prototype.load = function(url, params) {
		var args = Array.prototype.slice.call(arguments),
			me = this,
			_onStoreLoad;


		_onStoreLoad = function onStoreLoad() {

			if (me.columns === true) {
				me.columns = getColumnsFromPath(me.columns, me.store);
			}
			me._renderGrid();
			me.off('load', _onStoreLoad);
		};

		this.store.on('load', _onStoreLoad);
		this.store.load.apply(this.store, args);
	};

	/** 
	 * Function to be called whenever there is a change in the grid's store.
	 */
	Grid.prototype.updateGridContent = function() {
		this.gridEl.find('tbody.jgrid-table-body').html(this._createBodyFragment());
	};

	/**
	 * Used to destroy the grid
	 * @method
	 * @public
	 */
	Grid.prototype.destroy = function() {
		this.gridEl.empty();
		this.gridEl.remove();
		if (this.maskEl) {
			this.maskEl.remove();
		}
	};

	/**
	 * Used to empty the grid
	 * @method
	 * @protected
	 */
	Grid.prototype.empty = function() {
		this.gridEl.remove();
	};

	/**
	 * Call the underlying store's sort method
	 * @param  {String} field
	 * @param  {String} dir
	 */
	Grid.prototype.sort = function(field,dir){
		this.store.sort(field,dir);
		this.updateGridContent();
	};

	/**
	 * Filter the store based on the field and value
	 * @param  {string} field
	 * @param  {string} value
	 */
	Grid.prototype.filter = function(field,value){
		this.store.filter.field = field;
		this.store.filter.value = value;
		this.updateGridContent();
	};


	Grid.prototype.mask = function() {

	};

	Grid.prototype.unmask = function() {

	};
	window.Grid = Grid;
}(jQuery));

/** Model JS*/
(function($) {
    'use strict';
    /**
     * Defines the model for the grid.
     * @constructor
     * @param {array} fields - An array of field specifications
     * @returns {object} model - Returns the current model instance
     */

    function Model(fields, hasMany) {
        var modelFields = [],
            me = this;

        function init() {
            var i,
                j,
                field,
                fieldInstance,
                ts = new Date().getTime(),
                mapAssign = function(val, i) {
                    fieldInstance[i] = val;
                };

            if (!fields || !(fields instanceof Array)) {
                throw new Error('Fields is undefined or improper. Correct usage : [{name:"FieldOne"},{name:"FieldTwo"}]');
            }
            j = fields.length;
            for (i = 0; i < j; i++) {
                field = fields[i];
                fieldInstance = {};
                $.map(field, mapAssign);
                modelFields.push(fieldInstance);
            }
            me.modelId = '_model' + ts;
            me.fields = modelFields;
            me.length = modelFields.length;

            Record.prototype.Model = me;
            if (hasMany && typeof hasMany === 'boolean') {
                me.hasMany = {};
                me.hasMany.mapping = 'children';
            } else if (hasMany) {
                me.hasMany = hasMany;
                me.hasMany.mapping = hasMany.mapping || 'children';
            }
        }

        init();
    }

    /**
     * Creates a single record instance
     * @constructor
     * @protected
     * @param {array} - The row object
     * @returns {object} - The record object
     */

    function Record(row, fields, hasMany) {
        var k,
            l,
            field,
            tmpFieldObj = this,
            fieldValue,
            fieldName;

        tmpFieldObj.data = {};

        for (k = 0, l = fields.length; k < l; k++) {
            field = fields[k];
            fieldName = field.name;
            fieldValue = row[fieldName];

            if (typeof field.convert === 'function') {
                fieldValue = field.convert(fieldValue);
            }

            if (hasMany) {
                tmpFieldObj.data[hasMany.mapping] = row[hasMany.mapping] || null;
            }

            tmpFieldObj.data[fieldName] = fieldValue;
        }
    }



    /**
     * Retrieves the value of a given field in a record
     * @param {string} field - The field name
     * @returns {mixed} value - The field value
     */
    Record.prototype.get = function(field) {
        return this.data[field] || null;
    };


    /**
     * Transforms the value of the field according to its data-type.
     * @private
     * @param  {mixed} field
     * @return {mixed} The transformed value
     */
    Record.prototype._transform = function(field) {
        var model = this.Model,
            fieldDescriptor;

        fieldDescriptor = $.grep(model.fields, function(value) {
            return value.name === field;
        })[0];
        if(!fieldDescriptor){
            throw new Error('Field is empty or undefined');
        }
        switch (fieldDescriptor.type) {
            case 'number':
                return parseInt(this.get(field), 10);
            case 'float':
                return parseFloat(this.get(field), 10);
            case 'currency':
                return parseInt(this.get(field).replace(/[^\d]/gi, ''), 10);
            default:
                return this.get(field);

        }

    };

    /**
     * This method can be used to create a new record to be inserted into the store.
     * @params {array} row - The new (unprocessed) row to be created
     * @params {array} row - The new row to be inserted after processing, using the model
     */
    Model.prototype.create = function(row) {
        return new Record(row, this.fields, this.hasMany);
    };


    window.Model = Model;
}(jQuery));

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
            me.sorters = settings.sorters;
            me.filter = settings.filter || {};

        }
        init();

    }

    /**
     * @method
     * @protected
     */

    getData = function() {
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

    onAjaxSuccess = function(data) {
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

    processData = function(data) {
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
        return this;
    };

    /**
     * This method can be used to sort the store
     * @method
     * @public
     * @param {string} field - The field name with respect to which the sorting needs to be done
     * @param {string} direction - The direction of sorting 'ASC' or 'DESC'
     * @param {boolean} doNotAddSorter Set to true when calling sort method while iterating through a list of sorters
     */

    Store.prototype.sort = function(field, direction, doNotAddSorter) {
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
     * @returns {object} record - The record instance(s) or null
     */
    Store.prototype.find = function(field, value, caseSensitive, anyMatch) {
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