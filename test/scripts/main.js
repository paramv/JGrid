var model, store, grid, gridGrouped, storeG, Model, Store, Grid;

Model = JGrid.Model;
Store = JGrid.Store;
Grid = JGrid.Grid;
(function() {
	model = new Model([{
		'name': 'name',
		'type': 'string'
	}, {
		'name': 'age',
		'type': 'number'
	}, {
		'name': 'location'
	}]);

	store = new Store(model, {
		'proxy': {
			'url': 'data/Data.json',
			'type': 'ajax',
			'root': 'data',
			'record': 'rows'
		},
		'load': function(s) {
			console.log(s);
		}
	});

	grid = new Grid({
		'store': {
			'proxy': {
				'url': 'data/Data.json',
				'type': 'ajax',
				'root': 'data',
				'record': 'rows'
			}
		},
		'columns': [{
			'header': 'Name',
			'dataIndex': 'name',

		}, {
			'header': 'Age',
			'dataIndex': 'age',

		}, {
			'header': 'Location',
			'dataIndex': 'location',

		}],
		'target': 'grid-one'
	});

	var tableTemplate = '<table class="jgrid-table"><thead><tr>{{#.}}<td><p>{{header}}</p>' +
		'<ul>{{#groups}}<li>{{.}}</li>{{/groups}}</ul>' +
		'</td>{{/.}}</tr></thead>' +
		'<tbody class="jgrid-table-body"></tbody></table>',
		rowTemplate = '{{#.}}<tr class="jgrid-table-row">{{#columns}}1<td><ul>{{#.}}<li>{{.}}</li>{{/.}}</ul></td>{{/columns}}</tr>{{/.}}',
		m2;
	m2 = new Model([{
		'name': 'name',
		'type': 'string'
	}, {
		'name': 'age',
		'type': 'number'
	}, {
		'name': 'location'
	}]);
	storeG = new Store(m2, {
		'proxy': {
			'url': 'data/DataGrouped.json',
			'type': 'ajax',
			'root': 'data',
			'record': 'rows'
		},
		'sorters': {
			'location': 'ASC'
		}
	});

	gridGrouped = new Grid({
		'store': storeG,
		'columns': [{
			'header': 'Name',
			'groups': ['First N', 'Last N'],
			'dataIndex': 'name',

		}, {
			'header': 'Location',
			'dataIndex': 'location',

		}],
		'templates': {
			'tableTpl': tableTemplate,
			'rowTpl': rowTemplate
		},
		'target': 'grid-two'
	});

}());