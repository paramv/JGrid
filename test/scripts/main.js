var model, store, grid,gridGrouped;
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
			s.sort('age', 'asc');
			console.log(s);
		}
	});

	grid = new Grid(store, {
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
		'target':'grid-one'
	});

	var tableTemplate = '<table class="jgrid-table"><thead><tr>{{#.}}<td><p>{{header}}</p>'+
						'<ul>{{#groups}}<li>{{.}}</li>{{/groups}}</ul>'+
						'</td>{{/.}}</tr></thead>' +
						'<tbody class="jgrid-table-body"></tbody></table>',
		rowTemplate = '{{#.}}<tr class="jgrid-table-row">{{#columns}}1<td><ul>{{#.}}<li>{{.}}</li>{{/.}}</ul></td>{{/columns}}</tr>{{/.}}',
		storeG;

	storeG = new Store(model, {
		'proxy': {
			'url': 'data/DataGrouped.json',
			'type': 'ajax',
			'root': 'data',
			'record': 'rows'
		}
	});

	gridGrouped = new Grid(storeG, {
		'columns': [{
			'header': 'Name',
			'groups':['First N','Last N'],
			'dataIndex': 'name',

		}, {
			'header': 'Location',
			'dataIndex': 'location',

		}],
		'templates':{
			'tableTpl':tableTemplate,
			'rowTpl':rowTemplate
		},
		'target':'grid-two'
	});

}());