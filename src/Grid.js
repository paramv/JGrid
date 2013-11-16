/**
 * Grid JS
 */

(function($) {
	'use strict';

	var tableTemplate = '<table class="jgrid-table"><thead><tr>{{#.}}<td>{{header}}</td>{{/.}}</tr></thead>' +
		'<tbody class="jgrid-table-body"></tbody></table>',
		rowTemplate = '{{#.}}<tr class="jgrid-table-row" data-id="{{recordId}}">{{#columns}}<td>{{.}}</td>{{/columns}}</tr>{{/.}}',
		Utils,generateUUID,Class,EventListener,Store,
		Grid;


    Utils = JGrid.Utils;
    generateUUID = Utils.generateUUID;
    Class = Utils.Class;
    EventListener = JGrid.EventListener;
    Store = JGrid.Store;


	/**
	 * The Grid constructor. Used to create an instance of the grid.
	 * @param {object} store - The store instance that needs to be bound to the grid.
	 * @param {array} columns - An array of column configurations. Pass in the path to the columns object example "data.columns".
	 * @param {HTML element | string | object } target - The target element onto which the grid needs to be rendered
	 * @param {object} templates - An optional object of templates to be used to render the table
	 * @param {object} options - Additional set of options to be passed to the grid.
	 */

	Grid = EventListener.extend({
		init: function(store, options) {
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
				target,
				me = this;

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
		},
		/**
		 * @protected
		 * @param  {string} str - A string indicating the path to the columns object
		 * @param {object} store - The store instance
		 * @return {array}  col - The columns object
		 */

		__getColumnsFromPath:function(str, store, gridColumns) {
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
		},
		/**
		 * Method used to attach events to the grid
		 * @protected
		 * @param  {string} eventName - Attaches the specified event to the grid.
		 */

		__attachEvents: function(eventName) {
			var me = this,
				rows,
				onRowClickFn;

			if (eventName === 'rowclick') {
				onRowClickFn = function(e) {
				var $column = $(this),
					record,
					row,
					column;

				column = this;
				row = $column.parents('tr.jgrid-table-row');
				record = me.store.findById($(row).attr('data-id'));
				me.trigger(eventName, [me, record, column,row]);
			};
				this.gridEl.on('click', 'tr.jgrid-table-row td', onRowClickFn);

			}
		},
		/**
		 * Used to render the grid
		 * @method
		 * @protected
		 */
		__renderGrid: function() {
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
			bodyFragment = this.__createBodyFragment();


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


			beforeRenderBool = this.trigger('beforerender', [this, [this.el,headerFragment, bodyFragment]]);
			if (beforeRenderBool === false) {
				return;
			}

			this.el.append(headerFragment);
			this.el.find('tbody.jgrid-table-body').append(bodyFragment);

			this.gridEl = this.el.find('table');
			this.__attachEvents( 'rowclick');
			this.trigger('afterrender', [this,this.el, this.el.find('table')]);

		},
		/** 
		 * Creates the table body fragment
		 * @return {HTML DocumentFragment Object}
		 */
		__createBodyFragment: function() {
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

			if (filter.field && filter.value) {
				store = $(store.find(filter.field, filter.value));
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
		},
		/**
		 * This method can be used to update the grid by calling the store's load method
		 * @method
		 * @public
		 * @param {string} url - The new url for loading the store
		 * @param {object} params - The new set of paramaters to be sent along with the request for loading the store
		 */
		load: function(url, params) {
			var args = Array.prototype.slice.call(arguments),
				me = this,
				_onStoreLoad;


			_onStoreLoad = function onStoreLoad() {

				if (me.columns === true) {
					me.columns = me.__getColumnsFromPath(me.columns, me.store);
				}
				me.__renderGrid();
				me.off('load', _onStoreLoad);
			};

			this.store.on('load', _onStoreLoad);
			this.store.load.apply(this.store, args);
		},
		/** 
		 * Function to be called whenever there is a change in the grid's store.
		 */
		updateGridContent: function() {
			this.gridEl.find('tbody.jgrid-table-body').html(this.__createBodyFragment());
		},
		/**
		 * Used to destroy the grid
		 * @method
		 * @public
		 */
		destroy: function() {
			this.gridEl.empty();
			this.gridEl.remove();
			if (this.maskEl) {
				this.maskEl.remove();
			}
		},
		/**
		 * Used to empty the grid
		 * @method
		 * @protected
		 */
		empty: function() {
			this.gridEl.remove();
		},
		/**
		 * Call the underlying store's sort method
		 * @param  {String} field
		 * @param  {String} dir
		 */
		sort: function(field, dir) {
			this.store.sort(field, dir);
			this.updateGridContent();
		},

		/**
		 * Filter the store based on the field and value
		 * @param  {string} field
		 * @param  {string} value
		 */
		filter: function(field, value) {
			this.store.filter.field = field;
			this.store.filter.value = value;
			this.updateGridContent();
		},
		mask: function() {

		},
		unmask: function() {

		}
	});
	JGrid.Grid = Grid;
}(jQuery));