/**
 * Grid JS
 */

(function($) {
	/**
	 * The Grid constructor. Used to create an instance of the grid.
	 * @param {object} store - The store instance that needs to be bound to the grid.
	 * @param {array} columns - An array of column configurations. Pass in the path to the columns object example "data.columns".
	 * @param {HTML element | string | object } target - The target element onto which the grid needs to be rendered
	 * @param {object} templates - An optional object of templates to be used to render the table
	 * @param {object} options - Additional set of options to be passed to the grid.
	 */

	function Grid(store, columns, target, templates, options) {
		var me = this;
		/**
		 * Constructor method
		 * @private
		 */

		function init() {
			var defaults = {},
				defaultTemplates,
				settings,
				listeners,
				maskEl,
				loaderEl,
				loaderElLeft,
				loaderElTop;

			if (!(store instanceof Store)) {
				throw new Error('First argument should be an instance of Store');
			}
			if (typeof columns !== 'string' && !(columns instanceof Array)) {
				throw new Error('Columns should be an array of column configs or should be a path to the columns object in the store.');
			}
			if (!target) {
				throw new Error('Invalid target');
			}

			defaultTemplates = {
				'table': 'view/table-template.mustache',
				'parentRow': 'view/parentrow-template.mustache',
				'childRow': 'view/childrow-template.mustache',
				'column': 'view/columns-template.mustache'
			};
			me.templates = $.extend(defaultTemplates, templates);
			me.settings = settings = $.extend(true, defaults, options);
			me.store = store;
			me.columns = columns || null;
			me.el = typeof target === 'string' ? $('#' + target) : $(target);
			me.eventMap = {};


			maskEl = $('<div class="cigrid-mask"></div>');
			maskEl.width(me.el.width());
			loaderEl = $('<div class="cigrid-loader"></div>');
			loaderElLeft = maskEl.width() / 2 - loaderEl.width() / 2;
			loaderElTop = 70;
			loaderEl.css({
				'position': 'absolute',
				'top': loaderElTop,
				'left': loaderElLeft
			});
			maskEl.append(loaderEl);

			me.maskEl = maskEl;
			if (me.settings.listeners) {
				listeners = me.settings.listeners;
				$.map(listeners, function(val, key) {
					me.on(key, val);
				});
			}

			if (!me.store.isStoreLoaded && !me.store.isStoreLoading && !me.store.autoLoad) {
				me.el.append(me.maskEl);
				me.store.load();
			}

		}
		init();
		if (me.store.isStoreLoaded) {
			if (typeof me.settings.mergeColumns === 'string') {
				me.columns = getColumnsFromPath(me.settings.mergeColumns, me.store, me.columns);
			}
			me.renderGrid();
		} else {
			me.store.on('load', function _onStoreLoaded() {
				me.maskEl.remove();
				if (typeof me.settings.mergeColumns === 'string') {
					me.columns = getColumnsFromPath(me.settings.mergeColumns, me.store, me.columns);
				}
				me.renderGrid();
				me.off('load', _onStoreLoaded);
			});
		}
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

	function attachEvents(eventName) {
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
			rows = this.gridEl.find('tr.cigrid-table-row');
			rows.on('click', onRowClickFn);

		}
	}

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
	Grid.prototype.renderGrid = function() {
		var tableTemplate = this.templates.table,
			rowTemplate = this.templates.parentRow,
			headerFragment,
			bodyFragment,
			rows = [],
			columns = this.columns,
			groups,
			columnObject,
			rowObj,
			store = this.store,
			i,
			j = columns.length,
			k, l,
			colValue,
			colName,
			groupColName,
			renderer,
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
		headerFragment = can.view(tableTemplate, this.columns);


		/**
		 * Render the grid body
		 */
		store.each(function(idx, val) {
			rowObj = {};
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
					rowObj[colName] = colValue;
				}

			}
			rows.push({
				columns: rowObj,
				recordId: val.recordId
			});

		});
		bodyFragment = can.view(rowTemplate, rows);


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
		this.el.find('tbody.cigrid-table-body').append(bodyFragment);

		this.gridEl = this.el.find('table');
		attachEvents.call(this, 'rowclick');
		this.trigger('afterrender', [this.el, this.el.find('table')]);

	};
	/**
	 * This method can be used to update the grid by calling the store's load method
	 * @method
	 * @public
	 * @param {string} url - The new url for loading the store
	 * @param {object} params - The new set of paramaters to be sent along with the request for loading the store
	 */
	Grid.prototype.update = function(url, params) {
		var args = Array.prototype.slice.call(arguments),
			me = this,
			_onStoreLoad;
		me.gridEl.remove();
		me.el.append(this.maskEl);

		_onStoreLoad = function onStoreLoad() {
			me.maskEl.remove();
			if (me.columns === true) {
				me.columns = getColumnsFromPath(me.columns, me.store);
			}
			me.renderGrid();
			me.off('load', _onStoreLoad);
		};

		this.store.on('load', _onStoreLoad);
		this.store.load.apply(this.store, args);
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
	window.Grid = Grid;
}(jQuery));